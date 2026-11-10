"""
PPTX generator using onepoint template.
Generates slides for the cartographie applicative app.
"""
import io
import math
import datetime
from typing import List, Dict, Any, Optional

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.chart.data import ChartData
from pptx.enum.chart import XL_CHART_TYPE

try:
    from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
    _RECT_TYPE = MSO_AUTO_SHAPE_TYPE.RECTANGLE
except (ImportError, AttributeError):
    # python-pptx >= 1.0 may have moved this
    _RECT_TYPE = 1  # MSO_AUTO_SHAPE_TYPE.RECTANGLE integer value

# ─── CONSTANTS ───────────────────────────────────────────────────────────────
CONTENT_X   = 1.25   # inches - left margin for content
CONTENT_Y   = 2.20   # inches - top of content area (below title)
CONTENT_W   = 10.80  # inches - content width
CONTENT_H   = 4.80   # inches - content height
SLIDE_W     = 13.33  # inches
SLIDE_H     = 7.50   # inches

PV_PAL = [
    "2563EB","475569","0891B2","4F46E5","0E7490","64748B",
    "1D4ED8","0369A1","334155","6366F1","1E40AF","0F766E"
]

D1_COLORS = {
    "Transfert TSA": "F59E0B", "Maintien": "10B981",
    "Rebuild": "6366F1", "Abandon": "EF4444", "Non défini": "94A3B8"
}
D2_COLORS = {
    "Clone & Clean": "3B82F6", "Transfert": "10B981",
    "Rebuild": "8B5CF6", "Abandon": "EF4444", "Non défini": "94A3B8"
}

# ─── COLOR HELPERS ────────────────────────────────────────────────────────────
def hex_color(h: str) -> RGBColor:
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c*2 for c in h)
    return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))

def lighten(h: str, pct: float = 0.7) -> str:
    """Mix color with white by pct (0=original, 1=white)."""
    h = h.lstrip("#")
    r, g, b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    r2 = int(r + (255-r)*pct)
    g2 = int(g + (255-g)*pct)
    b2 = int(b + (255-b)*pct)
    return f"{r2:02X}{g2:02X}{b2:02X}"

# ─── DRAWING HELPERS ──────────────────────────────────────────────────────────
def add_rect(slide, x, y, w, h, fill_hex=None, line_hex=None, line_w=0.5, transparency=0):
    """Add rectangle. All coords in inches. transparency 0-100."""
    if w <= 0 or h <= 0:
        return None
    shape = slide.shapes.add_shape(
        _RECT_TYPE,
        Inches(x), Inches(y), Inches(w), Inches(h)
    )
    if fill_hex:
        shape.fill.solid()
        shape.fill.fore_color.rgb = hex_color(fill_hex)
        if transparency > 0:
            try:
                from lxml import etree
                sp_pr = shape._element.spPr
                ns = 'http://schemas.openxmlformats.org/drawingml/2006/main'
                solid_fill = sp_pr.find(f'{{{ns}}}solidFill')
                if solid_fill is not None:
                    srgb = solid_fill.find(f'{{{ns}}}srgbClr')
                    if srgb is not None:
                        alpha = etree.SubElement(srgb, f'{{{ns}}}alpha')
                        alpha.set('val', str(int((100 - transparency) * 1000)))
            except Exception:
                pass  # transparency is cosmetic, skip if it fails
    else:
        shape.fill.background()

    if line_hex:
        shape.line.color.rgb = hex_color(line_hex)
        shape.line.width = Pt(line_w)
    else:
        shape.line.fill.background()

    return shape

def add_text(slide, text, x, y, w, h, font_size=11, bold=False, color_hex="1E293B",
             align="left", italic=False, font_face="Poppins", wrap=True):
    """Add text box. All coords in inches."""
    if w <= 0 or h <= 0:
        return None
    if wrap and h < (font_size / 72.0) * 1.9:
        wrap = False  # single-line box: never break short labels ("27 flux", "40")
    txBox = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = txBox.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    align_map = {"left": PP_ALIGN.LEFT, "center": PP_ALIGN.CENTER, "right": PP_ALIGN.RIGHT}
    p.alignment = align_map.get(align, PP_ALIGN.LEFT)
    # Remove paragraph spacing
    try:
        from pptx.oxml.ns import qn
        pPr = p._p.get_or_add_pPr()
        pPr.set(qn('a:spcBef'), '0')
        pPr.set(qn('a:spcAft'), '0')
    except Exception:
        pass
    run = p.add_run()
    run.text = str(text)
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    if color_hex:
        run.font.color.rgb = hex_color(color_hex)
    if font_face:
        run.font.name = font_face
    return txBox

def set_placeholders(slide, title=None, breadcrumb=None, subtitle=None):
    """Fill title (idx 0), subtitle (idx 14) and breadcrumb (idx 17) placeholders of the content layouts."""
    by_idx = {0: title, 14: subtitle, 17: breadcrumb}
    for ph in slide.placeholders:
        idx = ph.placeholder_format.idx
        name = ph.name.lower()
        value = by_idx.get(idx)
        if idx not in by_idx:
            if title and ('titre' in name or ('title' in name and 'sous' not in name)):
                value = title
            elif breadcrumb and ('ariane' in name or 'texte 3' in name or 'fil' in name):
                value = breadcrumb
            elif subtitle and ('sous-titre' in name or 'variante' in name):
                value = subtitle
        if value is None:
            continue
        try:
            ph.text = value
            if idx == 14:
                for r in ph.text_frame.paragraphs[0].runs:
                    r.font.size = Pt(13)
                    r.font.color.rgb = hex_color('64748B')
        except Exception:
            pass


def _cleanup_placeholders(prs):
    """Remove empty body placeholders (no 'Click to add text' left in the deliverable) and add slide numbers."""
    from copy import deepcopy
    from pptx.oxml.ns import qn
    for slide in prs.slides:
        for ph in list(slide.placeholders):
            if ph.placeholder_format.idx in (0, 10, 11):
                continue
            if ph.has_text_frame and not ph.text_frame.text.strip():
                ph._element.getparent().remove(ph._element)
        for lph in slide.slide_layout.placeholders:
            if lph.placeholder_format.idx == 4 and slide.slide_layout.name.startswith('4_'):
                el = deepcopy(lph._element)
                txBody = el.find(qn('p:txBody'))
                if txBody is not None:
                    for p in txBody.findall(qn('a:p')):
                        txBody.remove(p)
                    from lxml import etree
                    p = etree.SubElement(txBody, qn('a:p'))
                    fld = etree.SubElement(p, qn('a:fld'), id='{B6F15528-21DE-4FAA-801E-634DDDAF4B2B}', type='slidenum')
                    etree.SubElement(fld, qn('a:rPr'), lang='fr-FR')
                    t = etree.SubElement(fld, qn('a:t'))
                    t.text = '‹#›'
                slide.shapes._spTree.append(el)
                break


# ─── SLIDE MANAGEMENT ────────────────────────────────────────────────────────
def _clear_slides(prs: Presentation):
    """Remove all example slides while preserving layouts and masters."""
    r_ns = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    sldIdLst = prs.slides._sldIdLst
    for sldId in list(sldIdLst):
        rId = sldId.get(f'{{{r_ns}}}id')
        if rId:
            try:
                prs.part.drop_rel(rId)
            except Exception:
                pass
        try:
            sldIdLst.remove(sldId)
        except Exception:
            pass

# ─── TREEMAP ALGORITHM ───────────────────────────────────────────────────────
def pv_squarify(values: List[float], rect: Dict) -> List[Dict]:
    """
    Squarified treemap layout. Returns list of {x, y, w, h} rects, one per value.
    Port of the JS pvSquarify function.
    """
    total = sum(v for v in values if v > 0)
    if not total or not values or rect['w'] <= 0 or rect['h'] <= 0:
        return [{'x': rect['x'], 'y': rect['y'], 'w': rect['w'], 'h': rect['h']} for _ in values]

    items = sorted(
        [{'v': v, 'i': i} for i, v in enumerate(values) if v > 0],
        key=lambda x: -x['v']
    )
    results = [{'x': rect['x'], 'y': rect['y'], 'w': rect['w'], 'h': rect['h']} for _ in values]
    cursor = dict(rect)
    remaining = list(items)

    while remaining:
        row = []
        best_ratio = float('inf')
        i = 0
        while i < len(remaining):
            row.append(remaining[i])
            row_sum = sum(r['v'] for r in row)
            row_frac = row_sum / total

            if cursor['w'] >= cursor['h']:
                row_thickness = cursor['h'] * row_frac
                if row_thickness <= 0:
                    break
                max_w = (row[-1]['v'] / row_sum) * cursor['w'] if row_sum > 0 else 0
                ratio = max(row_thickness / max_w, max_w / row_thickness) if max_w > 0 else float('inf')
            else:
                row_thickness = cursor['w'] * row_frac
                if row_thickness <= 0:
                    break
                max_h = (row[-1]['v'] / row_sum) * cursor['h'] if row_sum > 0 else 0
                ratio = max(row_thickness / max_h, max_h / row_thickness) if max_h > 0 else float('inf')

            if ratio > best_ratio:
                row.pop()
                break
            best_ratio = ratio
            i += 1

        if not row:
            row.append(remaining[0])

        row_sum = sum(r['v'] for r in row)
        row_frac = row_sum / total

        if cursor['w'] >= cursor['h']:
            row_thickness = cursor['h'] * row_frac
            cx = cursor['x']
            for item in row:
                ww = (item['v'] / row_sum) * cursor['w']
                results[item['i']] = {'x': cx, 'y': cursor['y'], 'w': ww, 'h': row_thickness}
                cx += ww
            cursor = {
                'x': cursor['x'], 'y': cursor['y'] + row_thickness,
                'w': cursor['w'], 'h': cursor['h'] - row_thickness
            }
        else:
            row_thickness = cursor['w'] * row_frac
            cy = cursor['y']
            for item in row:
                hh = (item['v'] / row_sum) * cursor['h']
                results[item['i']] = {'x': cursor['x'], 'y': cy, 'w': row_thickness, 'h': hh}
                cy += hh
            cursor = {
                'x': cursor['x'] + row_thickness, 'y': cursor['y'],
                'w': cursor['w'] - row_thickness, 'h': cursor['h']
            }

        for item in row:
            remaining.remove(item)

    return results


def pv_build_layout(apps: List[Dict], w: float, h: float) -> List[Dict]:
    """
    3-level treemap: domain → category → app.
    Returns list of domain dicts with nested category/app rects (all in inches).
    w, h: total area dimensions in inches.
    """
    D_HEADER_H = 0.22  # domain header height in inches
    Q_HEADER_H = 0.16  # category header height in inches

    # Group by domain
    dom_map = {}
    for a in apps:
        d = a.get('domain') or 'Autre'
        dom_map.setdefault(d, []).append(a)

    doms_info = sorted(
        [{'domaine': d, 'apps': apps_list, 'nb_apps': len(apps_list)}
         for d, apps_list in dom_map.items()],
        key=lambda x: -x['nb_apps']
    )

    dom_rects = pv_squarify(
        [d['nb_apps'] for d in doms_info],
        {'x': 0, 'y': 0, 'w': w, 'h': h}
    )

    result = []
    for i, d in enumerate(doms_info):
        r = dom_rects[i]
        # Group by category
        cat_map = {}
        for a in d['apps']:
            c = a.get('category') or '—'
            cat_map.setdefault(c, []).append(a)

        cats = sorted(
            [{'quartier': c, 'apps': app_list, 'nb_apps': len(app_list)}
             for c, app_list in cat_map.items()],
            key=lambda x: -x['nb_apps']
        )

        inner = {
            'x': r['x'] + 0.04,
            'y': r['y'] + D_HEADER_H + 0.10,
            'w': max(0, r['w'] - 0.08),
            'h': max(0, r['h'] - D_HEADER_H - 0.14)
        }

        q_rects = pv_squarify([c['nb_apps'] for c in cats], inner)

        quartiers = []
        for j, cat in enumerate(cats):
            qr = q_rects[j]
            app_inner = {
                'x': qr['x'] + 0.02,
                'y': qr['y'] + Q_HEADER_H + 0.02,
                'w': max(0, qr['w'] - 0.04),
                'h': max(0, qr['h'] - Q_HEADER_H - 0.04)
            }
            app_rects = pv_squarify([1.0] * cat['nb_apps'], app_inner)

            quartiers.append({
                'quartier': cat['quartier'],
                'nb_apps': cat['nb_apps'],
                'rect': qr,
                'apps': [{'app': a, 'rect': app_rects[k]} for k, a in enumerate(cat['apps'])]
            })

        result.append({
            'domaine': d['domaine'],
            'nb_apps': d['nb_apps'],
            'rect': r,
            'quartiers': quartiers
        })

    return result


# ─── SLIDE GENERATORS ─────────────────────────────────────────────────────────

def add_cover_slide(prs: Presentation, apps: List[Dict], flows: List[Dict], opts: Dict):
    """Slide 1: Cover / Page de garde."""
    layout = prs.slide_layouts[0]  # 1_Page de garde_Light
    slide = prs.slides.add_slide(layout)

    # Try to set placeholders
    today = datetime.date.today().strftime("%d/%m/%Y")
    client_name = opts.get('clientName', '')

    for ph in slide.placeholders:
        name = ph.name.lower()
        try:
            if 'titre' in name and 'sous' not in name:
                ph.text = "Cartographie Applicative"
            elif 'sous-titre' in name or 'description' in name:
                ph.text = client_name or "Analyse du Système d'Information"
            elif 'date' in name:
                ph.text = today
        except Exception:
            pass


def add_synthese_messages_slide(prs: Presentation, apps: List[Dict], flows: List[Dict], opts: Dict):
    """Slide 2: Synthèse & Messages clés."""
    layout = prs.slide_layouts[8]  # 4_Contenu par défaut
    slide = prs.slides.add_slide(layout)
    set_placeholders(slide,
        title="SYNTHÈSE — MESSAGES CLÉS",
        breadcrumb="Cartographie Applicative",
        subtitle="Concentration des flux · Domaines · Hubs"
    )

    primary = opts.get('clientPrimary', '2979FF')

    # Compute data
    # Pairs
    pairs = {}
    for f in flows:
        fa = next((a for a in apps if a['id'] == f.get('from')), None)
        ta = next((a for a in apps if a['id'] == f.get('to')), None)
        if fa and ta and fa.get('domain') != ta.get('domain'):
            k = f"{fa['domain']} → {ta['domain']}"
            pairs[k] = pairs.get(k, 0) + 1
    top_pairs = sorted(pairs.items(), key=lambda x: -x[1])[:5]
    tot_inter = sum(pairs.values())

    # Domain flows
    dom_flows = {}
    for a in apps:
        dom_flows[a.get('domain', 'Autre')] = 0
    for f in flows:
        fa = next((a for a in apps if a['id'] == f.get('from')), None)
        ta = next((a for a in apps if a['id'] == f.get('to')), None)
        if fa:
            dom_flows[fa.get('domain', 'Autre')] = dom_flows.get(fa.get('domain', 'Autre'), 0) + 1
        if ta:
            dom_flows[ta.get('domain', 'Autre')] = dom_flows.get(ta.get('domain', 'Autre'), 0) + 1
    top_dom_flows = sorted(dom_flows.items(), key=lambda x: -x[1])[:5]

    # Hubs
    conn = {a['id']: 0 for a in apps}
    for f in flows:
        if f.get('from') in conn:
            conn[f['from']] += 1
        if f.get('to') in conn:
            conn[f['to']] += 1
    top_hubs = sorted([a for a in apps if conn.get(a['id'], 0) > 0],
                      key=lambda a: -conn.get(a['id'], 0))[:5]

    # 3 cards
    card_w = 3.20
    card_h = 4.00
    card_gap = 0.20
    card_x0 = CONTENT_X
    card_y0 = CONTENT_Y

    cards = [
        {'title': 'CONCENTRATION DES FLUX', 'accent': '6366F1', 'type': 'pairs'},
        {'title': 'DOMAINES PAR VOLUME DE FLUX', 'accent': '0EA5E9', 'type': 'domflow'},
        {'title': "HUBS DU SYSTÈME D'INFORMATION", 'accent': 'F59E0B', 'type': 'hubs'},
    ]

    for ci, card in enumerate(cards):
        cx = card_x0 + ci * (card_w + card_gap)
        cy = card_y0
        acc = card['accent']

        # Card background
        add_rect(slide, cx, cy, card_w, card_h, fill_hex='FFFFFF', line_hex='E2E8F0', line_w=0.5)
        # Accent top bar
        add_rect(slide, cx, cy, card_w, 0.28, fill_hex=acc, transparency=85)
        add_rect(slide, cx, cy, 0.06, card_h, fill_hex=acc)
        # Title
        add_text(slide, card['title'], cx+0.12, cy+0.06, card_w-0.20, 0.20,
                 font_size=7, bold=True, color_hex=acc)

        # Divider
        add_rect(slide, cx+0.12, cy+0.30, card_w-0.24, 0.01, fill_hex='E2E8F0')

        if card['type'] == 'pairs':
            if not top_pairs:
                add_text(slide, "Aucun flux inter-domaine", cx+0.12, cy+0.50, card_w-0.24, 0.30,
                         font_size=9, color_hex='94A3B8')
            else:
                max_v = top_pairs[0][1]
                for pi, (pair_k, pair_v) in enumerate(top_pairs):
                    py = cy + 0.44 + pi * 0.68
                    if py + 0.60 > cy + card_h:
                        break
                    pct = round(pair_v / tot_inter * 100) if tot_inter else 0
                    add_text(slide, str(pair_v), cx+0.12, py, 0.45, 0.30,
                             font_size=20, bold=True, color_hex=acc)
                    add_text(slide, f"flux — {pct}%", cx+0.60, py+0.12, card_w-0.80, 0.18,
                             font_size=7, color_hex='64748B')
                    add_text(slide, pair_k, cx+0.12, py+0.32, card_w-0.24, 0.18,
                             font_size=8, color_hex='334155')
                    bw = (pair_v / max_v) * (card_w - 0.30) if max_v else 0
                    add_rect(slide, cx+0.12, py+0.50, bw, 0.05, fill_hex=acc)

        elif card['type'] == 'domflow':
            if not top_dom_flows:
                add_text(slide, "Aucun flux défini", cx+0.12, cy+0.50, card_w-0.24, 0.30,
                         font_size=9, color_hex='94A3B8')
            else:
                max_v = top_dom_flows[0][1] if top_dom_flows else 1
                for di, (dom, dv) in enumerate(top_dom_flows):
                    dy = cy + 0.44 + di * 0.68
                    if dy + 0.50 > cy + card_h:
                        break
                    bw = max(0.05, (dv / max_v) * (card_w - 1.10)) if max_v else 0.05
                    add_text(slide, dom, cx+0.12, dy, card_w-0.36, 0.22,
                             font_size=9, bold=True, color_hex='0F172A')
                    add_rect(slide, cx+0.12, dy+0.26, card_w-0.28, 0.12, fill_hex='F1F5F9')
                    add_rect(slide, cx+0.12, dy+0.26, bw, 0.12, fill_hex=acc)
                    add_text(slide, f"{dv} flux", cx+0.18+bw, dy+0.24, card_w-0.36-bw, 0.16,
                             font_size=7.5, bold=True, color_hex=acc)

        elif card['type'] == 'hubs':
            if not top_hubs:
                add_text(slide, "Aucun flux défini", cx+0.12, cy+0.50, card_w-0.24, 0.30,
                         font_size=9, color_hex='94A3B8')
            else:
                max_conn = conn.get(top_hubs[0]['id'], 1) or 1
                for hi, hub in enumerate(top_hubs):
                    hy = cy + 0.44 + hi * 0.68
                    if hy + 0.50 > cy + card_h:
                        break
                    hub_conn = conn.get(hub['id'], 0)
                    bw = (hub_conn / max_conn) * (card_w - 0.70) if max_conn else 0
                    add_text(slide, hub.get('name', ''), cx+0.12, hy, card_w-0.28, 0.22,
                             font_size=9, bold=True, color_hex='0F172A')
                    add_rect(slide, cx+0.12, hy+0.26, bw, 0.12, fill_hex=acc)
                    add_text(slide, f"{hub_conn} cx", cx+0.18+bw, hy+0.24, 0.50, 0.16,
                             font_size=8, bold=True, color_hex=acc)
                    add_text(slide, hub.get('domain', ''), cx+0.12, hy+0.42, card_w-0.24, 0.14,
                             font_size=7, color_hex='64748B')

    # KPI band at bottom
    kpi_y = card_y0 + card_h + 0.12
    kpi_h = 0.60
    add_rect(slide, CONTENT_X, kpi_y, CONTENT_W, kpi_h, fill_hex='FFFFFF', line_hex='E2E8F0', line_w=0.5)

    kpis = [
        {'l': 'Total flux', 'v': len(flows), 'c': '6366F1'},
        {'l': 'Flux inter-domaines', 'v': tot_inter, 'c': '8B5CF6'},
        {'l': 'Ratio flux/app', 'v': round(len(flows)/len(apps), 1) if apps else 0, 'c': '22D3EE'},
    ]
    kpi_col_w = CONTENT_W / len(kpis)
    for ki, kpi in enumerate(kpis):
        kx = CONTENT_X + ki * kpi_col_w
        add_rect(slide, kx + 0.08, kpi_y + 0.06, 0.04, kpi_h - 0.12, fill_hex=kpi['c'])
        add_text(slide, str(kpi['v']), kx + 0.18, kpi_y + 0.06, kpi_col_w - 0.30, 0.34,
                 font_size=22, bold=True, color_hex=kpi['c'])
        add_text(slide, kpi['l'], kx + 0.18, kpi_y + 0.38, kpi_col_w - 0.30, 0.18,
                 font_size=8, color_hex='64748B')


def add_executive_slide(prs: Presentation, apps: List[Dict], opts: Dict):
    """Slide 3: Synthèse exécutive — KPI + D1/D2 donuts + owners."""
    layout = prs.slide_layouts[8]
    slide = prs.slides.add_slide(layout)
    set_placeholders(slide,
        title="SYNTHÈSE EXÉCUTIVE",
        breadcrumb="Cartographie Applicative",
    )

    primary = opts.get('clientPrimary', '2979FF')

    # KPI tiles
    doms = list({a.get('domain', 'Autre') for a in apps})
    kpis = [
        {'l': 'Applications', 'v': str(len(apps)), 'c': '6366F1'},
        {'l': 'Domaines', 'v': str(len(doms)), 'c': '8B5CF6'},
    ]
    kpi_w = 2.0
    kpi_h = 0.90
    kpi_y = CONTENT_Y
    for ki, kpi in enumerate(kpis):
        kx = CONTENT_X + ki * (kpi_w + 0.20)
        add_rect(slide, kx, kpi_y, kpi_w, kpi_h, fill_hex='FFFFFF', line_hex='E2E8F0', line_w=0.5)
        add_rect(slide, kx, kpi_y, 0.055, kpi_h, fill_hex=kpi['c'])
        add_text(slide, kpi['v'], kx+0.14, kpi_y+0.06, kpi_w-0.20, 0.50,
                 font_size=28, bold=True, color_hex=kpi['c'])
        add_text(slide, kpi['l'], kx+0.14, kpi_y+0.62, kpi_w-0.20, 0.22,
                 font_size=8, color_hex='64748B')

    # D1 donut chart
    d1_stats = [
        {'l': 'Transfert TSA', 'v': sum(1 for a in apps if a.get('statusD1') == 'Transfert TSA'), 'c': 'F59E0B'},
        {'l': 'Maintien', 'v': sum(1 for a in apps if a.get('statusD1') == 'Maintien'), 'c': '10B981'},
        {'l': 'Rebuild', 'v': sum(1 for a in apps if a.get('statusD1') == 'Rebuild'), 'c': '6366F1'},
        {'l': 'Abandon', 'v': sum(1 for a in apps if a.get('statusD1') == 'Abandon'), 'c': 'EF4444'},
        {'l': 'Non défini', 'v': sum(1 for a in apps if not a.get('statusD1')), 'c': '94A3B8'},
    ]
    d2_stats = [
        {'l': 'Clone & Clean', 'v': sum(1 for a in apps if a.get('statusD2') == 'Clone & Clean'), 'c': '3B82F6'},
        {'l': 'Transfert', 'v': sum(1 for a in apps if a.get('statusD2') == 'Transfert'), 'c': '10B981'},
        {'l': 'Rebuild', 'v': sum(1 for a in apps if a.get('statusD2') == 'Rebuild'), 'c': '8B5CF6'},
        {'l': 'Abandon', 'v': sum(1 for a in apps if a.get('statusD2') == 'Abandon'), 'c': 'EF4444'},
        {'l': 'Non défini', 'v': sum(1 for a in apps if not a.get('statusD2')), 'c': '94A3B8'},
    ]

    donut_y = kpi_y + kpi_h + 0.20
    donut_h = 2.60
    donut_w = 4.80

    def draw_donut_block(bx, by, bw, bh, title, title_color, stats):
        add_rect(slide, bx, by, bw, bh, fill_hex='FFFFFF', line_hex='E2E8F0', line_w=0.5)
        add_rect(slide, bx, by, bw, 0.26, fill_hex=lighten(title_color, 0.85))
        add_text(slide, title, bx+0.12, by+0.04, bw-0.20, 0.20,
                 font_size=8, bold=True, color_hex=title_color)

        # Chart data — only non-zero values
        chart_stats = [s for s in stats if s['v'] > 0]
        if chart_stats and len(apps) > 0:
            chart_data = ChartData()
            chart_data.categories = [s['l'] for s in chart_stats]
            chart_data.add_series('', [s['v'] for s in chart_stats])

            chart_sz = min(bh - 0.40, bw * 0.40)
            chart = slide.shapes.add_chart(
                XL_CHART_TYPE.DOUGHNUT,
                Inches(bx + 0.10), Inches(by + 0.30),
                Inches(chart_sz), Inches(chart_sz),
                chart_data
            )
            ch = chart.chart
            ch.has_legend = False
            if hasattr(ch, 'series'):
                for si, ser in enumerate(ch.series):
                    for pi, pt in enumerate(ser.points):
                        try:
                            pt.format.fill.solid()
                            pt.format.fill.fore_color.rgb = hex_color(chart_stats[pi]['c'])
                        except Exception:
                            pass

        # Legend
        leg_x = bx + bw * 0.42
        leg_y = by + 0.32
        row_h = min(0.36, (bh - 0.40) / max(len(stats), 1))
        for s in stats:
            pct = round(s['v'] / len(apps) * 100) if apps else 0
            col = s['c'] if s['v'] > 0 else 'D1D5DB'
            add_rect(slide, leg_x, leg_y + (row_h - 0.12) / 2, 0.12, 0.12, fill_hex=col)
            add_text(slide, s['l'], leg_x + 0.17, leg_y, bw - (leg_x - bx) - 0.70, row_h,
                     font_size=7.5, color_hex='374151' if s['v'] > 0 else '9CA3AF')
            add_text(slide, f"{s['v']} | {pct}%", bx + bw - 0.70, leg_y, 0.65, row_h,
                     font_size=7, color_hex='94A3B8', align='right')
            leg_y += row_h

    draw_donut_block(CONTENT_X, donut_y, donut_w, donut_h,
                     "VISION CLOSING — DAY 1", "D97706", d1_stats)
    draw_donut_block(CONTENT_X + donut_w + 0.25, donut_y, donut_w, donut_h,
                     "VISION CIBLE — DAY 2", "7C3AED", d2_stats)

    # Owner bar chart
    owners = {}
    for a in apps:
        o = (a.get('owner') or '').strip() or 'Non renseigné'
        owners[o] = owners.get(o, 0) + 1
    top_owners = sorted([(k, v) for k, v in owners.items() if k != 'Non renseigné'],
                        key=lambda x: -x[1])[:6]
    series_title = "RÉPARTITION PAR RESPONSABLE"
    if len(top_owners) < 2:
        dom_counts = {}
        for a in apps:
            d = (a.get('domain') or '').strip()
            if d:
                dom_counts[d] = dom_counts.get(d, 0) + 1
        top_owners = sorted(dom_counts.items(), key=lambda x: -x[1])[:6]
        series_title = "RÉPARTITION PAR DOMAINE"

    ow_y = donut_y + donut_h + 0.15
    ow_h = 1.10
    add_rect(slide, CONTENT_X, ow_y, CONTENT_W, ow_h, fill_hex='FFFFFF', line_hex='E2E8F0', line_w=0.5)
    add_text(slide, series_title, CONTENT_X + 0.15, ow_y + 0.06,
             5.0, 0.18, font_size=8, bold=True, color_hex=primary)

    if top_owners:
        max_v = top_owners[0][1]
        col_w = CONTENT_W / max(len(top_owners), 1)
        for i, (owner, cnt) in enumerate(top_owners):
            ox = CONTENT_X + i * col_w + 0.10
            bw_bar = (cnt / max_v) * (col_w - 0.55) if max_v else 0
            add_rect(slide, ox, ow_y + 0.30, bw_bar, 0.18, fill_hex=primary)
            add_text(slide, str(cnt), ox + bw_bar + 0.04, ow_y + 0.29, 0.30, 0.20,
                     font_size=8, bold=True, color_hex=primary)
            add_text(slide, owner, ox, ow_y + 0.52, col_w - 0.20, 0.18,
                     font_size=7, color_hex='475569')
            add_text(slide, f"{round(cnt/len(apps)*100)}%", ox, ow_y + 0.72, col_w - 0.20, 0.16,
                     font_size=6.5, color_hex='94A3B8')


def add_domain_status_slides(prs: Presentation, apps: List[Dict], opts: Dict):
    """Slides: Cartographie par domaine — Day 1 & Day 2 (chip grid)."""
    primary = opts.get('clientPrimary', '2979FF')

    configs = [
        {'field': 'statusD1', 'title': 'CARTOGRAPHIE PAR DOMAINE — DAY 1 (CLOSING)',
         'color_map': D1_COLORS},
        {'field': 'statusD2', 'title': 'CARTOGRAPHIE PAR DOMAINE — DAY 2 (CIBLE)',
         'color_map': D2_COLORS},
    ]

    for cfg in configs:
        doms = list(dict.fromkeys(a.get('domain', 'Autre') for a in apps))
        chip_w, chip_h = 0.90, 0.24
        chip_gap_h, chip_gap_v = 0.04, 0.03
        label_w = 1.80
        content_x2 = CONTENT_X + label_w + 0.10
        chips_area_w = CONTENT_W - label_w - 0.10
        chips_per_row = max(1, int((chips_area_w + chip_gap_h) / (chip_w + chip_gap_h)))

        def make_slide():
            layout = prs.slide_layouts[8]
            sl = prs.slides.add_slide(layout)
            set_placeholders(sl, title=cfg['title'], breadcrumb="Cartographie Applicative")
            # Legend
            leg_x = CONTENT_X
            leg_y = CONTENT_Y - 0.02
            for st, col in cfg['color_map'].items():
                add_rect(sl, leg_x, leg_y + 0.04, 0.14, 0.12, fill_hex=col)
                add_text(sl, st, leg_x + 0.18, leg_y, 1.20, 0.22, font_size=7.5, color_hex='444444')
                leg_x += 1.55
            return sl

        cur_slide = make_slide()
        cur_y = CONTENT_Y + 0.28  # below legend
        max_y = SLIDE_H - 0.50
        dom_gap = 0.06
        dom_pad = 0.05

        for dom in doms:
            dom_apps = [a for a in apps if a.get('domain') == dom]
            chip_rows = math.ceil(len(dom_apps) / chips_per_row) or 1
            dom_h = dom_pad * 2 + chip_rows * chip_h + (chip_rows - 1) * chip_gap_v

            if cur_y + dom_h > max_y:
                cur_slide = make_slide()
                cur_y = CONTENT_Y + 0.28

            # Domain label
            add_rect(cur_slide, CONTENT_X, cur_y, label_w, dom_h, fill_hex='EFF6FF', line_hex='BFDBFE', line_w=0.5)
            add_text(cur_slide, dom, CONTENT_X + 0.08, cur_y + dom_pad,
                     label_w - 0.12, dom_h * 0.55, font_size=8, bold=True, color_hex='1D4ED8')
            add_text(cur_slide, f"{len(dom_apps)} app{'s' if len(dom_apps) > 1 else ''}",
                     CONTENT_X + 0.08, cur_y + dom_h * 0.62,
                     label_w - 0.12, dom_h * 0.32, font_size=6, color_hex='888888')

            # Chips
            for ai, app in enumerate(dom_apps):
                row = ai // chips_per_row
                col = ai % chips_per_row
                chip_x = content_x2 + col * (chip_w + chip_gap_h)
                chip_y = cur_y + dom_pad + row * (chip_h + chip_gap_v)
                st = app.get(cfg['field']) or 'Non défini'
                stc = cfg['color_map'].get(st, '94A3B8')
                add_rect(cur_slide, chip_x, chip_y, chip_w, chip_h,
                         fill_hex=stc, transparency=82, line_hex=stc, line_w=0.5)
                add_rect(cur_slide, chip_x, chip_y, 0.04, chip_h, fill_hex=stc)
                add_text(cur_slide, app.get('name', ''), chip_x + 0.07, chip_y,
                         chip_w - 0.10, chip_h * 0.55, font_size=5.5, bold=True, color_hex='1a1a1a')
                add_text(cur_slide, '—' if st == 'Non défini' else st,
                         chip_x + 0.07, chip_y + chip_h * 0.55,
                         chip_w - 0.10, chip_h * 0.42, font_size=5, color_hex=stc)

            add_rect(cur_slide, CONTENT_X, cur_y + dom_h, CONTENT_W, 0.01, fill_hex='E2E8F0')
            cur_y += dom_h + dom_gap


def add_paysage_slide(prs: Presentation, apps: List[Dict]):
    """Paysage applicatif treemap slide."""
    layout = prs.slide_layouts[9]  # 4_Contenu_pour illustration
    slide = prs.slides.add_slide(layout)
    set_placeholders(slide,
        title="PAYSAGE APPLICATIF",
        breadcrumb="Cartographie Applicative",
        subtitle="Surface proportionnelle au nombre d'applications par domaine"
    )

    # Content area for treemap
    tm_x = CONTENT_X
    tm_y = CONTENT_Y
    tm_w = CONTENT_W
    tm_h = CONTENT_H

    pv_layout = pv_build_layout(apps, tm_w, tm_h)

    for di, dom in enumerate(pv_layout):
        color = PV_PAL[di % len(PV_PAL)]
        r = dom['rect']

        if r['w'] < 0.05 or r['h'] < 0.05:
            continue

        # Domain background
        add_rect(slide,
                 tm_x + r['x'], tm_y + r['y'], r['w'], r['h'],
                 fill_hex=color, transparency=95, line_hex=color, line_w=1.0)

        # Domain header
        hdr_h = 0.22
        add_rect(slide,
                 tm_x + r['x'] + 0.02, tm_y + r['y'] + 0.02,
                 max(0, r['w'] - 0.04), hdr_h,
                 fill_hex=color, transparency=22)

        # Domain name
        if r['w'] > 0.60:
            add_text(slide, dom['domaine'],
                     tm_x + r['x'] + 0.06, tm_y + r['y'] + 0.03,
                     max(0.10, r['w'] - 0.50), hdr_h - 0.04,
                     font_size=max(5.0, min(9.0, r['w'] * 4)),
                     bold=True, color_hex=color)
            add_text(slide, str(dom['nb_apps']),
                     tm_x + r['x'] + r['w'] - 0.50, tm_y + r['y'] + 0.03,
                     0.45, hdr_h - 0.04,
                     font_size=max(5.0, min(8.0, r['w'] * 3.5)),
                     bold=False, color_hex='475569', align='right')

        # Categories
        for cat in dom['quartiers']:
            qr = cat['rect']
            if qr['w'] < 0.04 or qr['h'] < 0.04:
                continue

            # Category background
            add_rect(slide,
                     tm_x + qr['x'] + 0.01, tm_y + qr['y'] + 0.01,
                     max(0, qr['w'] - 0.02), max(0, qr['h'] - 0.02),
                     fill_hex='FFFFFF', transparency=0, line_hex=color, line_w=0.5)

            # Category label
            q_hdr_h = 0.16
            if qr['h'] > 0.20 and qr['w'] > 0.40:
                add_text(slide, cat['quartier'],
                         tm_x + qr['x'] + 0.04, tm_y + qr['y'] + 0.02,
                         max(0.10, qr['w'] - 0.08), q_hdr_h - 0.02,
                         font_size=max(4.5, min(8.0, qr['w'] * 3.5)),
                         bold=True, color_hex=color)

            # Apps
            for item in cat['apps']:
                ar = item['rect']
                if ar['w'] < 0.02 or ar['h'] < 0.02:
                    continue

                add_rect(slide,
                         tm_x + ar['x'], tm_y + ar['y'], ar['w'], ar['h'],
                         fill_hex=color, transparency=90, line_hex=color, line_w=0.3)

                # App name (only if big enough)
                if ar['w'] > 0.55 and ar['h'] > 0.18:
                    add_text(slide, item['app'].get('name', ''),
                             tm_x + ar['x'] + 0.03, tm_y + ar['y'] + 0.02,
                             max(0.10, ar['w'] - 0.06), ar['h'] - 0.04,
                             font_size=max(4.0, min(7.0, ar['w'] * 5)),
                             bold=False, color_hex='334155')


def add_native_table(slide, headers, rows, col_widths, primary, x=CONTENT_X, y=CONTENT_Y,
                     font_size=8, row_h=0.25, hdr_h=0.30, first_col_bold=True, badge_cols=None):
    """Native (editable) PowerPoint table with brand-coloured header and zebra rows."""
    from pptx.enum.text import MSO_ANCHOR
    n_rows = len(rows) + 1
    gf = slide.shapes.add_table(n_rows, len(headers), Inches(x), Inches(y),
                                Inches(sum(col_widths)), Inches(hdr_h + row_h * len(rows)))
    tbl = gf.table
    tbl.first_row = True
    tbl.horz_banding = False
    for ci, cw in enumerate(col_widths):
        tbl.columns[ci].width = Inches(cw)
    tbl.rows[0].height = Inches(hdr_h)
    for ri in range(1, n_rows):
        tbl.rows[ri].height = Inches(row_h)
    badge_cols = badge_cols or {}

    def fill_cell(cell, text, bg, color, bold, size, align=PP_ALIGN.LEFT):
        cell.fill.solid()
        cell.fill.fore_color.rgb = hex_color(bg)
        cell.margin_left = cell.margin_right = Inches(0.06)
        cell.margin_top = cell.margin_bottom = Inches(0.02)
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf = cell.text_frame
        tf.word_wrap = True
        para = tf.paragraphs[0]
        para.alignment = align
        run = para.add_run()
        run.text = str(text if text is not None else '')
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.name = "Poppins"
        run.font.color.rgb = hex_color(color)

    for ci, h in enumerate(headers):
        fill_cell(tbl.cell(0, ci), h, primary, 'FFFFFF', True, size_hdr(font_size))
    for ri, row in enumerate(rows, start=1):
        bg = 'F1F5F9' if ri % 2 == 0 else 'FFFFFF'
        for ci, val in enumerate(row):
            color, bold = '334155', False
            if ci == 0 and first_col_bold:
                color, bold = '0F172A', True
            if ci in badge_cols and val in badge_cols[ci]:
                color, bold = badge_cols[ci][val], True
            fill_cell(tbl.cell(ri, ci), val, bg, color, bold, font_size)
    return gf


def size_hdr(font_size):
    return font_size


CRIT_COLORS = {'Haute': 'DC2626', 'Critique': 'DC2626', 'Moyenne': 'D97706', 'Basse': '16A34A', 'Faible': '16A34A'}


def add_recap_apps_slides(prs: Presentation, apps: List[Dict], opts: Dict):
    """Application recap table (native, paginated, header repeated on each page)."""
    primary = opts.get('clientPrimary', '2979FF')
    rows_per_slide = 16
    deal = any(a.get('statusD1') or a.get('statusD2') for a in apps)

    sorted_apps = sorted(apps, key=lambda a: (a.get('domain', ''), a.get('name', '')))
    if deal:
        headers = ['Application', 'Domaine', 'Catégorie', 'Criticité', 'Day 1', 'Day 2', 'Éditeur']
        col_widths = [2.30, 1.50, 1.30, 1.00, 1.55, 1.55, 1.60]
        cell = lambda a: [a.get('name', ''), a.get('domain', ''), a.get('category', ''), a.get('criticality', ''),
                          a.get('statusD1', ''), a.get('statusD2', ''), a.get('vendor', '')]
    else:
        headers = ['Application', 'Domaine', 'Catégorie', 'Criticité', 'Statut', 'Éditeur', 'Responsable']
        col_widths = [2.30, 1.50, 1.30, 1.00, 1.30, 1.55, 1.85]
        cell = lambda a: [a.get('name', ''), a.get('domain', ''), a.get('category', ''), a.get('criticality', ''),
                          a.get('statut', ''), a.get('vendor', ''), a.get('owner', '')]

    pages = max(1, math.ceil(len(sorted_apps) / rows_per_slide))
    for pg in range(pages):
        chunk = sorted_apps[pg * rows_per_slide:(pg + 1) * rows_per_slide]
        sl = prs.slides.add_slide(prs.slide_layouts[8])
        suffix = f" ({pg + 1}/{pages})" if pages > 1 else ""
        set_placeholders(sl, title="RÉCAPITULATIF DES APPLICATIONS" + suffix, breadcrumb="Cartographie Applicative")
        add_native_table(sl, headers, [cell(a) for a in chunk], col_widths, primary,
                         badge_cols={3: CRIT_COLORS})


def add_flux_table_slides(prs: Presentation, apps: List[Dict], flows: List[Dict], opts: Dict):
    """Flow table (native, paginated, header repeated on each page)."""
    if not flows:
        return
    primary = opts.get('clientPrimary', '2979FF')
    rows_per_slide = 16
    app_by_id = {a['id']: a for a in apps}

    def flow_key(f):
        fa = app_by_id.get(f.get('from'), {})
        ta = app_by_id.get(f.get('to'), {})
        return (fa.get('domain', ''), fa.get('name', ''), ta.get('name', ''))

    sorted_flows = sorted(flows, key=flow_key)
    headers = ['N°', 'Émetteur', 'Récepteur', 'Nom du flux', 'Protocole', 'Fréquence']
    col_widths = [0.50, 2.20, 2.20, 3.10, 1.40, 1.40]

    pages = max(1, math.ceil(len(sorted_flows) / rows_per_slide))
    for pg in range(pages):
        start = pg * rows_per_slide
        chunk = sorted_flows[start:start + rows_per_slide]
        sl = prs.slides.add_slide(prs.slide_layouts[8])
        suffix = f" ({pg + 1}/{pages})" if pages > 1 else ""
        set_placeholders(sl, title="CARTOGRAPHIE DES FLUX" + suffix, breadcrumb="Cartographie Applicative")
        rows = []
        for i, f in enumerate(chunk):
            rows.append([str(start + i + 1),
                         app_by_id.get(f.get('from', ''), {}).get('name', '—'),
                         app_by_id.get(f.get('to', ''), {}).get('name', '—'),
                         f.get('label', '') or f.get('name', ''),
                         f.get('protocol', ''), f.get('frequency', '')])
        add_native_table(sl, headers, rows, col_widths, primary, first_col_bold=False)


def add_flux_matrix_slide(prs: Presentation, apps: List[Dict], flows: List[Dict], opts: Dict):
    """Slide : matrice flux inter-domaines (domaine × domaine)."""
    if not flows:
        return
    primary = opts.get('clientPrimary', '2979FF')
    layout = prs.slide_layouts[8]
    slide = prs.slides.add_slide(layout)
    set_placeholders(slide, title="FLUX — VUE AGRÉGÉE PAR DOMAINE",
                     breadcrumb="Cartographie Applicative",
                     subtitle=f"{len(flows)} flux · {len(apps)} applications")

    app_by_id = {a['id']: a for a in apps}
    doms = list(dict.fromkeys(a.get('domain', 'Autre') for a in apps))

    # Build matrix
    matrix = {d: {d2: 0 for d2 in doms} for d in doms}
    for f in flows:
        fa = app_by_id.get(f.get('from', ''), {})
        ta = app_by_id.get(f.get('to', ''), {})
        fd, td = fa.get('domain'), ta.get('domain')
        if fd and td and fd != td:
            matrix[fd][td] = matrix[fd].get(td, 0) + 1

    # Max value for colour scaling
    max_v = max((matrix[r][c] for r in doms for c in doms), default=1) or 1

    # Sizes
    n = len(doms)
    cell_w = min(0.95, (CONTENT_W - 1.60) / n)
    cell_h = min(0.38, (CONTENT_H - 0.40) / n)
    lbl_w = max(1.20, CONTENT_W - n * cell_w - 0.10)
    lbl_h = cell_h
    hdr_h = lbl_h
    tbl_x = CONTENT_X
    tbl_y = CONTENT_Y

    # Column headers (domain names)
    for ci, dom in enumerate(doms):
        cx = tbl_x + lbl_w + ci * cell_w
        add_rect(slide, cx, tbl_y, cell_w, hdr_h, fill_hex=primary)
        add_text(slide, dom[:12], cx + 0.03, tbl_y + 0.02, cell_w - 0.04, hdr_h - 0.04,
                 font_size=max(6.0, min(8.0, cell_w * 7)), bold=True, color_hex='FFFFFF',
                 align='center', wrap=False)

    # Rows
    for ri, row_dom in enumerate(doms):
        ry = tbl_y + hdr_h + ri * cell_h
        # Row label
        add_rect(slide, tbl_x, ry, lbl_w, cell_h, fill_hex='F1F5F9', line_hex='E2E8F0', line_w=0.3)
        add_text(slide, row_dom, tbl_x + 0.06, ry + 0.02, lbl_w - 0.08, cell_h - 0.04,
                 font_size=max(7.0, min(9.0, lbl_w * 5)), bold=True, color_hex='334155')
        # Cells
        for ci, col_dom in enumerate(doms):
            cx = tbl_x + lbl_w + ci * cell_w
            v = matrix[row_dom].get(col_dom, 0)
            if row_dom == col_dom:
                add_rect(slide, cx, ry, cell_w, cell_h, fill_hex='E2E8F0')
            else:
                intensity = int(v / max_v * 85) if v > 0 else 0
                bg = f"{255 - intensity:02X}{255 - intensity // 3:02X}FF" if v > 0 else 'FAFAFA'
                add_rect(slide, cx, ry, cell_w, cell_h, fill_hex=bg, line_hex='E2E8F0', line_w=0.3)
                if v > 0:
                    add_text(slide, str(v), cx, ry + 0.02, cell_w, cell_h - 0.04,
                             font_size=max(7.0, min(10.0, cell_w * 8)), bold=True,
                             color_hex=primary if v > 0 else '94A3B8', align='center')

    # Legend
    leg_y = tbl_y + hdr_h + n * cell_h + 0.15
    add_text(slide, "Les chiffres indiquent le nombre de flux inter-domaines",
             tbl_x, leg_y, CONTENT_W, 0.20, font_size=8, italic=True, color_hex='94A3B8')


def _hub_limit(opts: Dict, cap: int) -> int:
    try:
        return max(1, min(int(opts.get('hubLimit') or cap), cap))
    except (TypeError, ValueError):
        return cap


def _hub_allowed(app: Dict, opts: Dict) -> bool:
    dom = opts.get('hubDomainFilter')
    return not dom or app.get('domain') in dom


def add_hubs_slide(prs: Presentation, apps: List[Dict], flows: List[Dict], opts: Dict):
    """Slide : top applications hub (les plus connectées)."""
    if not flows:
        return
    primary = opts.get('clientPrimary', '2979FF')
    layout = prs.slide_layouts[8]
    slide = prs.slides.add_slide(layout)

    # Connectivity per app
    conn = {a['id']: 0 for a in apps}
    flow_details = {a['id']: [] for a in apps}
    app_by_id = {a['id']: a for a in apps}
    for f in flows:
        fid, tid = f.get('from', ''), f.get('to', '')
        if fid in conn:
            conn[fid] += 1
            ta = app_by_id.get(tid, {})
            flow_details[fid].append(ta.get('name', ''))
        if tid in conn:
            conn[tid] += 1
            fa = app_by_id.get(fid, {})
            flow_details[tid].append(fa.get('name', ''))

    top_hubs = sorted([a for a in apps if conn.get(a['id'], 0) > 0 and _hub_allowed(a, opts)],
                      key=lambda a: -conn.get(a['id'], 0))[:_hub_limit(opts, 12)]

    n_hubs = len(top_hubs)
    set_placeholders(slide,
        title="HUBS APPLICATIFS — APPLICATIONS LES PLUS CONNECTÉES",
        breadcrumb="Cartographie Applicative",
        subtitle=f"{n_hubs} applications · classement par nombre de connexions"
    )

    if not top_hubs:
        add_text(slide, "Aucun flux défini", CONTENT_X, CONTENT_Y, CONTENT_W, 0.40,
                 font_size=12, color_hex='94A3B8', align='center')
        return

    max_conn = conn.get(top_hubs[0]['id'], 1) or 1
    row_h = min(0.36, CONTENT_H / n_hubs)
    bar_max_w = CONTENT_W * 0.40
    name_w = CONTENT_W * 0.22
    dom_w = CONTENT_W * 0.16
    bar_x = CONTENT_X + name_w + dom_w + 0.10
    cnt_x = bar_x + bar_max_w + 0.08
    cnt_w = 0.60
    detail_x = cnt_x + cnt_w + 0.08
    detail_w = CONTENT_W - (detail_x - CONTENT_X) - 0.10

    # Header
    hdr_h = 0.24
    for lbl, x, w in [('Application', CONTENT_X, name_w), ('Domaine', CONTENT_X + name_w, dom_w),
                       ('Connexions', bar_x, bar_max_w + cnt_w + 0.10),
                       ('Applications connectées', detail_x, detail_w)]:
        add_rect(slide, x, CONTENT_Y, w, hdr_h, fill_hex=primary)
        add_text(slide, lbl, x + 0.04, CONTENT_Y + 0.03, w - 0.06, hdr_h - 0.04,
                 font_size=8, bold=True, color_hex='FFFFFF')

    for ri, app in enumerate(top_hubs):
        ry = CONTENT_Y + hdr_h + ri * row_h
        bg = 'F8FAFC' if ri % 2 == 0 else 'FFFFFF'
        app_conn = conn.get(app['id'], 0)
        bw = (app_conn / max_conn) * bar_max_w

        # App name
        add_rect(slide, CONTENT_X, ry, name_w, row_h, fill_hex=bg, line_hex='E2E8F0', line_w=0.3)
        add_text(slide, app.get('name', ''), CONTENT_X + 0.06, ry + 0.02,
                 name_w - 0.08, row_h - 0.04, font_size=8, bold=True, color_hex='1E293B')

        # Domain
        add_rect(slide, CONTENT_X + name_w, ry, dom_w, row_h, fill_hex=bg, line_hex='E2E8F0', line_w=0.3)
        add_text(slide, app.get('domain', ''), CONTENT_X + name_w + 0.04, ry + 0.02,
                 dom_w - 0.06, row_h - 0.04, font_size=7.5, color_hex='64748B')

        # Bar
        add_rect(slide, bar_x, ry, bar_max_w + cnt_w + 0.10, row_h, fill_hex=bg, line_hex='E2E8F0', line_w=0.3)
        if bw > 0:
            add_rect(slide, bar_x + 0.04, ry + (row_h - 0.14) / 2, bw, 0.14, fill_hex=primary)
        add_text(slide, str(app_conn), bar_x + 0.08 + bw, ry + 0.02,
                 cnt_w, row_h - 0.04, font_size=9, bold=True, color_hex=primary)

        # Connected apps
        add_rect(slide, detail_x, ry, detail_w, row_h, fill_hex=bg, line_hex='E2E8F0', line_w=0.3)
        names = flow_details[app['id']]
        details = ', '.join(names[:3])
        if len(names) > 3:
            details += f" +{len(names) - 3}"
        add_text(slide, details, detail_x + 0.04, ry + 0.02,
                 detail_w - 0.06, row_h - 0.04, font_size=7, color_hex='475569')


def add_env_applicatif_slides(prs: Presentation, apps: List[Dict], opts: Dict, field: str,
                               title: str, color_map: Dict):
    """Slides environnement applicatif — apps groupées par domaine avec statut coloré."""
    primary = opts.get('clientPrimary', '2979FF')

    doms = list(dict.fromkeys(a.get('domain', 'Autre') for a in apps))

    chip_w, chip_h = 1.30, 0.28
    chip_gap = 0.05
    dom_label_w = 1.60
    chips_area_w = CONTENT_W - dom_label_w - 0.10
    chips_per_row = max(1, int((chips_area_w + chip_gap) / (chip_w + chip_gap)))
    dom_pad = 0.08
    dom_gap = 0.08

    def make_slide():
        layout = prs.slide_layouts[8]
        sl = prs.slides.add_slide(layout)
        set_placeholders(sl, title=title, breadcrumb="Cartographie Applicative")
        # Legend
        lx = CONTENT_X
        ly = CONTENT_Y - 0.04
        for st, col in list(color_map.items())[:5]:
            add_rect(sl, lx, ly + 0.04, 0.14, 0.12, fill_hex=col)
            add_text(sl, st, lx + 0.18, ly, 1.30, 0.22, font_size=8, color_hex='334155')
            lx += 1.55
        return sl

    cur_slide = make_slide()
    cur_y = CONTENT_Y + 0.26
    max_y = SLIDE_H - 0.40

    for dom in doms:
        dom_apps = [a for a in apps if a.get('domain') == dom]
        chip_rows = math.ceil(len(dom_apps) / chips_per_row) or 1
        dom_h = dom_pad * 2 + chip_rows * chip_h + (chip_rows - 1) * chip_gap

        if cur_y + dom_h > max_y:
            cur_slide = make_slide()
            cur_y = CONTENT_Y + 0.26

        # Domain label box
        add_rect(cur_slide, CONTENT_X, cur_y, dom_label_w, dom_h,
                 fill_hex='EFF6FF', line_hex='BFDBFE', line_w=0.5)
        add_text(cur_slide, dom, CONTENT_X + 0.08, cur_y + dom_pad,
                 dom_label_w - 0.12, dom_h * 0.55, font_size=9, bold=True, color_hex='1D4ED8')
        add_text(cur_slide, f"{len(dom_apps)} app{'s' if len(dom_apps)>1 else ''}",
                 CONTENT_X + 0.08, cur_y + dom_h * 0.62,
                 dom_label_w - 0.12, dom_h * 0.32, font_size=7, color_hex='64748B')

        chip_x0 = CONTENT_X + dom_label_w + 0.10
        for ai, app in enumerate(dom_apps):
            row = ai // chips_per_row
            col = ai % chips_per_row
            cx = chip_x0 + col * (chip_w + chip_gap)
            cy = cur_y + dom_pad + row * (chip_h + chip_gap)
            st = app.get(field) or 'Non défini'
            stc = color_map.get(st, '94A3B8')
            add_rect(cur_slide, cx, cy, chip_w, chip_h,
                     fill_hex=stc, transparency=80, line_hex=stc, line_w=0.5)
            add_rect(cur_slide, cx, cy, 0.05, chip_h, fill_hex=stc)
            add_text(cur_slide, app.get('name', ''), cx + 0.09, cy + 0.01,
                     chip_w - 0.12, chip_h * 0.55, font_size=7, bold=True, color_hex='1a1a1a')
            add_text(cur_slide, '—' if st == 'Non défini' else st,
                     cx + 0.09, cy + chip_h * 0.55, chip_w - 0.12, chip_h * 0.42,
                     font_size=6.5, color_hex=stc)

        add_rect(cur_slide, CONTENT_X, cur_y + dom_h, CONTENT_W, 0.01, fill_hex='E2E8F0')
        cur_y += dom_h + dom_gap


def add_hub_detail_slides(prs: Presentation, apps: List[Dict], flows: List[Dict], opts: Dict):
    """Une slide par hub applicatif : carte du hub + liste des applications satellites et flux."""
    if not flows:
        return

    primary = opts.get('clientPrimary', '2979FF')
    app_by_id = {a['id']: a for a in apps}

    # Compute connectivity
    conn = {a['id']: 0 for a in apps}
    for f in flows:
        if f.get('from') in conn:
            conn[f['from']] += 1
        if f.get('to') in conn:
            conn[f['to']] += 1

    # Top hubs (min 2 connections)
    hub_apps = sorted(
        [a for a in apps if conn.get(a['id'], 0) >= 2 and _hub_allowed(a, opts)],
        key=lambda a: -conn.get(a['id'], 0)
    )[:_hub_limit(opts, 15)]

    for hub in hub_apps:
        hid = hub['id']
        hub_conn_total = conn.get(hid, 0)

        # Collect incoming and outgoing flows
        outgoing = []  # hub → satellite
        incoming = []  # satellite → hub
        for f in flows:
            if f.get('from') == hid:
                sat = app_by_id.get(f.get('to', ''), {})
                if sat:
                    outgoing.append({'app': sat, 'flow': f})
            elif f.get('to') == hid:
                sat = app_by_id.get(f.get('from', ''), {})
                if sat:
                    incoming.append({'app': sat, 'flow': f})

        layout = prs.slide_layouts[8]
        slide = prs.slides.add_slide(layout)
        hub_name = hub.get('name', '')
        set_placeholders(
            slide,
            title=f"HUB — {hub_name.upper()}",
            breadcrumb="Cartographie Applicative > Hubs Applicatifs",
            subtitle=f"{len(outgoing)} flux sortants · {len(incoming)} flux entrants · {hub_conn_total} connexions"
        )

        # ── Hub info card (left column) ───────────────────────────────────
        card_x = CONTENT_X
        card_y = CONTENT_Y
        card_w = 2.50
        card_h = 3.55

        add_rect(slide, card_x, card_y, card_w, card_h, fill_hex='EFF6FF', line_hex='BFDBFE', line_w=0.8)
        add_rect(slide, card_x, card_y, card_w, 0.56, fill_hex=primary)
        add_text(slide, "APPLICATION HUB", card_x + 0.10, card_y + 0.03,
                 card_w - 0.16, 0.20, font_size=7, bold=True, color_hex='FFFFFF')
        add_text(slide, hub_name, card_x + 0.10, card_y + 0.24,
                 card_w - 0.16, 0.28, font_size=11, bold=True, color_hex='FFFFFF')

        # KPIs: connexions
        kpi_y = card_y + 0.66
        add_text(slide, str(hub_conn_total), card_x + 0.10, kpi_y, 0.80, 0.44,
                 font_size=28, bold=True, color_hex=primary)
        add_text(slide, "connexions", card_x + 0.10, kpi_y + 0.44, card_w - 0.20, 0.18,
                 font_size=7.5, color_hex='64748B')

        # Divider
        add_rect(slide, card_x + 0.10, kpi_y + 0.66, card_w - 0.20, 0.01, fill_hex='BFDBFE')

        # Metadata
        meta_y = kpi_y + 0.76
        meta_rows = [
            ('Domaine', hub.get('domain', '—')),
            ('Catégorie', hub.get('category', '—')),
            ('Criticité', hub.get('criticality', '—')),
            ('Éditeur', hub.get('vendor', '—')),
            ('Responsable', hub.get('owner', '—')),
            ('Day 1', hub.get('statusD1', '—')),
            ('Day 2', hub.get('statusD2', '—')),
        ]
        for label, val in meta_rows:
            if meta_y + 0.26 > card_y + card_h - 0.10:
                break
            add_text(slide, label, card_x + 0.10, meta_y, card_w * 0.42, 0.20,
                     font_size=7, bold=True, color_hex='1D4ED8')
            add_text(slide, str(val or '—'), card_x + 0.10 + card_w * 0.42, meta_y,
                     card_w - 0.20 - card_w * 0.42, 0.20, font_size=7.5, color_hex='334155')
            meta_y += 0.26

        # ── Flux area (right side) ─────────────────────────────────────────
        flux_x = card_x + card_w + 0.18
        flux_w = CONTENT_W - card_w - 0.18
        flux_y = card_y

        # Column headers
        cols = [
            ('Dir.', 0.28),
            ('Application satellite', flux_w * 0.26),
            ('Domaine', flux_w * 0.15),
            ('Flux / Label', flux_w * 0.22),
            ('Protocole', flux_w * 0.12),
            ('Fréquence', flux_w * 0.12),
        ]
        # Normalize col widths to fit flux_w
        total_col = sum(c[1] for c in cols)
        scale = flux_w / total_col
        cols = [(lbl, w * scale) for lbl, w in cols]

        hdr_h = 0.24
        cx = flux_x
        for lbl, cw in cols:
            add_rect(slide, cx, flux_y, cw, hdr_h, fill_hex=primary)
            add_text(slide, lbl, cx + 0.03, flux_y + 0.03, cw - 0.05, hdr_h - 0.05,
                     font_size=7.5, bold=True, color_hex='FFFFFF')
            cx += cw

        # Rows: outgoing then incoming
        row_h = min(0.28, (CONTENT_H - hdr_h - 0.10) / max(len(outgoing) + len(incoming) + 1, 1))
        row_h = max(row_h, 0.22)

        all_rows = [('→', entry) for entry in outgoing] + [('←', entry) for entry in incoming]
        max_rows = int((CONTENT_H - hdr_h - 0.10) / row_h)

        # Section separator between outgoing/incoming
        cur_ry = flux_y + hdr_h
        prev_dir = None

        for ri, (direction, entry) in enumerate(all_rows[:max_rows]):
            # Section label when direction changes
            if direction != prev_dir and len(outgoing) > 0 and len(incoming) > 0:
                if ri == 0 and direction == '→':
                    add_rect(slide, flux_x, cur_ry, flux_w, 0.20, fill_hex='DBEAFE')
                    add_text(slide, f"FLUX SORTANTS ({len(outgoing)})", flux_x + 0.06, cur_ry + 0.02,
                             flux_w - 0.10, 0.18, font_size=7.5, bold=True, color_hex='1D4ED8')
                    cur_ry += 0.20
                elif direction == '←':
                    add_rect(slide, flux_x, cur_ry, flux_w, 0.20, fill_hex='F0FDF4')
                    add_text(slide, f"FLUX ENTRANTS ({len(incoming)})", flux_x + 0.06, cur_ry + 0.02,
                             flux_w - 0.10, 0.18, font_size=7.5, bold=True, color_hex='059669')
                    cur_ry += 0.20
                prev_dir = direction

            if cur_ry + row_h > card_y + card_h + 0.05:
                break

            sat_app = entry['app']
            flow = entry['flow']
            bg = 'F8FAFC' if ri % 2 == 0 else 'FFFFFF'
            dir_color = '2563EB' if direction == '→' else '059669'

            cx = flux_x
            cell_vals = [
                direction,
                sat_app.get('name', ''),
                sat_app.get('domain', ''),
                flow.get('label', '') or flow.get('name', ''),
                flow.get('protocol', ''),
                flow.get('frequency', ''),
            ]
            for ci, (val, (lbl, cw)) in enumerate(zip(cell_vals, cols)):
                add_rect(slide, cx, cur_ry, cw, row_h, fill_hex=bg, line_hex='E2E8F0', line_w=0.3)
                fcolor = dir_color if ci == 0 else ('1E293B' if ci <= 1 else '475569')
                add_text(slide, str(val or ''), cx + 0.04, cur_ry + 0.02,
                         cw - 0.06, row_h - 0.04,
                         font_size=8 if ci <= 1 else 7.5,
                         bold=(ci <= 1),
                         color_hex=fcolor)
                cx += cw

            cur_ry += row_h

        # "… et N autres" if truncated
        if len(all_rows) > max_rows:
            extra = len(all_rows) - max_rows
            add_text(slide, f"… et {extra} autre{'s' if extra > 1 else ''} connexion(s)",
                     flux_x + 0.06, cur_ry + 0.04, flux_w - 0.10, 0.18,
                     font_size=7.5, italic=True, color_hex='94A3B8')


def add_fin_slide(prs: Presentation):
    """Final slide."""
    layout = prs.slide_layouts[14]  # 6_Slide de fin
    slide = prs.slides.add_slide(layout)
    today = datetime.date.today().strftime("%d/%m/%Y")
    for ph in slide.placeholders:
        name = ph.name.lower()
        try:
            if 'date' in name:
                ph.text = today
        except Exception:
            pass


# ─── DIAGRAM VIEWS (global cartography + per-domain view) ────────────────────
DOM_PAL = ["2563EB", "DB2777", "059669", "D97706", "7C3AED", "0891B2",
           "DC2626", "65A30D", "4F46E5", "EA580C", "0D9488", "9333EA"]
_G_HDR = 0.28


def _dom_of(a: Dict) -> str:
    return (a.get('domain') or '').strip() or 'Autre'


def _dom_colors(apps: List[Dict]) -> Dict[str, str]:
    doms = sorted({_dom_of(a) for a in apps})
    return {d: DOM_PAL[i % len(DOM_PAL)] for i, d in enumerate(doms)}


def _short(text, n: int) -> str:
    t = str(text or '')
    return t if len(t) <= n else t[:n - 1] + '…'


def add_pill(slide, p, text, color, font=8, dot=False, name=None):
    """Native rounded pill (or dot) representing one application."""
    from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
    from pptx.enum.text import MSO_ANCHOR
    x, y, w, h = p
    shp = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.OVAL if dot else MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE,
        Inches(x), Inches(y), Inches(w), Inches(h))
    if not dot:
        try:
            shp.adjustments[0] = 0.3
        except Exception:
            pass
    shp.fill.solid()
    shp.fill.fore_color.rgb = hex_color(color if dot else lighten(color, 0.82))
    shp.line.color.rgb = hex_color(color)
    shp.line.width = Pt(0.75)
    try:
        shp.shadow.inherit = False
    except Exception:
        pass
    if name:
        shp.name = name
    if not dot and text:
        tf = shp.text_frame
        tf.word_wrap = False
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = tf.margin_right = Inches(0.04)
        tf.margin_top = tf.margin_bottom = 0
        para = tf.paragraphs[0]
        para.alignment = PP_ALIGN.CENTER
        r = para.add_run()
        r.text = text
        r.font.size = Pt(font)
        r.font.name = "Poppins"
        r.font.color.rgb = hex_color('0F172A')
    return shp


def _edge(p, tx, ty):
    cx, cy = p[0] + p[2] / 2, p[1] + p[3] / 2
    dx, dy = tx - cx, ty - cy
    if dx == 0 and dy == 0:
        return cx, cy
    t = min((p[2] / 2) / abs(dx) if dx else 1e9, (p[3] / 2) / abs(dy) if dy else 1e9)
    return cx + dx * t, cy + dy * t


def add_flow_line(slide, a, b, color, width=0.9):
    """Native straight connector with arrow head from pill a to pill b."""
    from pptx.enum.shapes import MSO_CONNECTOR
    from pptx.oxml.ns import qn
    from lxml import etree
    acx, acy = a[0] + a[2] / 2, a[1] + a[3] / 2
    bcx, bcy = b[0] + b[2] / 2, b[1] + b[3] / 2
    x1, y1 = _edge(a, bcx, bcy)
    x2, y2 = _edge(b, acx, acy)
    conn = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    conn.line.color.rgb = hex_color(color)
    conn.line.width = Pt(width)
    try:
        tail = etree.SubElement(conn.line._get_or_add_ln(), qn('a:tailEnd'))
        tail.set('type', 'triangle')
        tail.set('w', 'sm')
        tail.set('len', 'sm')
    except Exception:
        pass
    return conn


def _draw_group_box(slide, x, y, w, h, color, label):
    add_rect(slide, x, y, w, h, fill_hex=lighten(color, 0.93), line_hex=lighten(color, 0.55), line_w=0.75)
    add_rect(slide, x, y, w, _G_HDR, fill_hex=color)
    add_text(slide, label, x + 0.10, y + 0.02, w - 0.20, _G_HDR - 0.04,
             font_size=9, bold=True, color_hex='FFFFFF')


def _layout_global(apps: List[Dict], region):
    """Grid of domain boxes; pills (named when few apps, dots otherwise). Returns None if nothing fits."""
    X, Y, W, H = region
    groups: Dict[str, List[Dict]] = {}
    for a in apps:
        groups.setdefault(_dom_of(a), []).append(a)
    doms = sorted(groups, key=lambda d: (-len(groups[d]), d))
    nd = len(doms)
    GUT, PAD = 0.34, 0.10
    modes = []
    if len(apps) <= 60:
        modes.append((1.15, 0.27, 0.08, False))
        modes.append((1.05, 0.21, 0.05, False))
    modes += [(0.17, 0.17, 0.07, True), (0.12, 0.12, 0.04, True)]
    col_opts = [c for c in (3, 2, 4, 1, 5, 6) if c <= nd] or [1]
    for pw, ph, gap, dot in modes:
        for cols in col_opts:
            rows = math.ceil(nd / cols)
            cw = (W - (cols - 1) * GUT) / cols
            per_row = int(((cw - 2 * PAD) + gap) // (pw + gap))
            if per_row < 1:
                continue
            need = {d: _G_HDR + 2 * PAD + math.ceil(len(groups[d]) / per_row) * (ph + gap) - gap for d in doms}
            row_h = [max(need[d] for d in doms[r * cols:(r + 1) * cols]) for r in range(rows)]
            total = sum(row_h) + (rows - 1) * GUT
            if total > H:
                continue
            extra = min((H - total) / rows, 0.5)
            row_h = [h + extra for h in row_h]
            cells, pills = {}, {}
            y = Y
            for r in range(rows):
                for c, d in enumerate(doms[r * cols:(r + 1) * cols]):
                    x = X + c * (cw + GUT)
                    cells[d] = (x, y, cw, row_h[r])
                    for i, a in enumerate(groups[d]):
                        pills[a['id']] = (x + PAD + (i % per_row) * (pw + gap),
                                          y + _G_HDR + PAD + (i // per_row) * (ph + gap), pw, ph)
                y += row_h[r] + GUT
            return {'cells': cells, 'pills': pills, 'dot': dot, 'groups': groups, 'doms': doms}
    return None


def add_ortho(slide, pts, color, width=1.0):
    """Native right-angle polyline with an arrow head on the last point."""
    from pptx.oxml.ns import qn
    from lxml import etree
    fb = slide.shapes.build_freeform(int(Inches(pts[0][0])), int(Inches(pts[0][1])))
    fb.add_line_segments([(int(Inches(x)), int(Inches(y))) for x, y in pts[1:]], close=False)
    shp = fb.convert_to_shape()
    shp.fill.background()
    shp.line.color.rgb = hex_color(color)
    shp.line.width = Pt(width)
    try:
        shp.shadow.inherit = False
        tail = etree.SubElement(shp.line._get_or_add_ln(), qn('a:tailEnd'))
        tail.set('type', 'triangle')
        tail.set('w', 'med')
        tail.set('len', 'med')
    except Exception:
        pass
    return shp


def add_flow_label(slide, text, x, y, color, align_right=False, font=7, max_w=1.35):
    """Small white tag centred vertically on y; anchored left (or right) at x."""
    from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
    from pptx.enum.text import MSO_ANCHOR
    w = min(max_w, max(0.35, 0.058 * len(text) + 0.12))
    left = x - w if align_right else x
    shp = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(left), Inches(y - 0.07), Inches(w), Inches(0.14))
    shp.fill.solid()
    shp.fill.fore_color.rgb = hex_color('FFFFFF')
    shp.line.color.rgb = hex_color(color)
    shp.line.width = Pt(0.5)
    try:
        shp.shadow.inherit = False
    except Exception:
        pass
    tf = shp.text_frame
    tf.word_wrap = False
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.margin_left = tf.margin_right = Inches(0.03)
    tf.margin_top = tf.margin_bottom = 0
    para = tf.paragraphs[0]
    para.alignment = PP_ALIGN.CENTER
    r = para.add_run()
    r.text = text
    r.font.size = Pt(font)
    r.font.name = "Poppins"
    r.font.color.rgb = hex_color('0F172A')
    return shp


def _assign_lanes(items):
    """items: list of (key, lo, hi). Interval colouring: overlapping spans get distinct lanes."""
    lanes: List[float] = []
    out = {}
    for key, lo, hi in sorted(items, key=lambda t: (t[1], t[2])):
        for i, end in enumerate(lanes):
            if end < lo - 0.03:
                lanes[i] = hi
                out[key] = i
                break
        else:
            lanes.append(hi)
            out[key] = len(lanes) - 1
    return out, len(lanes)


def add_carto_globale_slide(prs: Presentation, apps: List[Dict], flows: List[Dict], opts: Dict):
    """All applications grouped by domain; inter-domain flows as labelled right-angle corridors."""
    colors = _dom_colors(apps)
    sl = prs.slides.add_slide(prs.slide_layouts[8])
    set_placeholders(sl, title="CARTOGRAPHIE GLOBALE", breadcrumb="Cartographie Applicative")
    lay = _layout_global(apps, (0.55, 2.55, 11.65, 4.30))
    if not lay:
        add_text(sl, "Périmètre trop volumineux pour une vue unique : voir les vues par domaine.",
                 1.25, 3.5, 10.0, 0.4, font_size=14, color_hex='64748B')
        return
    dom_of_id = {a['id']: _dom_of(a) for a in apps}
    corr: Dict = {}
    internal: Dict[str, int] = {}
    for f in flows:
        a, b = f.get('from'), f.get('to')
        if a in dom_of_id and b in dom_of_id and a != b:
            da, db = dom_of_id[a], dom_of_id[b]
            if da == db:
                internal[da] = internal.get(da, 0) + 1
            else:
                corr[(da, db)] = corr.get((da, db), 0) + 1
    for d in lay['doms']:
        x, y, w, h = lay['cells'][d]
        extra = f"  ·  {internal[d]} flux int." if internal.get(d) else ''
        _draw_group_box(sl, x, y, w, h, colors[d], f"{d.upper()}  ·  {len(lay['groups'][d])}{extra}")

    cells = lay['cells']
    row_ys = sorted({round(c[1], 3) for c in cells.values()})
    gutters: Dict[tuple, List] = {}
    plan = []
    shown = 0
    for (da, db), n in sorted(corr.items(), key=lambda kv: -kv[1]):
        if len(plan) >= 24:
            break
        ca, cb = cells[da], cells[db]
        ra, rb = row_ys.index(round(ca[1], 3)), row_ys.index(round(cb[1], 3))
        down = rb > ra
        side = 'bottom' if down else 'top'
        gkey = (ra, side)
        xa, xb = ca[0] + ca[2] / 2, cb[0] + cb[2] / 2
        items = gutters.setdefault(gkey, [])
        _, nl = _assign_lanes([(i[0], i[1], i[2]) for i in items] + [((da, db), min(xa, xb), max(xa, xb))])
        if nl > 3:
            continue
        items.append(((da, db), min(xa, xb), max(xa, xb)))
        plan.append(((da, db), n, gkey, down))
    lane_of: Dict = {}
    for gkey, items in gutters.items():
        res, _ = _assign_lanes(items)
        lane_of.update({(gkey, k): v for k, v in res.items()})

    ports: Dict = {}
    for (da, db), n, gkey, down in plan:
        ports.setdefault((da, 'out', gkey[1]), []).append((cells[db][0], (da, db)))
        ports.setdefault((db, 'in', 'top' if down else 'bottom'), []).append((cells[da][0], (da, db)))
    px: Dict = {}
    for (dom, _, side), lst in ports.items():
        lst.sort()
        c = cells[dom]
        for k, (_, key) in enumerate(lst):
            px[(dom, side, key)] = c[0] + 0.30 + (c[2] - 0.60) * (k + 0.5) / len(lst)

    for (da, db), n, gkey, down in plan:
        ca, cb = cells[da], cells[db]
        ra = gkey[0]
        side = gkey[1]
        gy = (ca[1] + ca[3] + (row_ys[ra + 1] - (ca[1] + ca[3])) / 2) if down else (ca[1] - 0.15)
        if down and ra + 1 >= len(row_ys):
            gy = ca[1] + ca[3] + 0.17
        gy += (lane_of[(gkey, (da, db))] - 1) * 0.085
        x1 = px[(da, side, (da, db))]
        x2 = px[(db, 'top' if down else 'bottom', (da, db))]
        y1 = ca[1] + ca[3] if down else ca[1]
        y2 = cb[1] if down else cb[1] + cb[3]
        wdt = min(3.5, 1.0 + 0.12 * n)
        add_ortho(sl, [(x1, y1), (x1, gy), (x2, gy), (x2, y2)], colors[da], wdt)
        add_flow_label(sl, f"{n} flux", (x1 + x2) / 2, gy, colors[da], font=7)
        shown += 1
    for a in apps:
        add_pill(sl, lay['pills'][a['id']], _short(a.get('name', ''), 17), colors[dom_of_id[a['id']]],
                 font=8, dot=lay['dot'], name=a.get('name', ''))
    hidden = len(corr) - shown
    note = "Flèches : flux regroupés entre domaines (couleur = domaine émetteur)"
    if hidden > 0:
        note += f" · {hidden} liaison(s) secondaire(s) non tracée(s)"
    note += " · détail flux par flux dans les vues par domaine"
    add_text(sl, note, 0.55, 6.92, 11.6, 0.2, font_size=8, color_hex='64748B')


PORT_SP = 0.16
ROW_MIN = 0.30
COL_AVAIL = 4.10


def _flows_for(ids, by_id, flows):
    return [f for f in flows if (f.get('from') in ids or f.get('to') in ids)
            and f.get('from') in by_id and f.get('to') in by_id and f.get('from') != f.get('to')]


def _counts(rel):
    cnt: Dict[str, int] = {}
    for f in rel:
        for e in (f['from'], f['to']):
            cnt[e] = cnt.get(e, 0) + 1
    return cnt


def _col_h(members, cnt, k=1.0):
    return sum(max(ROW_MIN, PORT_SP * cnt.get(m, 0) * k + 0.04) + 0.06 for m in members)


def _chunk_domain(dom_apps, by_id, flows):
    chunks, cur = [], []
    for a in dom_apps:
        trial = cur + [a]
        ids = {x['id'] for x in trial}
        rel = _flows_for(ids, by_id, flows)
        cnt = _counts(rel)
        ext = [e for e in cnt if e not in ids]
        if cur and max(_col_h([x['id'] for x in trial], cnt, 0.75), _col_h(ext, cnt, 0.75)) > COL_AVAIL:
            chunks.append(cur)
            cur = [a]
        else:
            cur = trial
    if cur:
        chunks.append(cur)
    return chunks


def _domain_slide(prs, dom, chunk, ci, nchunks, dom_total, by_id, flows, colors):
    col = colors[dom]
    ids = {a['id'] for a in chunk}
    rel = _flows_for(ids, by_id, flows)
    cnt = _counts(rel)
    ext_ids = [e for e in cnt if e not in ids]
    internal = sum(1 for f in rel if f['from'] in ids and f['to'] in ids)
    out_ext = sum(1 for f in rel if f['from'] in ids and f['to'] not in ids)
    in_ext = sum(1 for f in rel if f['to'] in ids and f['from'] not in ids)

    sl = prs.slides.add_slide(prs.slide_layouts[8])
    title = f"DOMAINE — {dom.upper()}" + (f" ({ci + 1}/{nchunks})" if nchunks > 1 else "")
    sub = f"{len(chunk)} application(s) · {internal} flux internes · {out_ext} sortants · {in_ext} entrants"
    set_placeholders(sl, title=title, breadcrumb="Cartographie Applicative > Vue par domaine", subtitle=sub)

    LY = 2.25
    k = 1.0
    while max(_col_h(list(ids), cnt, k), _col_h(ext_ids, cnt, k)) > COL_AVAIL and k > 0.3:
        k -= 0.05
    sp = PORT_SP * k
    show_labels = sp >= 0.105

    def rows(members, y0):
        pos, y = {}, y0
        for m in members:
            rh = max(ROW_MIN, PORT_SP * cnt.get(m, 0) * k + 0.04)
            pos[m] = (y, rh)
            y += rh + 0.06
        return pos, y

    left_ids = [a['id'] for a in sorted(chunk, key=lambda a: a.get('name', ''))]
    lpos, lend = rows(left_ids, LY + _G_HDR + 0.08)
    ly_center = {m: p[0] + p[1] / 2 for m, p in lpos.items()}
    nbr: Dict[str, List[float]] = {}
    for f in rel:
        a, b = f['from'], f['to']
        if a in ids and b not in ids:
            nbr.setdefault(b, []).append(ly_center[a])
        elif b in ids and a not in ids:
            nbr.setdefault(a, []).append(ly_center[b])
    ext_ids.sort(key=lambda e: (sum(nbr[e]) / len(nbr[e]), by_id[e].get('name', '')))
    epos, eend = rows(ext_ids, LY + _G_HDR + 0.08)

    LXP, LW = 0.55, 2.30
    EXP, EW = 9.90, 2.30
    _draw_group_box(sl, LXP, LY, LW, lend - LY + 0.02, col, f"{dom.upper()} · {len(chunk)}")
    if ext_ids:
        add_rect(sl, EXP, LY, EW, eend - LY + 0.02, fill_hex='F1F5F9', line_hex='CBD5E1', line_w=0.75)
        add_rect(sl, EXP, LY, EW, _G_HDR, fill_hex='64748B')
        add_text(sl, f"AUTRES APPLICATIONS · {len(ext_ids)}", EXP + 0.10, LY + 0.02, EW - 0.2, _G_HDR - 0.04,
                 font_size=9, bold=True, color_hex='FFFFFF')

    pill = {}
    for m, (y, rh) in lpos.items():
        pill[m] = (LXP + 0.10, y, LW - 0.20, rh - 0.02, 'L')
    for m, (y, rh) in epos.items():
        pill[m] = (EXP + 0.10, y, EW - 0.20, rh - 0.02, 'R')

    slots: Dict[str, List] = {}
    for i, f in enumerate(rel):
        for end, other in (('from', 'to'), ('to', 'from')):
            e = f[end]
            slots.setdefault(e, []).append((pill[f[other]][1], i))
    port_y: Dict = {}
    for e, lst in slots.items():
        lst.sort()
        _, y, _, h, _ = pill[e]
        for j, (_, i) in enumerate(lst):
            port_y[(e, i)] = y + h * (j + 0.5) / len(lst)

    L_STUB_END = LXP + 0.10 + (LW - 0.20)
    E_STUB_START = EXP + 0.10
    lane_lo, lane_hi = L_STUB_END + 1.50, E_STUB_START - 1.50
    spans = []
    for i, f in enumerate(rel):
        y1, y2 = port_y[(f['from'], i)], port_y[(f['to'], i)]
        spans.append((i, min(y1, y2), max(y1, y2)))
    lane_idx, nl = _assign_lanes(spans)
    step = min(0.15, (lane_hi - lane_lo) / max(nl, 1))

    for i, f in enumerate(rel):
        a, b = f['from'], f['to']
        ya, yb = port_y[(a, i)], port_y[(b, i)]
        sa, sb = pill[a][4], pill[b][4]
        xa = L_STUB_END if sa == 'L' else E_STUB_START
        xb = L_STUB_END if sb == 'L' else E_STUB_START
        if sa == 'L' and sb == 'L':
            lx = L_STUB_END + 0.25 + (lane_idx[i] % 6) * 0.14
        else:
            lx = lane_lo + lane_idx[i] * step
        c = colors.get(_dom_of(by_id[a]), col)
        add_ortho(sl, [(xa, ya), (lx, ya), (lx, yb), (xb, yb)], c, 1.0)
        if show_labels:
            txt = _short(f.get('label') or f.get('name') or '', 22)
            if txt:
                if sa == 'L':
                    add_flow_label(sl, txt, xa + 0.05, ya, c, font=7)
                else:
                    add_flow_label(sl, txt, xa - 0.05, ya, c, align_right=True, font=7)
    for m, (x, y, w, h, _) in pill.items():
        dc = colors.get(_dom_of(by_id[m]), col)
        name = by_id[m].get('name', '')
        txt = _short(name, 30) if m in ids else _short(f"{name} · {_dom_of(by_id[m])}", 34)
        add_pill(sl, (x, y, w, h), txt, dc, font=8 if h >= 0.26 else 7, name=name)
    note = f"Flèches : flux (couleur = domaine émetteur) · {len(rel)} flux"
    if not show_labels:
        note += " · étiquettes masquées (trop de flux sur une application)"
    add_text(sl, note, 0.55, 6.92, 11.6, 0.2, font_size=8, color_hex='64748B')


def add_domain_view_slides(prs: Presentation, apps: List[Dict], flows: List[Dict], opts: Dict):
    """One or more slides per domain: its applications, linked applications and every flow, labelled."""
    colors = _dom_colors(apps)
    by_id = {a['id']: a for a in apps}
    groups: Dict[str, List[Dict]] = {}
    for a in apps:
        groups.setdefault(_dom_of(a), []).append(a)
    for dom in sorted(groups, key=lambda d: (-len(groups[d]), d)):
        dom_apps = sorted(groups[dom], key=lambda a: a.get('name', ''))
        chunks = _chunk_domain(dom_apps, by_id, flows)
        for ci, chunk in enumerate(chunks):
            _domain_slide(prs, dom, chunk, ci, len(chunks), len(dom_apps), by_id, flows, colors)


# ─── SECTION CATALOG & PLAN ──────────────────────────────────────────────────
# Each section: id, label, group, description, requires ('flows'|'apps'|'deal'|None)
SECTIONS = [
    {"id": "cover", "group": "Introduction", "label": "Page de garde", "requires": None},
    {"id": "synthese", "group": "Introduction", "label": "Synthèse & messages clés", "requires": "apps"},
    {"id": "executive", "group": "Introduction", "label": "Synthèse exécutive (chiffres clés)", "requires": "apps"},
    {"id": "carto_globale", "group": "Cartographie", "label": "Cartographie globale — applications par domaine et tous les flux", "requires": "apps"},
    {"id": "domain_view", "group": "Cartographie", "label": "Vue par domaine — applications et flux (1 diapositive / domaine)", "requires": "apps"},
    {"id": "flux_matrix", "group": "Flux", "label": "Matrice des flux inter-domaines", "requires": "flows"},
    {"id": "hubs", "group": "Flux", "label": "Hubs applicatifs (vue d'ensemble)", "requires": "flows"},
    {"id": "hub_detail", "group": "Flux", "label": "Détail par hub (1 diapositive / hub)", "requires": "flows"},
    {"id": "flux_table", "group": "Flux", "label": "Tableau détaillé des flux", "requires": "flows"},
    {"id": "domain_status", "group": "Domaines", "label": "Cartographie par domaine (Day 1 / Day 2)", "requires": "deal"},
    {"id": "env_d1", "group": "Domaines", "label": "Environnement applicatif — Day 1", "requires": "deal"},
    {"id": "env_d2", "group": "Domaines", "label": "Environnement applicatif — Day 2", "requires": "deal"},
    {"id": "paysage", "group": "Portefeuille", "label": "Paysage applicatif (treemap)", "requires": "apps"},
    {"id": "recap_apps", "group": "Portefeuille", "label": "Récapitulatif des applications", "requires": "apps"},
    {"id": "end", "group": "Conclusion", "label": "Diapositive de fin", "requires": None},
]


def _default_sections(opts: Dict) -> List[str]:
    """Back-compat: derive section ids from the legacy inclXxx flags."""
    ids = []
    if opts.get('inclExecSlides', True):
        ids += ['cover', 'synthese', 'executive']
    if opts.get('inclConsolidatedCarto', True):
        ids += ['carto_globale', 'domain_view', 'flux_matrix', 'hubs', 'hub_detail']
    if opts.get('inclDomainStatus', False):
        ids += ['domain_status']
    ids += ['env_d1', 'env_d2']
    if opts.get('inclPaysage', True):
        ids += ['paysage']
    if opts.get('inclMatrices', True):
        ids += ['recap_apps']
    ids += ['flux_table', 'end']
    return ids


def _slide_title(slide) -> str:
    for sh in slide.shapes:
        if sh.is_placeholder and sh.has_text_frame and sh.text_frame.text.strip():
            return sh.text_frame.text.strip()
    return ''


def _build(prs, apps, flows, opts, ids):
    """Run the selected section builders in catalog order; return plan entries."""
    runners = {
        'cover': lambda: add_cover_slide(prs, apps, flows, opts),
        'synthese': lambda: add_synthese_messages_slide(prs, apps, flows, opts),
        'executive': lambda: add_executive_slide(prs, apps, opts),
        'carto_globale': lambda: add_carto_globale_slide(prs, apps, flows, opts),
        'domain_view': lambda: add_domain_view_slides(prs, apps, flows, opts),
        'flux_matrix': lambda: add_flux_matrix_slide(prs, apps, flows, opts),
        'hubs': lambda: add_hubs_slide(prs, apps, flows, opts),
        'hub_detail': lambda: add_hub_detail_slides(prs, apps, flows, opts),
        'flux_table': lambda: add_flux_table_slides(prs, apps, flows, opts),
        'domain_status': lambda: add_domain_status_slides(prs, apps, opts),
        'env_d1': lambda: add_env_applicatif_slides(prs, apps, opts, 'statusD1',
                                                    "ENVIRONNEMENT APPLICATIF — DAY 1 (CLOSING)", D1_COLORS),
        'env_d2': lambda: add_env_applicatif_slides(prs, apps, opts, 'statusD2',
                                                    "ENVIRONNEMENT APPLICATIF — DAY 2 (CIBLE)", D2_COLORS),
        'paysage': lambda: add_paysage_slide(prs, apps),
        'recap_apps': lambda: add_recap_apps_slides(prs, apps, opts),
        'end': lambda: add_fin_slide(prs),
    }
    wanted = set(ids)
    plan = []
    for sec in SECTIONS:
        sid = sec['id']
        if sid not in wanted:
            continue
        req = sec['requires']
        if (req == 'flows' and not flows) or (req in ('apps', 'deal') and not apps):
            continue
        before = len(prs.slides)
        runners[sid]()
        added = list(range(before, len(prs.slides)))
        _enrich(prs, added, sid, sec, apps, flows)
        for idx in added:
            plan.append({"section": sid, "title": _slide_title(prs.slides[idx]) or sec['label']})
    return plan


def _top(counter: Dict, n: int = 1):
    return sorted(counter.items(), key=lambda kv: -kv[1])[:n]


def _conclusion(sid: str, apps: List[Dict], flows: List[Dict]) -> str:
    """Rule-based conclusive subtitle computed from the data (no LLM)."""
    by_id = {a['id']: a for a in apps}
    n_apps, n_flows = len(apps), len(flows)
    crit = sum(1 for a in apps if str(a.get('criticality', '')).lower() in ('haute', 'critique', 'high'))
    doms = {}
    for a in apps:
        if a.get('domain'):
            doms[a['domain']] = doms.get(a['domain'], 0) + 1
    pairs = {}
    for f in flows:
        fa, ta = by_id.get(f.get('from')), by_id.get(f.get('to'))
        if fa and ta and fa.get('domain') != ta.get('domain'):
            k = f"{fa.get('domain')} → {ta.get('domain')}"
            pairs[k] = pairs.get(k, 0) + 1
    inter = sum(pairs.values())
    conn = {}
    for f in flows:
        for k in (f.get('from'), f.get('to')):
            if k in by_id:
                conn[k] = conn.get(k, 0) + 1

    if sid == 'carto_globale' and n_apps:
        txt = f"{n_apps} applications dans {len(doms)} domaines"
        if n_flows:
            txt += f", {n_flows} flux dont {inter} entre domaines ({round(100 * inter / n_flows)} %)"
        return txt
    if sid == 'synthese' and n_flows:
        pct = round(100 * inter / n_flows)
        txt = f"{pct} % des flux sont inter-domaines"
        if pairs:
            txt += f" — corridor principal : {_top(pairs)[0][0]}"
        return txt
    if sid == 'executive' and n_apps:
        txt = f"{n_apps} applications sur {len(doms)} domaines"
        return txt + (f", dont {crit} à criticité haute" if crit else "")
    if sid == 'flux_matrix' and pairs:
        k, v = _top(pairs)[0]
        return f"{k} concentre {v} flux, soit {round(100 * v / max(inter, 1))} % des échanges inter-domaines"
    if sid in ('hubs', 'hub_detail') and conn:
        hid, c = _top(conn)[0]
        return f"{by_id[hid].get('name', '')} est le hub principal avec {c} connexions"
    if sid == 'paysage' and doms:
        d, c = _top(doms)[0]
        return f"{d} regroupe {c} applications sur {n_apps} ({round(100 * c / n_apps)} %)"
    if sid == 'recap_apps' and n_apps:
        return f"{n_apps} applications, dont {crit} à criticité haute"
    if sid == 'flux_table' and n_flows:
        protos = {}
        for f in flows:
            if f.get('protocol'):
                protos[f['protocol']] = protos.get(f['protocol'], 0) + 1
        txt = f"{n_flows} flux inventoriés"
        if protos:
            p, c = _top(protos)[0]
            txt += f" — protocole dominant : {p} ({round(100 * c / n_flows)} %)"
        return txt
    if sid in ('env_d1', 'env_d2') and n_apps:
        field = 'statusD1' if sid == 'env_d1' else 'statusD2'
        st = {}
        for a in apps:
            if a.get(field):
                st[a[field]] = st.get(a[field], 0) + 1
        if st:
            s, c = _top(st)[0]
            return f"« {s} » est le statut majoritaire : {c} applications ({round(100 * c / n_apps)} %)"
    return ''


def _enrich(prs, indices, sid, sec, apps, flows):
    """Conclusive subtitles, page numbers on multi-page sections, and speaker notes."""
    n = len(indices)
    concl = _conclusion(sid, apps, flows)
    for k, idx in enumerate(indices):
        slide = prs.slides[idx]
        if n > 1 and sid in ('domain_status', 'env_d1', 'env_d2', 'hub_detail') and sid != 'hub_detail':
            title = _slide_title(slide)
            if title and not title.endswith(')'):
                set_placeholders(slide, title=f"{title} ({k + 1}/{n})")
        if concl and sid not in ('hub_detail', 'domain_view'):
            set_placeholders(slide, subtitle=concl)
        try:
            slide.notes_slide.notes_text_frame.text = (
                f"{sec['label']}.\n{concl}\n"
                f"Source : cartographie applicative — {len(apps)} applications, {len(flows)} flux "
                f"(périmètre exporté)."
            ).replace("\n\n", "\n")
        except Exception:
            pass


def _resolve_ids(opts: Dict) -> List[str]:
    ids = opts.get('sections')
    return list(ids) if isinstance(ids, list) else _default_sections(opts)


def plan_pptx(apps: List[Dict], flows: List[Dict], opts: Dict, template_path: str) -> Dict:
    """Exact slide plan (same code path as generation, without serialising the file)."""
    prs = Presentation(template_path)
    _clear_slides(prs)
    plan = _build(prs, apps, flows, opts, _resolve_ids(opts))
    return {"slides": plan, "count": len(plan)}


# ─── MAIN ENTRY POINT ────────────────────────────────────────────────────────
def _stamp_logo(prs, data_url):
    """Place the client logo (data URL) top-right on every slide."""
    if not data_url or ',' not in data_url:
        return
    import base64
    try:
        raw = base64.b64decode(data_url.split(',', 1)[1])
    except Exception:
        return
    for slide in prs.slides:
        try:
            slide.shapes.add_picture(io.BytesIO(raw), Inches(12.10), Inches(0.06), height=Inches(0.46))
        except Exception:
            return


def generate_pptx(apps: List[Dict], flows: List[Dict], opts: Dict, template_path: str) -> bytes:
    """Generate a PPTX presentation using the given template. Returns the file as bytes."""
    prs = Presentation(template_path)
    _clear_slides(prs)
    _build(prs, apps, flows, opts, _resolve_ids(opts))
    _cleanup_placeholders(prs)
    _stamp_logo(prs, opts.get('clientLogo'))
    buf = io.BytesIO()
    prs.save(buf)
    buf.seek(0)
    return buf.read()
