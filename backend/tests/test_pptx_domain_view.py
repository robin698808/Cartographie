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

    def test_dense_views_fall_back_to_aggregate_and_complete_details(self):
        opts = {"sections": ["carto_globale", "domain_view"]}
        stream = io.BytesIO()
        Presentation().save(stream)
        plan = plan_pptx(self.apps, self.flows, opts, io.BytesIO(stream.getvalue()), True)
        result = Presentation(io.BytesIO(generate_pptx(
            self.apps, self.flows, opts, io.BytesIO(stream.getvalue()), True)))
        self.assertEqual(len(result.slides), plan["count"])
        global_slide = result.slides[0]
        matrix = next(s.table for s in global_slide.shapes if s.has_table)
        self.assertEqual(sum(int(matrix.cell(r, c).text)
                             for r in range(1, len(matrix.rows))
                             for c in range(1, len(matrix.columns))), len(self.flows))
        self.assertTrue(plan["slides"][0]["warnings"])
        self.assertTrue(any(sh.has_text_frame and "agrégée" in sh.text.lower()
                            for sh in global_slide.shapes))
        sections = [item["section"] for item in plan["slides"]]
        self.assertIn("recap_apps", sections)
        self.assertIn("flux_table", sections)
        table_text = [cell.text for slide in result.slides for shape in slide.shapes
                      if shape.has_table for row in shape.table.rows for cell in row.cells]
        for flow in self.flows:
            self.assertIn(flow["label"], table_text)
        self.assertTrue(any("Vue détaillée utilisée" in w for slide in plan["slides"]
                            for w in slide["warnings"]))

    def test_missing_endpoint_and_self_loop_are_explicit(self):
        flows = [{"from": "a", "to": "a", "label": "Boucle"},
                 {"from": "a", "to": "missing", "label": "Invalide"}]
        layout = layout_map(self.apps, flows)
        self.assertEqual(layout["missing"], 1)
        self.assertEqual(len(layout["routes"]), 1)
        self.assertGreaterEqual(len(layout["routes"][0]["points"]), 3)
        stream = io.BytesIO()
        Presentation().save(stream)
        opts = {"sections": ["domain_view", "domain_detail"]}
        plan = plan_pptx(self.apps, flows, opts, io.BytesIO(stream.getvalue()), True)
        deck = Presentation(io.BytesIO(generate_pptx(
            self.apps, flows, opts, io.BytesIO(stream.getvalue()), True)))
        labels = [shape.text for slide in deck.slides for shape in slide.shapes
                  if shape.name == "Libellé du flux"]
        self.assertIn("Invalide", labels)
        self.assertTrue(any("sans application visible" in w for slide in plan["slides"]
                            for w in slide["warnings"]))
        self.assertTrue(any(shape.has_text_frame and "inconnue" in shape.text.lower()
                            for slide in deck.slides for shape in slide.shapes))

    def test_matrix_pagination_and_no_duplicate_automatic_sections(self):
        apps = [{"id": str(i), "name": f"Application très longue {i}", "domain": f"Domaine {i}"}
                for i in range(6)]
        flows = [{"from": str(i), "to": str((i + 1) % 6), "label": f"Flux {i}"}
                 for i in range(6)]
        stream = io.BytesIO()
        Presentation().save(stream)
        opts = {"sections": ["carto_globale", "flux_table", "recap_apps", "end"]}
        plan = plan_pptx(apps, flows, opts, io.BytesIO(stream.getvalue()), True)
        deck = Presentation(io.BytesIO(generate_pptx(
            apps, flows, opts, io.BytesIO(stream.getvalue()), True)))
        self.assertEqual(plan["count"], len(deck.slides))
        global_slides = [slide for slide in plan["slides"] if slide["section"] == "carto_globale"]
        self.assertEqual(len(global_slides), 4)
        matrices = [next(shape.table for shape in deck.slides[i].shapes if shape.has_table)
                    for i in range(4)]
        self.assertEqual(sum(int(t.cell(r, c).text) for t in matrices
                             for r in range(1, len(t.rows)) for c in range(1, len(t.columns))), 6)
        sections = [slide["section"] for slide in plan["slides"]]
        self.assertEqual(sections.count("flux_table"), 1)
        self.assertEqual(sections.count("recap_apps"), 1)
        self.assertEqual(sections[-1], "end")

    def test_domain_scope_keeps_incoming_and_outgoing_external_links(self):
        opts = {"sections": ["carto_globale", "domain_view", "domain_detail"],
                "contextApps": self.apps, "contextFlows": self.flows}
        scoped_apps = self.apps[:3]
        scoped_flows = [f for f in self.flows if f["from"] in ("a", "b", "c") and f["to"] in ("a", "b", "c")]
        stream = io.BytesIO()
        Presentation().save(stream)
        deck = Presentation(io.BytesIO(generate_pptx(
            scoped_apps, scoped_flows, opts, io.BytesIO(stream.getvalue()), True)))
        shapes = [shape for slide in deck.slides for shape in slide.shapes]
        labels = [shape.text for shape in shapes if shape.name == "Libellé du flux"]
        self.assertIn("Flux entrant", labels)
        self.assertIn("Sortant 0", labels)
        self.assertTrue(any(s.name == "Finance" for s in shapes))

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
        self.assertTrue(any(s.name == "Libellé du flux" for slide in list(result.slides)[1:]
                            for s in slide.shapes))
        self.assertIn("flux_table", [slide["section"] for slide in plan["slides"]])
        self.assertNotIn("nombre de flux", " ".join(
            s.text for s in global_slide.shapes if s.has_text_frame).lower())
        self.assertNotIn("flux_table", [s["section"] for s in plan["slides"]
                                        if "Détail ajouté pour compléter la vue globale agrégée" in s["warnings"]])

    def test_sparse_map_retains_native_flows_and_font_size(self):
        apps = [{"id": "a", "name": "A", "domain": "IT"},
                {"id": "b", "name": "B", "domain": "IT"}]
        flows = [{"from": "a", "to": "b", "label": "API"}]
        stream = io.BytesIO()
        template = Presentation()
        template.slide_width, template.slide_height = Inches(10), Inches(7.5)
        template.save(stream)
        opts = {"sections": ["carto_globale"]}
        plan = plan_pptx(apps, flows, opts, io.BytesIO(stream.getvalue()), True)
        deck = Presentation(io.BytesIO(generate_pptx(apps, flows, opts, io.BytesIO(stream.getvalue()), True)))
        self.assertEqual(plan["count"], len(deck.slides))
        self.assertEqual(plan["count"], 1)
        shapes = list(deck.slides[0].shapes)
        self.assertTrue(any(s.name.startswith("Flux ") for s in shapes))
        for name in ("A", "B", "Libellé du flux 1"):
            shape = next(s for s in shapes if s.name == name)
            self.assertGreaterEqual(shape.text_frame.paragraphs[0].runs[0].font.size.pt, 9.99)

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

    def test_new_export_structure_and_complete_flow_properties(self):
        apps = [{"id": str(i), "name": f"Application {i}", "domain": f"Domaine {i // 4}",
                 "statusD1": "Maintien", "statusD2": "Transfert", "statut": "Actif"}
                for i in range(10)]
        flows = [{"id": "flux-1", "from": "0", "to": "1", "label": "Interne",
                  "description": "Description longue " * 40, "metadata": {"source": "inventaire"},
                  "enabled": False},
                 {"id": "flux-2", "from": "1", "to": "5", "label": "Externe"}]
        sections = ["cover", "key_graphs", "key_information", "synthese", "portfolio_map",
                    "domain_view", "domain_flow_matrix", "flow_information"]
        stream = io.BytesIO()
        Presentation().save(stream)
        opts = {"sections": sections, "projectType": "deal"}
        plan = plan_pptx(apps, flows, opts, io.BytesIO(stream.getvalue()), True)
        deck = Presentation(io.BytesIO(generate_pptx(apps, flows, opts, io.BytesIO(stream.getvalue()), True)))
        self.assertEqual(len(deck.slides), plan["count"])
        self.assertEqual(list(dict.fromkeys(s["section"] for s in plan["slides"])), sections)
        maps = [deck.slides[i] for i, item in enumerate(plan["slides"]) if item["section"] == "portfolio_map"]
        self.assertEqual(len(maps), 1)
        texts = [shape.text for slide in maps for shape in slide.shapes if shape.has_text_frame]
        for app in apps:
            self.assertIn(app["name"], texts)
            for field in ("statusD1", "statusD2"):
                self.assertTrue(any(shape.name == f"Statut {field} {app['id']}"
                                    for shape in maps[0].shapes))
        self.assertIn("Maintien", texts)
        self.assertIn("Transfert", texts)
        self.assertTrue(any("D1 à gauche, D2 à droite" in text for text in texts))
        self.assertFalse(any(shape.name.startswith("Flux ") for slide in maps for shape in slide.shapes))
        matrix_index = next(i for i, s in enumerate(plan["slides"]) if s["section"] == "domain_flow_matrix")
        matrix = next(shape.table for shape in deck.slides[matrix_index].shapes if shape.has_table)
        self.assertEqual(sum(int(matrix.cell(r, c).text) for r in range(1, len(matrix.rows))
                             for c in range(1, len(matrix.columns))), 2)
        details = [deck.slides[i] for i, item in enumerate(plan["slides"])
                   if item["section"] == "flow_information"]
        cells = [(row.cells[1].text, row.cells[2].text) for slide in details for shape in slide.shapes
                 if shape.has_table for row in list(shape.table.rows)[1:]]
        description = ''.join(value for label, value in cells if label.startswith("Description"))
        self.assertEqual(description, flows[0]["description"])
        self.assertIn(("metadata", '{"source": "inventaire"}'), cells)
        self.assertIn(("enabled", "false"), cells)
        self.assertIn(("Émetteur", "Application 0 (0)"), cells)

        opts = {"sections": ["portfolio_map"], "projectType": "standard"}
        deck = Presentation(io.BytesIO(generate_pptx(apps, flows, opts, io.BytesIO(stream.getvalue()), True)))
        texts = [shape.text for slide in deck.slides for shape in slide.shapes if shape.has_text_frame]
        self.assertIn("Actif", texts)
        self.assertTrue(any(s.name == "Statut statut 0" for s in deck.slides[0].shapes))
        self.assertFalse(any("D1:" in text for text in texts))

    def test_map_status_icons_and_legend_cover_custom_and_missing_values(self):
        apps = [{"id": "a", "name": "Application A", "domain": "IT", "statut": "Actif"},
                {"id": "b", "name": "Application B", "domain": "IT", "statut": "Personnalisé"},
                {"id": "c", "name": "Application C", "domain": "IT"}]
        stream = io.BytesIO()
        Presentation().save(stream)
        opts = {"sections": ["portfolio_map"], "projectType": "standard"}
        plan = plan_pptx(apps, [], opts, io.BytesIO(stream.getvalue()), True)
        deck = Presentation(io.BytesIO(generate_pptx(apps, [], opts, io.BytesIO(stream.getvalue()), True)))
        self.assertEqual(len(deck.slides), plan["count"])
        slide = deck.slides[0]
        legend = {s.name.removeprefix("Légende "): s.text for s in slide.shapes
                  if s.name.startswith("Légende ")}
        self.assertEqual(set(legend), {"Actif", "Personnalisé", "Non renseigné"})
        for app in apps:
            status = app.get("statut") or "Non renseigné"
            badge = next(s for s in slide.shapes if s.name == f"Statut statut {app['id']}")
            self.assertEqual(badge.text, legend[status])
            self.assertEqual(badge.auto_shape_type, 9)
            card = next(s for s in slide.shapes if s.name == f"Application {app['id']}")
            self.assertEqual(card.text, app["name"])
            self.assertGreaterEqual(badge.left, card.left)
            self.assertLessEqual(badge.left + badge.width, card.left + card.width)

    def test_single_map_and_flow_register_both_endpoints(self):
        apps = [{"id": str(i), "name": f"Application {i}", "domain": f"Domaine {i % 7}",
                 "statut": "Actif", "statusD1": "Maintien", "statusD2": "Transfert",
                 "licenses": i, "budget": i * 100}
                for i in range(35)]
        flows = [{"from": "0", "to": "1", "label": "Objet long " * 80, "protocol": "HTTPS"},
                 {"from": "1", "to": "2", "label": "Retour", "protocol": "API"}]
        stream = io.BytesIO()
        Presentation().save(stream)
        opts = {"sections": ["portfolio_map", "flow_register"], "projectType": "deal",
                "priorityScores": {str(i): i * 2 for i in range(35)}}
        plan = plan_pptx(apps, flows, opts, io.BytesIO(stream.getvalue()), True)
        deck = Presentation(io.BytesIO(generate_pptx(apps, flows, opts, io.BytesIO(stream.getvalue()), True)))
        self.assertEqual(plan["count"], len(deck.slides))
        self.assertEqual(sum(s["section"] == "portfolio_map" for s in plan["slides"]), 1)
        names = {s.name for s in deck.slides[0].shapes}
        for app in apps:
            self.assertIn(f"Application {app['id']}", names)
            shape = next(s for s in deck.slides[0].shapes if s.name == f"Application {app['id']}")
            self.assertEqual(shape.shape_type, MSO_SHAPE_TYPE.AUTO_SHAPE)
        self.assertTrue(plan["slides"][0]["warnings"])
        self.assertFalse(any(s.name.startswith("Flux ") for s in deck.slides[0].shapes))
        tables = [sh.table for slide in list(deck.slides)[1:] for sh in slide.shapes if sh.has_table]
        self.assertTrue(tables)
        self.assertEqual([cell.text.replace('\n', ' ') for cell in tables[0].rows[0].cells],
                         ['Domaine', 'App émettrice', 'App réceptrice', 'Objet du flux',
                          'Priorité', 'Protocole', 'Nombre de licences', 'Coût annuel'])
        row = tables[0].rows[1]
        self.assertIn("Domaine 0", row.cells[0].text)
        self.assertIn("Domaine 1", row.cells[0].text)
        self.assertEqual(row.cells[1].text.replace("\n", ""), "Application 0")
        self.assertEqual(row.cells[2].text.replace("\n", ""), "Application 1")
        self.assertEqual(row.cells[4].text, "É: 0\nR: 2")
        self.assertEqual(row.cells[6].text, "É: 0\nR: 1")
        self.assertEqual(row.cells[7].text, "É: 0\nR: 100")
        self.assertGreater(len(tables), 1)
        first_flow_rows = [row for table in tables for row in list(table.rows)[1:]
                           if row.cells[1].text.replace('\n', '').startswith("Application 0")]
        self.assertEqual(''.join(row.cells[3].text.replace('\n', '') for row in first_flow_rows),
                         flows[0]["label"])

    def test_flow_register_missing_values_and_standard_status(self):
        apps = [{"id": "a", "name": "A", "domain": "IT", "statut": "Legacy",
                 "budget": 0, "licenses": 0},
                {"id": "b", "name": "B", "domain": "Finance"}]
        flows = [{"from": "a", "to": "b", "label": "API"}]
        stream = io.BytesIO()
        Presentation().save(stream)
        opts = {"sections": ["flow_register"], "projectType": "standard"}
        deck = Presentation(io.BytesIO(generate_pptx(apps, flows, opts, io.BytesIO(stream.getvalue()), True)))
        table = next(s.table for s in deck.slides[0].shapes if s.has_table)
        row = table.rows[1]
        self.assertEqual(row.cells[4].text, "É: —\nR: —")
        self.assertEqual(row.cells[6].text, "É: 0\nR: —")
        self.assertEqual(row.cells[7].text, "É: 0\nR: —")


if __name__ == "__main__":
    unittest.main()
