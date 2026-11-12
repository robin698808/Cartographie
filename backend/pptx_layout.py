"""Bounded orthogonal routing for editable PowerPoint maps."""
import heapq
import math
from collections import Counter

WIDTH, HEIGHT = 96, 42
REGION = (0.55, 2.40, 11.70, 4.30)


def _domain(app):
    return (app.get("domain") or "").strip() or "Autre"


def _positions(apps, flows, variant):
    groups = {}
    for app in apps:
        groups.setdefault(_domain(app), []).append(app)
    degree = Counter(endpoint for f in flows for endpoint in (f.get("from"), f.get("to")))
    by_id = {a["id"]: _domain(a) for a in apps}
    domain_links = Counter()
    for flow in flows:
        a, b = by_id[flow["from"]], by_id[flow["to"]]
        if a != b:
            domain_links[tuple(sorted((a, b)))] += 1
    remaining = set(groups)
    domains = []
    while remaining:
        current = min(remaining, key=lambda d: (
            -sum(domain_links[tuple(sorted((d, prev)))] for prev in domains[-2:] if prev != d),
            -sum(degree[a["id"]] for a in groups[d]), d.casefold()))
        domains.append(current)
        remaining.remove(current)
    if variant == 1:
        domains.reverse()
    if variant == 2:
        domains = sorted(domains, key=str.casefold)
    columns = max(1, min(len(domains), round(math.sqrt(len(domains) * 2.1))))
    rows = math.ceil(len(domains) / columns)
    cw, ch = WIDTH / columns, HEIGHT / rows
    boxes, nodes = {}, {}
    for index, domain in enumerate(domains):
        x, y = (index % columns) * cw, (index // columns) * ch
        boxes[domain] = (x + .4, y + .4, cw - .8, ch - .8)
        members = sorted(groups[domain], key=lambda a: (-degree[a["id"]], str(a.get("name", "")).casefold()))
        if variant == 1:
            members.reverse()
        if variant == 2:
            members.sort(key=lambda a: str(a.get("name", "")).casefold())
        ncols = max(1, min(len(members), math.ceil(math.sqrt(len(members) * cw / max(ch - 3, 1)))))
        nrows = math.ceil(len(members) / ncols)
        cellw, cellh = (cw - 2) / ncols, (ch - 3) / nrows
        for i, app in enumerate(members):
            w, h = max(.3, min(13, cellw * .68)), max(.3, min(2.4, cellh * .55))
            cx = x + 1 + cellw * ((i % ncols) + .5)
            cy = y + 2.5 + cellh * ((i // ncols) + .5)
            nodes[app["id"]] = (cx - w / 2, cy - h / 2, w, h)
    return boxes, nodes


def _ports(box):
    x, y, w, h = box
    return [(round(x - 1), round(y + h / 2)), (round(x + w + 1), round(y + h / 2)),
            (round(x + w / 2), round(y - 1)), (round(x + w / 2), round(y + h + 1))]


def _route(start, end, blocked, occupied):
    start = (max(0, min(WIDTH, start[0])), max(0, min(HEIGHT, start[1])))
    end = (max(0, min(WIDTH, end[0])), max(0, min(HEIGHT, end[1])))
    queue = [(0, 0, start, -1)]
    best = {(start, -1): 0}
    previous = {}
    while queue:
        _, cost, point, direction = heapq.heappop(queue)
        if cost != best.get((point, direction)):
            continue
        if point == end:
            state = (point, direction)
            path = []
            while state in previous:
                path.append(state[0])
                state = previous[state]
            path.append(start)
            return list(reversed(path))
        for nd, (dx, dy) in enumerate(((1, 0), (-1, 0), (0, 1), (0, -1))):
            nxt = (point[0] + dx, point[1] + dy)
            if not (0 <= nxt[0] <= WIDTH and 0 <= nxt[1] <= HEIGHT):
                continue
            if nxt in blocked and nxt not in (start, end):
                continue
            ncost = cost + 1 + (0.7 if direction != -1 and direction != nd else 0) + occupied.get(nxt, 0) * 5
            state = (nxt, nd)
            if ncost < best.get(state, float("inf")):
                best[state] = ncost
                previous[state] = (point, direction)
                estimate = abs(nxt[0] - end[0]) + abs(nxt[1] - end[1])
                heapq.heappush(queue, (ncost + estimate, ncost, nxt, nd))
    return None


def _simplify(points):
    result = []
    for point in points:
        if len(result) >= 2:
            a, b = result[-2:]
            if (a[0] == b[0] == point[0]) or (a[1] == b[1] == point[1]):
                result[-1] = point
                continue
        result.append(point)
    return result


def _edge(box, port):
    x, y, w, h = box
    px, py = port
    if px < x:
        return (x, max(y, min(y + h, py)))
    if px > x + w:
        return (x + w, max(y, min(y + h, py)))
    if py < y:
        return (max(x, min(x + w, px)), y)
    return (max(x, min(x + w, px)), y + h)


def _overlap(a, b):
    return a[0] < b[0] + b[2] and a[0] + a[2] > b[0] and a[1] < b[1] + b[3] and a[1] + a[3] > b[1]


def _evaluate(apps, flows, variant):
    boxes, nodes = _positions(apps, flows, variant)
    blocked = set()
    for x, y, w, h in nodes.values():
        for gx in range(max(0, math.ceil(x)), min(WIDTH, math.floor(x + w)) + 1):
            for gy in range(max(0, math.ceil(y)), min(HEIGHT, math.floor(y + h)) + 1):
                blocked.add((gx, gy))
    used = Counter()
    used_ports = Counter()
    routes = []
    fallback = 0
    # Route long links first; retain the input index for deterministic identification.
    indexed = sorted(enumerate(flows), key=lambda item: (
        -sum(abs(a - b) for a, b in zip(nodes[item[1]["from"]][:2], nodes[item[1]["to"]][:2])),
        item[0]))
    for index, flow in indexed:
        source, target = nodes[flow["from"]], nodes[flow["to"]]
        source_ports, target_ports = _ports(source), _ports(target)
        choices = [(abs(a[0] - b[0]) + abs(a[1] - b[1]) + 3 * (used_ports[a] + used_ports[b]), a, b)
                   for a in source_ports for b in target_ports if flow["from"] != flow["to"] or a != b]
        choices.sort()
        path = None
        for _, a, b in choices[:6]:
            path = _route(a, b, blocked, used)
            if path:
                break
        if not path:
            fallback += 1
            _, a, b = choices[0]
            path = [a, b]
        used_ports[a] += 1
        used_ports[b] += 1
        used.update(path[1:-1])
        points = [_edge(source, a)] + _simplify(path) + [_edge(target, b)]
        routes.append({"index": index, "flow": flow, "points": _simplify(points), "grid": path})
    route_conflicts = sum(1 for count in used.values() if count > 1)
    labels = []
    label_conflicts = 0
    for route in sorted(routes, key=lambda r: r["index"]):
        text = str(route["flow"].get("label") or route["flow"].get("name") or "")
        if not text:
            continue
        width = min(32, max(5, len(text) * .68 + 1))
        height = 2.4
        candidates = []
        pts = route["points"]
        for a, b in zip(pts, pts[1:]):
            if abs(a[1] - b[1]) > .01 or abs(a[0] - b[0]) < 2:
                continue
            for fraction in (.5, .25, .75):
                cx = a[0] + (b[0] - a[0]) * fraction
                rect = (max(0, min(WIDTH - width, cx - width / 2)), a[1] - height / 2, width, height)
                own = set(route["grid"])
                intersects_line = any(rect[0] <= gx <= rect[0] + rect[2] and
                                      rect[1] <= gy <= rect[1] + rect[3] and
                                      count > (1 if (gx, gy) in own else 0)
                                      for (gx, gy), count in used.items())
                collisions = (sum(_overlap(rect, r) for r in labels)
                              + sum(_overlap(rect, n) for n in nodes.values())
                              + int(intersects_line)
                              + int(width > abs(a[0] - b[0])))
                candidates.append((collisions, -abs(a[0] - b[0]), rect))
        if not candidates:
            point = pts[len(pts) // 2]
            rect = (max(0, min(WIDTH - width, point[0] - width / 2)),
                    max(0, min(HEIGHT - height, point[1] - height / 2)), width, height)
            candidates.append((1 + sum(_overlap(rect, r) for r in labels) +
                               sum(_overlap(rect, n) for n in nodes.values()), 0, rect))
        conflicts, _, rect = min(candidates)
        label_conflicts += conflicts
        labels.append(rect)
        route["label"] = (text, rect)
    return {"boxes": boxes, "nodes": nodes, "routes": routes, "crossings": route_conflicts,
            "labels": label_conflicts, "fallback": fallback, "variant": variant}


def layout_map(apps, flows):
    by_id = {a["id"]: a for a in apps}
    valid = [f for f in flows if f.get("from") in by_id and f.get("to") in by_id]
    invalid = len(flows) - len(valid)
    if not apps:
        return {"boxes": {}, "nodes": {}, "routes": [], "crossings": 0, "labels": 0,
                "fallback": 0, "missing": invalid, "dense": False}
    variants = range(3 if len(valid) <= 35 and len(apps) <= 50 else 1)
    results = [_evaluate(apps, valid, v) for v in variants]
    result = min(results, key=lambda r: (r["fallback"], r["labels"], r["crossings"]))
    result["missing"] = invalid
    result["dense"] = (len(valid) > 20 or len(apps) > 25
                       or any(w < 8 or h < 1.8 for _, _, w, h in result["nodes"].values()))
    return result


def to_inches(point):
    return (REGION[0] + point[0] * REGION[2] / WIDTH,
            REGION[1] + point[1] * REGION[3] / HEIGHT)


def rect_inches(rect):
    x, y = to_inches(rect[:2])
    return x, y, rect[2] * REGION[2] / WIDTH, rect[3] * REGION[3] / HEIGHT
