import io
import sys
import unittest
from pathlib import Path

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
from pptx.oxml.ns import qn
from pptx.util import Inches

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
from pptx_generator import _domain_rows, generate_pptx, plan_pptx
from pptx_layout import layout_map


class DomainViewTests(unittest.TestCase):
    def setUp(self):
        self.apps = [
            {"id": "a", "name": "Active Directory", "domain": "IT"},
            {"id": "b", "name": "Microsoft 365", "domain": "IT"},
            {"id": "c", "name": "Application isolée", "domain": "IT"},
            {"id": "d", "name": "Finance", "domain": "Finance"},
        ]
        self.flows = [
            {"from": "a", "to": "d", "label": "Sortant " + str(i)}
            for i in range(9)
        ] + [
            {"from": "d", "to": "a", "label": "Flux entrant"},
            {"from": "a", "to": "b", "label": "Flux interne"},
            {"from": "b", "to": "b", "label": "Boucle interne"},
            {"from": "b", "to": "d", "label": " ".join(["données"] * 40)},
        ]
        self.by_id = {a["id"]: a for a in self.apps}

    def test_domain_rows_cover_incoming_outgoing_internal_self_and_isolated(self):
        rows = _domain_rows("IT", self.apps[:3], self.by_id, self.flows)
        first_parts = [r for r in rows if r.get("part") == 1]
        self.assertEqual(len(first_parts), len(self.flows))
        incoming = next(r for r in rows if r.get("label") == "Flux entrant")
        self.assertEqual((incoming["left"], incoming["right"], incoming["source"]), ("a", "d", "d"))
        internal = next(r for r in rows if r.get("label") == "Flux interne")
        self.assertEqual((internal["left"], internal["right"]), ("a", "b"))
        self.assertTrue(any(r.get("label") == "Boucle interne" for r in rows))
        self.assertTrue(any(r["left"] == "c" and r["right"] is None for r in rows))
        long_rows = [r for r in rows if r.get("parts", 0) > 1]
        self.assertEqual(" ".join(r["label"].replace("\n", " ") for r in long_rows),
                         self.flows[-1]["label"])

    def test_export_has_separate_horizontal_lanes_and_all_flow_labels(self):
        template = Presentation()
        template.slide_width = Inches(10)
        template.slide_height = Inches(7.5)
        stream = io.BytesIO()
        template.save(stream)
        opts = {"sections": ["domain_detail"]}
        plan = plan_pptx(self.apps, self.flows, opts, io.BytesIO(stream.getvalue()), True)
        result = Presentation(io.BytesIO(generate_pptx(
            self.apps, self.flows, opts, io.BytesIO(stream.getvalue()), True)))
        self.assertEqual(len(result.slides), plan["count"])
        self.assertGreater(len(result.slides), 2)
        all_labels = []
        directions = {}
        for slide in result.slides:
            labels = [s for s in slide.shapes if s.name == "Libellé du flux"]
            lines = [s for s in slide.shapes if s.shape_type == MSO_SHAPE_TYPE.LINE]
            self.assertEqual(len(labels), len(lines))
            self.assertLessEqual(len(labels), 6)
            for line, label in zip(lines, labels):
                self.assertEqual(line.height, 0)
                self.assertLessEqual(label.top, line.top)
                self.assertGreaterEqual(label.top + label.height, line.top)
                self.assertLess(label.left, label.left + label.width)
                self.assertIsNotNone(line._element.find(".//" + qn("a:tailEnd")))
                directions.setdefault(label.text, line._element.spPr.xfrm.get("flipH") == "1")
            for prev, current in zip(labels, labels[1:]):
                self.assertLess(prev.top + prev.height, current.top)
            all_labels.extend(s.text for s in labels)
        for label in ["Flux entrant", "Flux interne", "Boucle interne"] + [f"Sortant {i}" for i in range(9)]:
            self.assertIn(label, all_labels)
        self.assertTrue(directions["Flux entrant"])
        self.assertFalse(directions["Flux interne"])
        self.assertFalse(directions["Sortant 0"])

    def test_default_template_generates_same_slide_plan(self):
        opts = {"sections": ["domain_detail"]}
        template = str(BACKEND / "assets" / "template.pptx")
        plan = plan_pptx(self.apps, self.flows, opts, template)
        result = Presentation(io.BytesIO(generate_pptx(self.apps, self.flows, opts, template)))
        self.assertEqual(len(result.slides), plan["count"])
        self.assertTrue(any(s.name == "Libellé du flux" for slide in result.slides for s in slide.shapes))

    def test_consolidated_views_include_all_flows_and_report_limits(self):
        opts = {"sections": ["carto_globale", "domain_view"]}
        stream = io.BytesIO()
        Presentation().save(stream)
        plan = plan_pptx(self.apps, self.flows, opts, io.BytesIO(stream.getvalue()), True)
        result = Presentation(io.BytesIO(generate_pptx(
            self.apps, self.flows, opts, io.BytesIO(stream.getvalue()), True)))
        self.assertEqual(len(result.slides), 3)
        self.assertEqual(len(result.slides), plan["count"])
        global_slide = result.slides[0]
        self.assertEqual(len([s for s in global_slide.shapes if s.name.startswith("Flux ")]), len(self.flows))
        self.assertEqual(len([s for s in global_slide.shapes if s.name.startswith("Libellé du flux ")]), len(self.flows))
        it_slide = next(s for s in result.slides if any(
            sh.has_text_frame and sh.text == "DOMAINE — IT" for sh in s.shapes))
        self.assertEqual(len([s for s in it_slide.shapes if s.name.startswith("Flux ")]), len(self.flows))
        self.assertTrue(plan["slides"][0]["warnings"])
        self.assertTrue(any(sh.has_text_frame and "conflits" in sh.text.lower()
                            for sh in global_slide.shapes))

    def test_missing_endpoint_and_self_loop_are_explicit(self):
        flows = [{"from": "a", "to": "a", "label": "Boucle"},
                 {"from": "a", "to": "missing", "label": "Invalide"}]
        layout = layout_map(self.apps, flows)
        self.assertEqual(layout["missing"], 1)
        self.assertEqual(len(layout["routes"]), 1)
        self.assertGreaterEqual(len(layout["routes"][0]["points"]), 3)

    def test_domain_scope_keeps_incoming_and_outgoing_external_links(self):
        opts = {"sections": ["carto_globale", "domain_view", "domain_detail"],
                "contextApps": self.apps, "contextFlows": self.flows}
        scoped_apps = self.apps[:3]
        scoped_flows = [f for f in self.flows if f["from"] in ("a", "b", "c") and f["to"] in ("a", "b", "c")]
        stream = io.BytesIO()
        Presentation().save(stream)
        deck = Presentation(io.BytesIO(generate_pptx(
            scoped_apps, scoped_flows, opts, io.BytesIO(stream.getvalue()), True)))
        self.assertEqual(len([s for s in deck.slides[0].shapes if s.name.startswith("Flux ")]), len(scoped_flows))
        self.assertEqual(len([s for s in deck.slides[1].shapes if s.name.startswith("Flux ")]), len(self.flows))
        self.assertTrue(any(s.name == "Finance" for s in deck.slides[1].shapes))
        self.assertGreater(len(deck.slides), 2)

    def test_global_flow_option_preserves_other_sections(self):
        opts = {"sections": ["carto_globale", "domain_view", "flux_table"],
                "showGlobalFlows": False}
        stream = io.BytesIO()
        Presentation().save(stream)
        plan = plan_pptx(self.apps, self.flows, opts, io.BytesIO(stream.getvalue()), True)
        result = Presentation(io.BytesIO(generate_pptx(
            self.apps, self.flows, opts, io.BytesIO(stream.getvalue()), True)))
        self.assertEqual(len(result.slides), plan["count"])
        global_slide = result.slides[0]
        self.assertFalse(any(s.name.startswith(("Flux ", "Libellé du flux ")) for s in global_slide.shapes))
        for app in self.apps:
            self.assertTrue(any(s.name == app["name"] for s in global_slide.shapes))
        self.assertTrue(any(s.name.startswith("Flux ") for s in result.slides[1].shapes))
        self.assertIn("flux_table", [slide["section"] for slide in plan["slides"]])
        self.assertEqual(plan["slides"][0]["warnings"], [])

    def test_synthesis_follows_project_type(self):
        apps = [
            {"id": "a", "name": "A", "domain": "IT", "criticality": "Haute",
             "statusD1": "Maintien", "statusD2": "Transfert", "statut": "Actif", "hosting": "Cloud"},
            {"id": "b", "name": "B", "domain": "Finance", "statut": "Legacy", "hosting": "On-premise"},
        ]
        flows = [{"from": "a", "to": "b", "label": "Dépendance"}]
        stream = io.BytesIO()
        Presentation().save(stream)
        for project_type in ("deal", "standard"):
            opts = {"sections": ["synthese", "executive"], "projectType": project_type}
            result = Presentation(io.BytesIO(generate_pptx(
                apps, flows, opts, io.BytesIO(stream.getvalue()), True)))
            self.assertEqual(len(result.slides), 2)
            messages = [s.text for s in result.slides[0].shapes if s.has_text_frame]
            executive = [s.text for s in result.slides[1].shapes if s.has_text_frame]
            self.assertIn("Criticité haute / critique", executive)
            self.assertIn("Criticité non renseignée", executive)
            self.assertIn("CONCENTRATION DES FLUX", messages)
            if project_type == "deal":
                self.assertIn("TRAJECTOIRE ET CRITICITÉ", messages)
                self.assertIn("Day 1 renseigné", messages)
                self.assertIn("VISION CLOSING — DAY 1", executive)
                self.assertIn("VISION CIBLE — DAY 2", executive)
                self.assertNotIn("STATUT DU PORTEFEUILLE", executive)
            else:
                self.assertIn("STATUT DU PORTEFEUILLE", executive)
                self.assertIn("HÉBERGEMENT", executive)
                self.assertIn("Actif", executive)
                self.assertIn("Cloud", executive)
                self.assertNotIn("VISION CLOSING — DAY 1", executive)
                self.assertNotIn("VISION CIBLE — DAY 2", executive)


if __name__ == "__main__":
    unittest.main()
