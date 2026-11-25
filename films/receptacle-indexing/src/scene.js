/* Each shot is drawn at an absolute time in seconds. Geometry uses the tabletop's local plan.
   Replace SCENE with a scene export to reproduce measured footprints and lookups. */
const DURATION = 176;
const WIDTH = 1600,
  HEIGHT = 900;
const canvas = document.querySelector('canvas');
const g = canvas.getContext('2d', {
  alpha: false
});
const room = document.getElementById('room');
const P = {
  paper: '#f8f6ef',
  ink: '#222d29',
  muted: '#626e65',
  fine: '#a6aea3',
  pale: '#d9d9cc',
  copper: '#ad4e28',
  teal: '#16756f',
  emerald: '#285c4c',
  white: '#fffdf6',
  cream: '#f0ebdf'
};
const SCENE = {
  photoTargets: {
    empty: [.243, .622],
    occupied: [.542, .457]
  },
  // Table units are diagram units. This arrangement illustrates the photographed pair.
  surface: {
    w: 780,
    h: 316
  },
  objects: {
    A: {
      x: 276,
      y: 114, // front edge, before conversion to footprint centre below
      r: 37
    },
    B: {
      x: 474,
      y: 132,
      r: 42
    }
  }
};
const plan = {
  x: 148,
  y: 325,
  w: SCENE.surface.w,
  h: SCENE.surface.h
};
const curve = (a, b, t) => {
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const windowAt = (a, b, c, d, t) => curve(a, b, t) * (1 - curve(c, d, t));

function atOpacity(a, fn) {
  if (a <= .001) return;
  g.save();
  g.globalAlpha *= Math.min(1, a);
  fn();
  g.restore();
}

function text(s, x, y, size, opt = {}) {
  g.save();
  g.fillStyle = opt.color || P.ink;
  g.textAlign = opt.align || 'left';
  g.textBaseline = 'alphabetic';
  g.font = (opt.italic ? 'italic ' : '') + (opt.bold ? '600 ' : '') + size + 'px ' + (opt.family || 'FilmSans');
  if (opt.track && 'letterSpacing' in g) g.letterSpacing = opt.track + 'px';
  g.fillText(s, x, y);
  g.restore();
}

function small(s, x, y, opt = {}) {
  text(s, x, y, opt.size || 16, {
    family: 'FilmMono',
    color: P.muted,
    track: 1.0,
    ...opt
  });
}

function line(a, b, color = P.ink, w = 1, dash = []) {
  stroke([a, b], 1, color, w, dash);
}

function stroke(points, f = 1, color = P.ink, w = 1.5, dash = []) {
  if (f <= 0 || points.length < 2) return;
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.lineWidth = w;
  g.strokeStyle = color;
  g.setLineDash(dash);
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let left = lengths.reduce((a, b) => a + b, 0) * Math.min(1, f);
  g.beginPath();
  g.moveTo(...points[0]);
  for (let i = 0; i < lengths.length && left > 0; i++) {
    const p = points[i],
      q = points[i + 1],
      k = Math.min(1, left / (lengths[i] || 1));
    g.lineTo(p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k);
    left -= lengths[i];
  }
  g.stroke();
  g.restore();
}

function circle(x, y, r, color, w = 1, fill = null) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (w) {
    g.strokeStyle = color;
    g.lineWidth = w;
    g.stroke();
  }
}

function rectPts(x, y, w, h) {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
    [x, y]
  ];
}

function fillPoly(points, c) {
  g.beginPath();
  points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
  g.closePath();
  g.fillStyle = c;
  g.fill();
}

function cross(x, y, c = P.fine, n = 5) {
  line([x - n, y], [x + n, y], c, 1);
  line([x, y - n], [x, y + n], c, 1);
}

function hatches(x, y, w, h, c, spacing = 11) {
  if (w <= 0 || h <= 0) return;
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.strokeStyle = c;
  g.lineWidth = 1;
  g.beginPath();
  for (let i = -h; i < w + h; i += spacing) {
    g.moveTo(x + i, y + h);
    g.lineTo(x + i + h, y);
  }
  g.stroke();
  g.restore();
}
const serif = 'FilmSerif',
  mono = 'FilmMono';

function mast() {
  text('ManiTaskGen', 73, 55, 32, {
    family: serif
  });
  line([265, 34], [265, 55], P.fine);
  small('SCENE GRAPH', 287, 52, {
    size: 15
  });
  line([73, 80], [1527, 80], P.pale);
}

function photoTag(cx, cy, dx, dy, label, a) {
  atOpacity(a, () => {
    const k = Math.min(1, a * 1.8),
      x = cx + dx,
      y = cy + dy;
    stroke([
      [cx, cy],
      [cx + dx * .48, cy + dy],
      [x, y]
    ], k, '#38473d', 2);
    circle(cx, cy, 5.0, '#fffdf5', 1.7, P.copper);
    circle(cx, cy, 10, '#fffdf5', 1);
    g.save();
    g.font = '17px FilmSans';
    const tw = g.measureText(label).width;
    g.fillStyle = P.paper;
    g.fillRect(x - 6, y - 24, tw + 16, 28);
    g.restore();
    text(label, x + 2, y - 4, 17, {
      color: P.ink
    });
  });
}

function unionBoundary(a, b) {
  // Grid cells in the union contribute only exterior edges; shared interiors cancel.
  const xs = [...new Set([a.x, a.x + a.w, b.x, b.x + b.w])].sort((x, y) => x - y);
  const ys = [...new Set([a.y, a.y + a.h, b.y, b.y + b.h])].sort((x, y) => x - y);
  const edges = new Map(),
    key = p => p.join(','),
    inside = (r, x, y) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;

  function edge(p, q) {
    const rev = key(q) + '|' + key(p),
      id = key(p) + '|' + key(q);
    if (edges.has(rev)) edges.delete(rev);
    else edges.set(id, [p, q]);
  }
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < ys.length - 1; j++) {
      let [x, y] = [(xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2];
      if (!inside(a, x, y) && !inside(b, x, y)) continue;
      let corners = rectPts(xs[i], ys[j], xs[i + 1] - xs[i], ys[j + 1] - ys[j]);
      for (let k = 0; k < 4; k++) edge(corners[k], corners[k + 1]);
    }
  const next = new Map([...edges.values()].map(([p, q]) => [key(p), q]));
  const first = [...edges.values()][0][0],
    out = [first];
  while (next.has(key(out.at(-1)))) {
    const k = key(out.at(-1));
    out.push(next.get(k));
    next.delete(k);
    if (key(out.at(-1)) === key(first)) break;
  }
  return out;
}

function arrow(x1, y1, x2, y2, c) {
  const d = Math.atan2(y2 - y1, x2 - x1);
  line([x1, y1], [x2, y2], c, 2);
  stroke([
    [x2 - 10 * Math.cos(d - .48), y2 - 10 * Math.sin(d - .48)],
    [x2, y2],
    [x2 - 10 * Math.cos(d + .48), y2 - 10 * Math.sin(d + .48)]
  ], 1, c, 2);
}

const timber = document.getElementById('timber');
const TABLE = {
  length: 1.98,
  depth: .95,
  top: .665,
  slab: .052
};
const radians = degrees => degrees * Math.PI / 180;

function xyz(v, x, y, z) {
  return [v.ox + v.sc * (v.cs * x + v.sn * y), v.oy + v.sc * (v.sn * v.se * x - v.cs * v.se * y - v.ce * (z - v.aimZ))];
}
const projectPoints = (v, points) => points.map(p => xyz(v, ...p));

function depthAt(v, x, y, z) {
  return v.sn * v.ce * x - v.cs * v.ce * y + v.se * z;
}

function face3(v, points, fill, edge, width = .85) {
  const p = projectPoints(v, points);
  fillPoly(p, fill);
  if (edge) stroke([...p, p[0]], 1, edge, width);
}

function path3(v, pts, col, width = 1, f = 1, dash = []) {
  stroke(projectPoints(v, pts), f, col, width, dash);
}

function polygonPath(points) {
  g.beginPath();
  points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
  g.closePath();
}

function planeAt(v, x, y, z, ux, uy, uz, vx, vy, vz, callback) {
  const p = xyz(v, x, y, z),
    px = xyz(v, x + ux, y + uy, z + uz),
    py = xyz(v, x + vx, y + vy, z + vz);
  g.save();
  g.transform(px[0] - p[0], px[1] - p[1], py[0] - p[0], py[1] - p[1], p[0], p[1]);
  callback();
  g.restore();
}

function planeShadow(v, x, y, z, rx, ry, strength) {
  planeAt(v, x, y, z, rx, 0, 0, 0, ry, 0, () => {
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    grad.addColorStop(0, 'rgba(72,65,49,' + strength + ')');
    grad.addColorStop(.46, 'rgba(77,69,50,' + strength * .58 + ')');
    grad.addColorStop(1, 'rgba(77,69,50,0)');
    g.fillStyle = grad;
    g.fillRect(-1, -1, 2, 2);
  });
}

function boxPart(v, x, y, z, w, d, h, style) {
  const a = x - w / 2,
    b = x + w / 2,
    c = y - d / 2,
    e = y + d / 2,
    k = z + h;
  const edge = style.ink || '#666657',
    ew = style.weight || .85;
  if (v.sn >= 0) face3(v, [
    [b, c, z],
    [b, e, z],
    [b, e, k],
    [b, c, k]
  ], style.end, edge, ew);
  else face3(v, [
    [a, e, z],
    [a, c, z],
    [a, c, k],
    [a, e, k]
  ], style.end, edge, ew);
  face3(v, [
    [a, c, z],
    [b, c, z],
    [b, c, k],
    [a, c, k]
  ], style.front, edge, ew);
  face3(v, [
    [a, c, k],
    [b, c, k],
    [b, e, k],
    [a, e, k]
  ], style.top, edge, ew);
}

function roundedLoop(x, y, w, d, r, z) {
  const a = w / 2 - r,
    b = d / 2 - r,
    centres = [
      [a, b, 0],
      [-a, b, 90],
      [-a, -b, 180],
      [a, -b, 270]
    ],
    out = [];
  for (const [cx, cy, base] of centres)
    for (let i = 0; i <= 6; i++) {
      const ang = radians(base + i * 15);
      out.push([x + cx + r * Math.cos(ang), y + cy + r * Math.sin(ang), z]);
    }
  return out;
}

function mixColor(a, b, f) {
  return 'rgb(' + a.map((k, i) => Math.round(k + (b[i] - k) * f)).join(',') + ')';
}

function slab(v, x, y, z, w, d, h, r, wood, shelf = false) {
  const lower = roundedLoop(x, y, w - .003, d - .003, r, z),
    side = roundedLoop(x, y, w, d, r, z + .003);
  const lip = roundedLoop(x, y, w, d, r, z + h - .006),
    top = roundedLoop(x, y, w - .009, d - .009, r, z + h);
  const pale = [206, 210, 201],
    dark = [166, 175, 162],
    oak = [215, 189, 153],
    end = [179, 158, 129];
  const rim = [];
  for (let i = 0; i < side.length; i++) {
    const j = (i + 1) % side.length,
      dx = side[j][0] - side[i][0],
      dy = side[j][1] - side[i][1],
      len = Math.hypot(dx, dy);
    if (!len || v.sn * dy + v.cs * dx <= 0) continue;
    const endFactor = Math.abs(dy) / len,
      base = wood ? mixColor(oak, end, .85 * endFactor) : mixColor(pale, dark, .7 * endFactor);
    face3(v, [lower[i], lower[j], lip[j], lip[i]], base);
    face3(v, [lip[i], lip[j], top[j], top[i]], wood ? '#e4ceb0' : '#f5f5ec');
    rim.push([lower[i], lower[j]]);
    path3(v, [lip[i], lip[j]], wood ? '#bba486' : '#b6b9ac', .75);
  }
  face3(v, top, wood ? (shelf ? '#d6c0a0' : '#ebddc6') : '#f4f3e9');
  if (wood) {
    g.save();
    polygonPath(projectPoints(v, top));
    g.clip();
    planeAt(v, x - w / 2, y + d / 2, z + h, w, 0, 0, 0, -d, 0, () => {
      g.save();
      g.globalAlpha *= shelf ? .38 : .86;
      g.drawImage(timber, 0, 0, 1, 1);
      g.restore();
    });
    g.restore();
  }
  if (shelf) {
    g.save();
    polygonPath(projectPoints(v, top));
    g.clip();
    planeAt(v, x - w / 2, y + d / 2, z + h, w, 0, 0, 0, -d, 0, () => {
      const wash = g.createLinearGradient(0, 0, 0, 1);
      wash.addColorStop(0, 'rgba(73,66,50,.25)');
      wash.addColorStop(.60, 'rgba(89,77,55,.15)');
      wash.addColorStop(1, 'rgba(118,101,73,.05)');
      g.fillStyle = wash;
      g.fillRect(0, 0, 1, 1);
    });
    g.restore();
  }
  path3(v, [...top, top[0]], wood ? '#645e4c' : '#62675a', 1.5);
  for (const seg of rim) path3(v, seg, wood ? '#786b55' : '#7b8172', 1.15);
}
const WOOD = {
    top: '#dfcfb4',
    front: '#d6c3a2',
    end: '#bba786',
    ink: '#77715c'
  },
  STEEL = {
    top: '#e1e3d7',
    front: '#c4cdc1',
    end: '#a4afa4',
    ink: '#69766a',
    weight: .83
  };

function tableFrame(v, wood) {
  const L = TABLE.length,
    D = TABLE.depth,
    z = TABLE.top;
  planeShadow(v, -.03, .045, .002, 1.39, .74, .22);
  planeShadow(v, -.09, .03, .002, 1.09, .54, .19);
  const parts = [];

  function part(x, y, h, fn) {
    parts.push([depthAt(v, x, y, h), fn]);
  }
  for (const x of [-.855, .855])
    for (const y of [-.351, .351]) {
      planeShadow(v, x, y, .003, .106, .087, .4);
      const w = wood ? .071 : .034,
        dy = wood ? .072 : .037;
      part(x, y, .32, () => {
        boxPart(v, x, y, .016, w, dy, z - .054, wood ? WOOD : STEEL);
        if (wood) {
          path3(v, [
            [x + .017, y - dy / 2 - .001, .062],
            [x + .017, y - dy / 2 - .001, .605]
          ], '#b4a382', .65);
          boxPart(v, x, y, .008, w * .84, dy * .84, .009, {
            top: '#b1ac99',
            end: '#817e6c',
            front: '#8d8976',
            ink: '#777766',
            weight: .6
          });
        }
      });
    }
  if (wood) {
    for (const yy of [-.35, .35]) part(0, yy, .56, () => boxPart(v, 0, yy, .535, 1.71, .043, .079, WOOD));
    for (const xx of [-.854, .854]) part(xx, 0, .54, () => boxPart(v, xx, 0, .523, .049, .69, .09, WOOD));
    part(0, .02, .17, () => slab(v, 0, .035, .125, 1.75, .59, .037, .013, true, true));
    // Short vertical end slats leave the open lower shelf legible.
    for (const xx of [-.857, .857])
      for (const yy of [-.17, .17])
        part(xx, yy, .36, () => boxPart(v, xx, yy, .168, .028, .075, .362, WOOD));
  } else {
    for (const xx of [-.855, .855]) part(xx, 0, .035, () => boxPart(v, xx, 0, .018, .035, .742, .031, STEEL));
    part(0, 0, .17, () => slab(v, 0, 0, .143, 1.72, .67, .024, .045, false, true));
    for (const yy of [-.348, .348]) part(0, yy, .57, () => boxPart(v, 0, yy, .572, 1.72, .029, .038, STEEL));
  }
  parts.sort((a, b) => a[0] - b[0]);
  for (const [, paint] of parts) paint();
  slab(v, 0, 0, z - TABLE.slab, L, D, TABLE.slab, wood ? .048 : .064, wood);
  // A short end-grain pencil line and inset fixings give the rim a physical scale.
  if (wood)
    for (const xx of [-.855, .855]) {
      const [sx, sy] = xyz(v, xx, -.378, .576);
      circle(sx, sy, 1.6, '#93866c', .55, '#b5a486');
    }
}

function tabletop(v, fn, raise = .002) {
  planeAt(v, -TABLE.length / 2, TABLE.depth / 2, TABLE.top + raise, TABLE.length / plan.w, 0, 0, 0, -TABLE.depth / plan.h, 0, fn);
}

function worldOnTable(x, y) {
  return [(x / plan.w - .5) * TABLE.length, (.5 - y / plan.h) * TABLE.depth];
}

function tp(v, x, y, height = 0) {
  const w = worldOnTable(x, y);
  return xyz(v, w[0], w[1], TABLE.top + height);
}
/* Point-surfaces are sampled once. Their coordinates stay fixed while the view moves. */
function sampleRoom() {
  let seed = 41721;

  function rand() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const dots = [];
  // Material groups: wall, timber, charcoal metal, pale ceramic, muted upholstery.
  function dot(x, y, z, mat, edge = 0) {
    dots.push([x, y, z, mat, Math.floor((.52 + rand() * .48 + edge * .17) * 6), rand() > .88 ? 1 : 0]);
  }

  function pane(p, u, v, amount, mat) {
    for (let i = 0; i < amount; i++) {
      const a = rand(),
        b = rand();
      dot(p[0] + a * u[0] + b * v[0], p[1] + a * u[1] + b * v[1], p[2] + a * u[2] + b * v[2], mat);
    }
  }

  function edge(p, q, mat, rate = 55) {
    const n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) * rate);
    for (let i = 0; i < n; i++) {
      const f = (i + rand() * .8) / n;
      dot(p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, p[2] + (q[2] - p[2]) * f, mat, 1);
    }
  }

  function box(x, y, z, w, d, h, m, den = 520) {
    const a = x - w / 2,
      b = x + w / 2,
      c = y - d / 2,
      e = y + d / 2,
      k = z + h;
    pane([a, c, k], [w, 0, 0], [0, d, 0], Math.ceil(den * w * d), m);
    pane([a, c, z], [w, 0, 0], [0, 0, h], Math.ceil(den * w * h), m);
    pane([a, c, z], [0, d, 0], [0, 0, h], Math.ceil(den * d * h * .75), m);
    pane([b, c, z], [0, d, 0], [0, 0, h], Math.ceil(den * d * h * .75), m);
    for (const [p, q] of [
        [
          [a, c, k],
          [b, c, k]
        ],
        [
          [a, e, k],
          [b, e, k]
        ],
        [
          [a, c, k],
          [a, e, k]
        ],
        [
          [b, c, k],
          [b, e, k]
        ],
        [
          [a, c, z],
          [a, c, k]
        ],
        [
          [b, c, z],
          [b, c, k]
        ]
      ]) edge(p, q, m);
  }

  function coffee(x, y, w, d, h, m) {
    box(x, y, h - .042, w, d, .042, m);
    for (const xx of [-1, 1])
      for (const yy of [-1, 1]) box(x + xx * (w * .46), y + yy * (d * .41), 0, .045, .047, h - .042, m, 340);
  }

  function shelf(x, y, w, d, h) {
    for (const xx of [-1, 1]) box(x + xx * w / 2, y, 0, .028, d, h, 0);
    for (let i = 0; i < 5; i++) box(x, y, .035 + i * (h - .07) / 4, w, d, .022, 0, 660);
    for (let row = 0; row < 3; row++) {
      const z = .06 + row * (h - .07) / 4;
      for (let j = 0; j < 3 + (row % 2); j++) box(x - w * .32 + j * .048, y - .023 + rand() * .035, z, .034 + rand() * .014, d * .53, .115 + rand() * .085, j % 2 ? 2 : 1, 950);
    }
  }

  function vessel(x, y, z, r, h, m) {
    for (let i = 0; i < 165; i++) {
      const t = rand() * Math.PI * 2,
        f = rand();
      dot(x + Math.cos(t) * r * (.76 + .24 * f), y + Math.sin(t) * r * (.76 + .24 * f), z + h * f, m);
    }
    for (let j = 0; j < 60; j++) {
      let t = 2 * Math.PI * j / 60;
      dot(x + Math.cos(t) * r, y + Math.sin(t) * r, z + h, m, 1);
    }
  }
  // Back kitchen run, recessed doors and dishes, as seen behind the tables in the wide shot.
  box(.16, 1.64, 0, 2.18, .41, .67, 0, 520);
  box(.16, 1.63, .68, 2.28, .47, .043, 2, 1350);
  for (let j = 0; j < 5; j++) {
    const xx = -.71 + j * .425;
    box(xx, 1.422, .065, .397, .011, .55, j % 3 === 0 ? 1 : 0, 380);
    edge([xx + .10, 1.402, .54], [xx + .16, 1.402, .54], 2, 270);
  }
  for (const [x, r, h, m] of [
      [-.69, .052, .065, 3],
      [-.48, .039, .115, 4],
      [.41, .057, .105, 1],
      [.68, .051, .094, 3],
      [.82, .045, .125, 1]
    ]) vessel(x, 1.55, .724, r, h, m);
  shelf(-1.29, 1.24, .50, .37, 1.35);
  shelf(1.33, .88, .46, .34, 1.07);
  shelf(-1.34, -.16, .45, .30, .99);
  // Bench parallel to the working table, a separate dark table, and low seating to the left.
  coffee(.08, .93, 1.77, .36, .365, 1);
  coffee(1.63, .17, .82, .51, .62, 2);
  box(-1.89, -.44, 0, .68, 1.04, .23, 4, 540);
  box(-2.10, -.44, .21, .16, 1.08, .41, 4, 670);
  for (let i = 0; i < 2; i++) box(-1.79, -.7 + i * .50, .225, .47, .465, .09, 4, 650);
  box(-1.89, -1, .22, .69, .108, .25, 4);
  box(-1.89, .11, .22, .69, .11, .25, 4);
  coffee(-1.26, -1.18, 1.02, .46, .39, 0);
  // Broad, sparse room boundaries and long floorboards give the return cloud a scale.
  pane([-2.43, 1.97, 0], [4.95, 0, 0], [0, 0, 1.63], 1600, 0);
  pane([-2.42, -.95, 0], [0, 2.91, 0], [0, 0, 1.58], 620, 0);
  for (let i = 0; i < 2200; i++) {
    const x = -2.55 + rand() * 5.2,
      y = -1.75 + rand() * 3.68;
    if (Math.abs(x) > 1.02 || Math.abs(y) > .51) dot(x, y, 0, 1);
  }
  for (let j = -8; j <= 8; j++) {
    const yy = j * .231;
    for (let i = 0; i < 78; i++) {
      const xx = -2.65 + rand() * 5.3;
      if (Math.abs(xx) > 1.06 || Math.abs(yy) > .57) dot(xx, yy + (rand() - .5) * .006, .002, 1);
    }
  }
  return dots;
}
const roomSamples = sampleRoom();
const pointColors = ['75,86,78', '116,91,66', '45,57,49', '110,118,99', '76,89,78'];

function drawCloud(v, t) {
  const fade = curve(9.5, 13.5, t) * (1 - curve(105.7, 108.2, t));
  const groups = Array.from({
    length: pointColors.length * 6
  }, () => []);
  const cx = v.ox,
    cy = v.oy,
    scale = v.sc,
    base = cy + scale * v.ce * v.aimZ;
  for (const pt of roomSamples) {
    const [x, y, z, mat, density, big] = pt;
    const sx = cx + scale * (v.cs * x + v.sn * y),
      sy = base + scale * (v.sn * v.se * x - v.cs * v.se * y - v.ce * z);
    if (sx < 47 || sx > 1134 || sy < 204 || sy > 705) continue;
    const feather = Math.min(1, (sx - 47) / 85, (1134 - sx) / 87, (sy - 204) / 55, (705 - sy) / 42);
    // Leave a pale field immediately over the active tabletop.
    const centre = Math.max(0, 1 - (((sx - 565) / 560) ** 2 + ((sy - 490) / 355) ** 2));
    const level = Math.min(5, Math.floor(feather * (.9 - .17 * centre) * density));
    if (level > 0) groups[mat * 6 + level].push(sx, sy, big ? 2.19 : 1.62);
  }
  g.save();
  g.globalAlpha *= fade;
  for (let j = 0; j < groups.length; j++) {
    const a = groups[j];
    if (!a.length) continue;
    g.fillStyle = 'rgba(' + pointColors[Math.floor(j / 6)] + ',' + (.18 + (j % 6) * .135) + ')';
    g.beginPath();
    for (let k = 0; k < a.length; k += 3) g.rect(a[k], a[k + 1], a[k + 2], a[k + 2]);
    g.fill();
  }
  g.restore();
}

/* Editable chapter text. Times are seconds from the first room frame. */
const SHOTS = {
  emptyIn: [8, 15],
  emptyOut: [32, 39],
  occupiedIn: [42, 49],
  occupiedOut: [113, 120],
  line: [56.5, 61],
  hull: [63, 69],
  fanA: [71, 85.5],
  fanB: [85.5, 101],
  merge: [101, 113],
  tasks: [122, 174],
  picks: [
    [130, 141],
    [141, 152],
    [152, 173]
  ]
};
const FILM_COPY = {
  empty: ['Index an empty surface.', 'Use the surface itself to index its nine receptacles.'],
  occupied: ['Index an occupied surface.', 'Use the objects on the surface as anchors to index receptacles.'],
  a: ['Extend eight regions from A.', 'Grow a region from each side and corner of the anchor footprint.'],
  b: ['Extend eight regions from B.', 'Use the same table heading to index a second set of eight regions.'],
  merge: ['Merge two indexed regions.', 'An overlapping part connects the two regions on the same table.'],
  tasks: ['Generate placement tasks.', 'Match an available object to a region that contains its entire footprint.']
};
const lerp = (a, b, u) => a + (b - a) * u;
const pxPerM = plan.w / TABLE.length,
  pyPerM = plan.h / TABLE.depth;
const A = SCENE.objects.A,
  B = SCENE.objects.B;
for (const o of [A, B]) o.y += o.r / pxPerM * pyPerM;
const lampHeight = id => id === 'A' ? .208 : .173;
const radiusFor = obj => obj.r / pxPerM;
// The cylindrical shade is the widest part of each lamp when projected onto the tabletop.
function lampHull(o) {
  const r = radiusFor(o);
  return Array.from({
    length: 48
  }, (_, i) => {
    const a = i * Math.PI / 24;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
}
const hullA = lampHull(A),
  hullB = lampHull(B);

function hullBox(o, h) {
  const xs = h.map(p => o.x + p[0] * pxPerM),
    ys = h.map(p => o.y - p[1] * pyPerM);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys)
  };
}
const ab = hullBox(A, hullA),
  bb = hullBox(B, hullB);
const DIRECTIONS = [
  ['front', 0, -1],
  ['front-right', 1, -1],
  ['right', 1, 0],
  ['rear-right', 1, 1],
  ['rear', 0, 1],
  ['rear-left', -1, 1],
  ['left', -1, 0],
  ['front-left', -1, -1]
];
const intersection = (a, b) => {
  const x = Math.max(a.x, b.x),
    y = Math.max(a.y, b.y);
  return {
    x,
    y,
    w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x),
    h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y)
  };
};
const area = r => r.w * r.h;

function directionalRegions(box, neighbour) {
  return DIRECTIONS.map(([name, dx, dy]) => {
    const xrange = dx < 0 ? [0, box.x] : dx > 0 ? [box.x + box.w, plan.w] : [box.x, box.x + box.w];
    const yrange = dy < 0 ? [0, box.y] : dy > 0 ? [box.y + box.h, plan.h] : [box.y, box.y + box.h];
    let r = {
      x: xrange[0],
      y: yrange[0],
      w: xrange[1] - xrange[0],
      h: yrange[1] - yrange[0]
    };
    if (dx === -1 && dy === -1 && area(intersection(r, neighbour)) > 1e-6) {
      // A sits forward of B. End the leftward sweep at the front tangent
      // of A's round shade; keep this rectangle entirely ahead of its hull.
      const stopX = neighbour.x + neighbour.w / 2;
      r = {x: stopX, y: 0, w: box.x - stopX, h: neighbour.y};
    } else if (area(intersection(r, neighbour)) > 1e-6) {
      const cuts = [];
      if (dx > 0) cuts.push({
        ...r,
        w: Math.max(0, neighbour.x - r.x)
      });
      if (dx < 0) {
        const x = neighbour.x + neighbour.w;
        cuts.push({
          ...r,
          x,
          w: Math.max(0, r.x + r.w - x)
        });
      }
      if (dy > 0) cuts.push({
        ...r,
        h: Math.max(0, neighbour.y - r.y)
      });
      if (dy < 0) {
        const y = neighbour.y + neighbour.h;
        cuts.push({
          ...r,
          y,
          h: Math.max(0, r.y + r.h - y)
        });
      }
      r = cuts.sort((a, b) => area(b) - area(a))[0];
    }
    return {
      ...r,
      dx,
      dy,
      name
    };
  });
}
const regionsA = directionalRegions(ab, bb),
  regionsB = directionalRegions(bb, ab);
const ra = regionsA[1],
  rb = regionsB[7],
  single = regionsA[4],
  union = unionBoundary(ra, rb);
const whiteCells = Array.from({
  length: 9
}, (_, i) => ({
  x: (i % 3) * plan.w / 3,
  y: Math.floor(i / 3) * plan.h / 3,
  w: plan.w / 3,
  h: plan.h / 3
}));
const centerCell = whiteCells[4];
const OBJECTS = [{
  id: 'tin',
  name: 'Tea tin',
  label: 'tea tin',
  w: 16,
  d: 12,
  h: .15
}, {
  id: 'book',
  name: 'Field notebook',
  label: 'field notebook',
  w: 16,
  d: 22,
  h: .031
}, {
  id: 'board',
  name: 'Serving board',
  label: 'serving board',
  w: 126,
  d: 20,
  h: .027
}];

function boundsOf(rs) {
  const x = Math.min(...rs.map(r => r.x)),
    y = Math.min(...rs.map(r => r.y));
  return {
    x,
    y,
    w: Math.max(...rs.map(r => r.x + r.w)) - x,
    h: Math.max(...rs.map(r => r.y + r.h)) - y
  };
}

function containsFootprint(rect, regions) {
  const clips = regions.map(r => intersection(rect, r));
  const covered = clips.reduce((n, r) => n + area(r), 0) - (clips.length === 2 ? area(intersection(clips[0], clips[1])) : 0);
  return Math.abs(covered - area(rect)) < 1e-5;
}

function tryPlacement(obj, regions, obstacles = [], alignX = null) {
  const work = boundsOf(regions),
    w = obj.w / 100 * pxPerM,
    h = obj.d / 100 * pyPerM;
  const xs = [work.x + (work.w - w) / 2],
    ys = [work.y + (work.h - h) / 2];
  if (alignX !== null) xs.unshift(alignX - w / 2);
  for (const r of regions) {
    xs.push(r.x, r.x + r.w - w);
    ys.push(r.y, r.y + r.h - h);
  }
  for (const cy of ys)
    for (const cx of xs) {
      const rect = {
        x: cx,
        y: cy,
        w,
        h
      };
      if (containsFootprint(rect, regions) && obstacles.every(o => area(intersection(rect, o)) < 1e-6)) return rect;
    }
  return null;
}
const destinations = [
  [centerCell],
  [single],
  [ra, rb]
];
const placements = OBJECTS.map((obj, i) => tryPlacement(obj, destinations[i], i === 0 ? [] : [ab, bb], i === 2 ? A.x : null));
const destinationsText = ['White table · center', 'A · rear', 'A · front-right + B · front-left'];
const taskSentence = (i) => 'Place the ' + OBJECTS[i].label + ' ' + ['in the center of the white table.', 'in the rear region of A.', 'in front of lamp A.'][i];

function deskLamp(v, obj, id, material = true) {
  const [x, y] = worldOnTable(obj.x, obj.y), [cx, baseY] = xyz(v, x, y, TABLE.top);
  const r = radiusFor(obj) * v.sc,
    h = lampHeight(id) * v.sc * v.ce;
  const cy = z => baseY - z * h,
    ry = f => r * f * v.se;
  const ink = material ? '#5d6970' : '#667369';

  function gradient(stops) {
    const paint = g.createLinearGradient(cx - r, 0, cx + r, 0);
    stops.forEach(([offset, color]) => paint.addColorStop(offset, color));
    return paint;
  }

  function ring(z, f, fill, edge = null, width = .9) {
    g.beginPath();
    g.ellipse(cx, cy(z), r * f, ry(f), 0, 0, 2 * Math.PI);
    g.fillStyle = fill;
    g.fill();
    if (edge) {
      g.strokeStyle = edge;
      g.lineWidth = width;
      g.stroke();
    }
  }

  function shell(z0, f0, z1, f1, fill, edge) {
    // Follow the visible half of each rim so the wall meets the upper face exactly.
    g.beginPath();
    g.moveTo(cx - r * f0, cy(z0));
    g.ellipse(cx, cy(z0), r * f0, ry(f0), 0, Math.PI, 0, true);
    g.lineTo(cx + r * f1, cy(z1));
    g.ellipse(cx, cy(z1), r * f1, ry(f1), 0, 0, Math.PI, false);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
    g.strokeStyle = edge;
    g.lineWidth = .9;
    g.stroke();
  }
  const slate = material ? gradient([
    [0, '#677b8a'],
    [.22, '#9fb2c4'],
    [.47, '#b7c7d3'],
    [.77, '#91a3b3'],
    [1, '#657884']
  ]) : '#edf0e6';
  const shade = material ? gradient([
    [0, '#ada9aa'],
    [.09, '#d7cecf'],
    [.26, '#f0e7e5'],
    [.49, '#fbf2ec'],
    [.75, '#e6dfda'],
    [1, '#b7b2b0']
  ]) : '#fcfbef';
  ring(.012, .73, material ? '#52636e' : '#a9b3a8', ink);
  shell(.018, .75, .26, .76, slate, ink);
  ring(.26, .76, material ? '#becbd2' : '#e0e5d8', ink);
  shell(.26, .43, .39, .43, material ? '#87969c' : '#e1e5da', ink);
  shell(.36, .90, 1, 1, shade, material ? '#989294' : ink);
  ring(1, 1, material ? '#fcf5ed' : '#fffdf3', ink, 1.1);
  const bore = g.createLinearGradient(0, cy(1) - ry(.87), 0, cy(1) + ry(.87));
  bore.addColorStop(0, material ? '#666977' : '#b8c0b7');
  bore.addColorStop(.52, material ? '#a5a2aa' : '#e6e8dc');
  bore.addColorStop(1, material ? '#d9cfd0' : '#f3f3e5');
  ring(1, .87, bore, material ? '#a49c9f' : '#8d998d', .7);
  // The recessed bulb is visible through the open shade, clipped at its near lip.
  g.save();
  g.beginPath();
  g.ellipse(cx, cy(1), r * .865, ry(.865), 0, 0, 2 * Math.PI);
  g.clip();
  const bulbY = cy(.86),
    br = .31 * r;
  const glow = g.createRadialGradient(cx - .28 * br, bulbY - .36 * br, .06 * br, cx, bulbY, br);
  glow.addColorStop(0, '#fffef4');
  glow.addColorStop(.57, material ? '#fff4d5' : '#faf9ed');
  glow.addColorStop(1, material ? '#d3be96' : '#c0c6b8');
  circle(cx, bulbY, br, material ? '#a49b8d' : ink, .8, glow);
  g.restore();
}

function lampShadow(v, obj) {
  const [x, y] = worldOnTable(obj.x, obj.y);
  planeShadow(v, x + .030, y + .019, TABLE.top + .0005, .143, .123, .29);
  planeShadow(v, x + .005, y + .003, TABLE.top + .0008, .085, .074, .35);
}

function badgeAt(v, obj, id, opacity, accent) {
  const [x, y] = worldOnTable(obj.x, obj.y);
  const h = lampHeight(id);
  const p = xyz(v, x, y, TABLE.top + h + .003),
    side = id === 'A' ? -1 : 1;
  const a = [p[0] + side * 13, p[1] - 6],
    b = [p[0] + side * 39, p[1] - 32],
    c = [b[0] + side * 18, b[1]];
  atOpacity(opacity, () => {
    stroke([a, b, c], 1, accent, 1.1);
    circle(a[0], a[1], 2.0, accent, 0, accent);
    circle(c[0] + side * 11, c[1], 10.3, accent, 1.05, P.paper);
    text(id, c[0] + side * 11, c[1] + 4.9, 14, {
      family: mono,
      align: 'center',
      color: accent
    });
  });
}

function miniGlyph(v, type, x, y, color) {
  // Node glyphs inherit camera orientation; the labels and graph topology stay readable.
  const s = type === 'table' ? 23 : 32,
    cam = {
      ...v,
      sc: s,
      ox: x,
      oy: y,
      aimZ: 0
    };
  if (type === 'ground') {
    const foot = [
      [-.51, -.32, 0],
      [.51, -.32, 0],
      [.51, .32, 0],
      [-.51, .32, 0]
    ];
    face3(cam, foot, '#e4e7d9', color, .95);
    for (const k of [-.17, .17]) path3(cam, [
      [k, -.32, 0],
      [k, .32, 0]
    ], color, .55);
    path3(cam, [
      [-.51, 0, 0],
      [.51, 0, 0]
    ], color, .55);
  } else if (type === 'table') {
    for (const dx of [-.82, .82])
      for (const dy of [-.32, .32]) path3(cam, [
        [dx, dy, .02],
        [dx, dy, .47]
      ], color, 1.4);
    const z = .50,
      r = roundedLoop(0, 0, 1.92, .78, .05, z);
    face3(cam, r, '#e2dcc8', color, 1.1);
    path3(cam, [
      [-.92, -.39, .43],
      [.92, -.39, .43]
    ], color, .8);
  } else {
    const rx = 10,
      ry = rx * v.se,
      cy = y - 6;
    g.fillStyle = '#b2c0c6';
    g.strokeStyle = color;
    g.lineWidth = 1;
    g.beginPath();
    g.roundRect(x - 6, y + 3, 12, 7, 2);
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(x - rx, cy);
    g.lineTo(x - rx + 1, y + 3);
    g.quadraticCurveTo(x, y + 9, x + rx - 1, y + 3);
    g.lineTo(x + rx, cy);
    g.fillStyle = P.paper;
    g.fill();
    g.stroke();
    g.beginPath();
    g.ellipse(x, cy, rx, ry, 0, 0, 2 * Math.PI);
    g.fillStyle = '#dce1d6';
    g.fill();
    g.stroke();
    circle(x, cy + 1.2, 2.6, color, .7, '#fff9d9');
  }
}

function prism(v, o, id, accent, amount) {
  const hull = id === 'A' ? hullA : hullB,
    [wx, wy] = worldOnTable(o.x, o.y),
    height = lampHeight(id),
    base = TABLE.top + .001;
  const rim = hull.map(([x, y]) => [wx + x, wy + y, base + height * amount]);
  const bottom = hull.map(([x, y]) => [wx + x, wy + y, base]);
  for (let i = 0; i < hull.length; i++) {
    let j = (i + 1) % hull.length,
      dx = hull[j][0] - hull[i][0],
      dy = hull[j][1] - hull[i][1],
      len = Math.hypot(dx, dy);
    if (v.sn * dy + v.cs * dx <= 0) continue;
    const shade = (.5 + .5 * (dy * .58 - dx * .82) / len) * .85;
    face3(v, [bottom[i], bottom[j], rim[j], rim[i]], id === 'A' ? mixColor([207, 174, 146], [242, 221, 192], shade) : mixColor([146, 181, 166], [215, 233, 208], shade));
    if (i % 5 === 0 || len > .02) path3(v, [bottom[i], rim[i]], id === 'A' ? '#a8886c' : '#7a9e8c', .65);
    path3(v, [bottom[i], bottom[j]], accent, 1);
  }
  face3(v, rim, id === 'A' ? '#eed8bd' : '#d2e4d7', accent, 1.55);
}

function lampVisual(v, o, id, t) {
  const col = id === 'A' ? P.copper : P.teal;
  const a = curve(SHOTS.line[0], SHOTS.line[1], t),
    h = curve(SHOTS.hull[0], SHOTS.hull[1], t);
  const [x, y] = worldOnTable(o.x, o.y), base = xyz(v, x, y, TABLE.top), rad = radiusFor(o) * v.sc;
  if (a < 1) deskLamp(v, o, id, true);
  if (a > 0 && h < 1) {
    g.save();
    if (a < 1) {
      const left = base[0] - 1.8 * rad,
        cut = left + 3.6 * rad * a;
      g.beginPath();
      g.rect(left, base[1] - 4 * rad, cut - left, 6 * rad);
      g.clip();
    }
    atOpacity(1 - curve(.48, 1, h), () => deskLamp(v, o, id, false));
    g.restore();
    if (a < 1) {
      const px = base[0] + (a * 3.6 - 1.8) * rad;
      atOpacity(Math.sin(Math.PI * a) * .7, () => line([px, base[1] - 2.6 * rad], [px, base[1] + .75 * rad], P.teal, 1.35));
    }
  }
  if (h > 0) atOpacity(Math.min(h * 2.0, 1), () => prism(v, o, id, col, h));
}

function isolatedLamp(v, id, x, y, scale, t) {
  const o = id === 'A' ? A : B,
    [wx, wy] = worldOnTable(o.x, o.y);
  const cv = {
    ...v,
    ox: 0,
    oy: 0,
    sc: scale,
    aimZ: TABLE.top
  };
  const off = xyz(cv, wx, wy, TABLE.top);
  cv.ox = x - off[0];
  cv.oy = y - off[1];
  lampVisual(cv, o, id, t);
}

const roomQuads = {
  empty: [
    [171, 353],
    [251, 283],
    [291, 314],
    [209, 387]
  ],
  occupied: [
    [458, 259],
    [518, 194],
    [570, 223],
    [515, 292]
  ]
};
const camRails = [
  [8, -42, 39, 308],
  [17, -26, 37, 335],
  [32, -18, 38, 333],
  [42, -42, 39, 307],
  [53, -21, 30, 343],
  [63, 9, 32, 345],
  [72, 25, 34, 341],
  [85, 12, 38, 354],
  [101, -22, 40, 350],
  [113, -29, 38, 344],
  [120, -34, 36, 318]
];

function cameraAt(t) {
  let i = 0;
  while (i < camRails.length - 2 && t > camRails[i + 1][0]) i++;
  const a = camRails[i],
    b = camRails[i + 1],
    u = curve(a[0], b[0], t);
  const phi = radians(lerp(a[1], b[1], u)),
    el = radians(lerp(a[2], b[2], u)),
    sc = lerp(a[3], b[3], u) * .925;
  const se = Math.sin(el),
    ce = Math.cos(el),
    cs = Math.cos(phi),
    sn = Math.sin(phi);
  return {
    cs,
    sn,
    se,
    ce,
    sc,
    ox: 555,
    oy: Math.min(475, 711 - sc * (Math.abs(sn) * .89 * se + cs * .39 * se + .37 * ce)),
    aimZ: .37
  };
}

function roomMap(kind, u) {
  const quad = roomQuads[kind],
    cx = quad.reduce((n, p) => n + p[0], 0) / 4,
    cy = quad.reduce((n, p) => n + p[1], 0) / 4;
  const fr = [lerp(513, 60, u), lerp(145, 208, u), lerp(1014, 1062, u), lerp(570.3, 505, u)];
  const z = (1014 / 950) * lerp(1, 2.45, u),
    cx0 = 513 + cx * 1014 / 950,
    cy0 = 145 + cy * 1014 / 950;
  const gx = lerp(cx0, 555, u),
    gy = lerp(cy0, 416, u);
  return {
    fr,
    map: (x, y) => [gx + (x - cx) * z, gy + (y - cy) * z],
    z
  };
}

function teaserSide(alpha) {
  atOpacity(alpha, () => {
    small('RECEPTACLE INDEXING', 75, 218, {
      size: 15,
      color: P.copper
    });
    text('How does', 72, 303, 58, {
      family: serif
    });
    text('ManiTaskGen', 72, 375, 60, {
      family: serif
    });
    text('index receptacles?', 72, 450, 53, {
      family: serif,
      color: P.copper
    });
    line([75, 504], [138, 504], P.copper, 2);
    // text('Two tables. Three objects.', 75, 557, 25);
    // text('Where will the serving board fit?', 75, 598, 23, {
    //   color: P.muted
    // });
  });
}

function roomShot(kind, u, t, v) {
  const photo = roomMap(kind, u),
    [x, y, w, h] = photo.fr,
    [l, top] = photo.map(0, 0);
  const imageOpacity = 1 - curve(.44, .96, u);
  atOpacity(imageOpacity, () => {
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.drawImage(room, l, top, 950 * photo.z, 534 * photo.z);
    const p = roomQuads[kind].map(q => photo.map(...q));
    const dim = curve(0, .25, u) * (1 - curve(.56, .94, u));
    atOpacity(dim * .33, () => {
      g.beginPath();
      g.rect(x, y, w, h);
      p.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q));
      g.closePath();
      g.fillStyle = '#27342e';
      g.fill('evenodd');
    });
    g.restore();
    atOpacity(1 - curve(0, .7, u), () => stroke(rectPts(x, y, w, h), 1, P.fine, .8));
  });
  if (u < .04) {
    const labels = t < 8 ? windowAt(1.8, 3.4, 7.0, 8, t) : t > 172 ? 0 : 1;
    const pe = photo.map(228, 336),
      po = photo.map(514, 247);
    photoTag(...pe, -77, 51, 'White table', labels);
    photoTag(...po, 66, -49, 'Light wood table', labels);
  }
  const blend = curve(.49, 1, u),
    edge = windowAt(.02, .20, .87, 1, u);
  const framed = roomQuads[kind].map(q => photo.map(...q));
  const dest = [
    [0, 0],
    [plan.w, 0],
    [plan.w, plan.h],
    [0, plan.h]
  ].map(q => tp(v, ...q));
  const p = framed.map((s, i) => s.map((k, j) => lerp(k, dest[i][j], blend)));
  atOpacity(edge, () => {
    stroke([...p, p[0]], curve(.02, .32, u), P.copper, 2);
    p.forEach(q => circle(...q, 3.2, P.paper, 1, P.copper));
  });
  teaserSide(1 - curve(.01, .43, u));
}

function headerFor(copy) {
  text(copy[0], 73, 152, 56, {
    family: serif
  });
  text(copy[1], 76, 192, 23, {
    color: P.muted
  });
}

function caption(s) {
  line([73, 755], [1527, 755], P.pale, 1);
  text(s, 77, 812, 27, {
    family: serif
  });
  small('Illustrative geometry', 1525, 808, {
    size: 13,
    align: 'right',
    track: .1
  });
}

function notesAt(t, pairs) {
  return (pairs.findLast(p => t >= p[0]) || pairs[0])[1];
}

function drawWhiteGrid(v, t, force = false) {
  const on = force ? 1 : curve(18, 22, t),
    hit = force ? 1 : curve(24, 26, t);
  tabletop(v, () => {
    g.save();
    g.beginPath();
    g.roundRect(0, 0, plan.w, plan.h, 12);
    g.clip();
    for (let j = 1; j <= 2; j++) {
      stroke([
        [plan.w * j / 3, 0],
        [plan.w * j / 3, plan.h]
      ], on, '#67796b', 1.9);
      stroke([
        [0, plan.h * j / 3],
        [plan.w, plan.h * j / 3]
      ], on, '#67796b', 1.9);
    }
    atOpacity(hit, () => {
      fillPoly(rectPts(centerCell.x, centerCell.y, centerCell.w, centerCell.h), 'rgba(81,142,111,.32)');
      stroke(rectPts(centerCell.x, centerCell.y, centerCell.w, centerCell.h), 1, P.emerald, 3);
    });
    if (!force) atOpacity(curve(21.5, 24, t), () => whiteCells.forEach((r, i) => text(['front-left', 'front', 'front-right', 'left', 'center', 'right', 'rear-left', 'rear', 'rear-right'][i], r.x + r.w / 2, r.y + r.h / 2 + 7, i === 4 ? 28 : 18, {
      family: i === 4 ? serif : mono,
      color: i === 4 ? P.emerald : P.muted,
      align: 'center'
    })));
    g.restore();
  });
}

function localPatch(r, f, color, strength, dash = [], width = 2) {
  if (f <= .001 || area(r) < .01) return;
  let x = r.x,
    y = r.y,
    w = r.w,
    h = r.h;
  if (r.dx) {
    w *= f;
    if (r.dx < 0) x += r.w - w;
  }
  if (r.dy) {
    h *= f;
    if (r.dy < 0) y += r.h - h;
  }
  const p = rectPts(x, y, w, h);
  atOpacity(strength, () => fillPoly(p, color));
  stroke(p, 1, color, width, dash);
}

function fan(v, all, start, end, t, col, selected, previous = false) {
  if (t < start) return;
  const keep = curve(end - 3.8, end - 1.0, t);
  tabletop(v, () => {
    g.save();
    g.beginPath();
    g.roundRect(0, 0, plan.w, plan.h, 13);
    g.clip();
    for (let i = 0; i < 8; i++) {
      const r = all[i],
        f = curve(start + i * .82, start + i * .82 + 2.05, t),
        winner = r === selected;
      const alpha = winner ? 1 : 1 - keep;
      atOpacity(alpha * (previous ? .42 : 1), () => {
        localPatch(r, f, col, winner ? .25 : .105, all === regionsB ? [7, 5] : [], winner ? 2.8 : 1.6);
        if (!winner || keep < .9) atOpacity(curve(.85, 1, f) * (1 - keep), () => {
          const p = [r.x + r.w * .5, r.y + r.h * .5];
          text(['F', 'FR', 'R', 'RR', 'Rear', 'RL', 'L', 'FL'][i], p[0], p[1] + 6, 18, {
            family: mono,
            color: col,
            align: 'center'
          });
        });
      });
    }
    g.restore();
  });
}

function mergedArt(v, t) {
  const merge = curve(104, 110, t),
    ov = intersection(ra, rb);
  tabletop(v, () => {
    const p = rectPts(ov.x, ov.y, ov.w, ov.h);
    atOpacity(windowAt(100.8, 102.7, 106, 109, t), () => {
      fillPoly(p, '#c2c9aa');
      hatches(ov.x, ov.y, ov.w, ov.h, '#507362', 9);
    });
    atOpacity(merge, () => {
      atOpacity(.28, () => fillPoly(union, P.emerald));
    });
    stroke(union, curve(104, 109.8, t), P.emerald, 4);
  });
}

function orient(v) {
  tabletop(v, () => {
    arrow(47, 39, 47, 12, '#58675c');
    text('FRONT', 58, 32, 14, {
      family: mono,
      color: '#58675c'
    });
  });
}

function support(v, wood, t) {
  const stem = 1315,
    al = 1219,
    bl = 1406;
  small('SUPPORT TREE', 1158, 259, {
    size: 15
  });
  line([1159, 273], [1516, 273], P.pale, .8);
  miniGlyph(v, 'ground', stem, 330, P.muted);
  text('Ground', stem + 34, 335, 23, {
    family: serif
  });
  stroke([
    [stem, 345],
    [stem, 396]
  ], wood ? 1 : curve(15, 17.6, t), P.fine, 1.6);
  miniGlyph(v, 'table', stem, 421, P.muted);
  text(wood ? 'Wood table' : 'White table', stem + 32, 425, 23, {
    family: serif
  });
  if (!wood) return;
  const fork = curve(68.5, 71.4, t);
  atOpacity(fork, () => {
    line([stem, 436], [stem, 489], P.fine, 1.6);
    for (const [x, id, active, col] of [
        [al, 'A', t >= 71, P.copper],
        [bl, 'B', t >= 85.5, P.teal]
      ]) {
      stroke([
        [stem, 489],
        [x, 489],
        [x, 555]
      ], 1, active ? col : P.fine, active ? 2.1 : 1.5, id === 'B' && active ? [6, 4] : []);
      miniGlyph(v, 'lamp', x, 575, active ? col : P.muted);
      text('Lamp ' + id, x, 615, 23, {
        family: serif,
        align: 'center',
        color: active ? col : P.muted
      });
    }
  });
  if (t >= 71 && t < 101) {
    const st = t < 85.5 ? 71 : 85.5;
    const count = Math.min(8, Math.max(0, Math.floor((t - st) / .82) + 1));
    text('Anchor ' + (t < 85.5 ? 'A' : 'B') + '   ' + count + ' / 8 directions', 1159, 694, 18, {
      family: mono,
      color: t < 85.5 ? P.copper : P.teal
    });
  }
}

function materialPanel(v, t) {
  small('OBJECT REPRESENTATION', 1158, 259, {
    size: 15
  });
  line([1159, 273], [1516, 273], P.pale, .8);
  isolatedLamp(v, 'A', 1230, 456, 488, t);
  isolatedLamp(v, 'B', 1422, 457, 488, t);
  text('A', 1230, 503, 21, {
    align: 'center',
    family: mono,
    color: P.copper
  });
  text('B', 1422, 503, 21, {
    align: 'center',
    family: mono,
    color: P.teal
  });
  const ord = t < 59 ? 0 : t < 66 ? 1 : 2;
  ['Desk lamp', 'Line drawing', 'Convex-hull prism'].forEach((label, j) => {
    line([1161, 553 + j * 43], [1182, 553 + j * 43], ord === j ? P.copper : P.pale, ord === j ? 2.4 : 1);
    text(label, 1200, 560 + j * 43, ord === j ? 23 : 20, {
      family: serif,
      color: ord === j ? P.ink : P.muted
    });
  });
}

function surveyScene(t, wood, u) {
  const v = cameraAt(t),
    alpha = curve(.41, .90, u);
  const copy = wood ? (t < 71 ? FILM_COPY.occupied : t < 85.5 ? FILM_COPY.a : t < 101 ? FILM_COPY.b : FILM_COPY.merge) : FILM_COPY.empty;
  atOpacity(alpha, () => {
    headerFor(copy);
    line([1131, 230], [1131, 709], P.pale, 1);
    drawCloud(v, 48);
    tableFrame(v, wood);
    orient(v);
    if (wood) {
      lampShadow(v, A);
      lampShadow(v, B);
      const fade = 1 - curve(104.4, 110, t);
      atOpacity(fade, () => {
        fan(v, regionsA, 71, 85.5, t, P.copper, ra, t >= 85.5);
        fan(v, regionsB, 85.5, 101, t, P.teal, rb);
      });
      if (t >= 101) mergedArt(v, t);
      const oc = [
        ['A', A],
        ['B', B]
      ].sort((l, r) => depthAt(v, ...worldOnTable(l[1].x, l[1].y), 0) - depthAt(v, ...worldOnTable(r[1].x, r[1].y), 0));
      for (const [id, o] of oc) {
        lampVisual(v, o, id, t);
        const color = id === 'A' ? P.copper : P.teal;
        const start = id === 'A' ? 71 : 85.5,
          pulse = windowAt(start, start + .75, start + 2, start + 4, t);
        if (pulse > .001) {
          const [x, y] = worldOnTable(o.x, o.y), contour = (id === 'A' ? hullA : hullB).map(([dx, dy]) => [x + dx, y + dy, TABLE.top + lampHeight(id) + .001]);
          atOpacity(pulse, () => {
            face3(v, contour, id === 'A' ? '#f2ba7f' : '#9acbb4', color, 2.3);
          });
        }
        const focusId = t >= 71 && t < 101 ? (t < 85.5 ? 'A' : 'B') : null;
        badgeAt(v, o, id, focusId && focusId !== id ? .39 : 1, color);
      }
      const panel = 1 - curve(68.5, 70.3, t);
      atOpacity(panel, () => materialPanel(v, t));
      atOpacity(1 - panel, () => support(v, true, t));
    } else {
      drawWhiteGrid(v, t);
      support(v, false, t);
    }
    const msg = wood ? notesAt(t, [
      [42, 'Two desk lamps share this supporting surface.'],
      [54, 'The two desk lamps become line drawings.'],
      [62.5, 'Extrude each footprint’s convex hull to the height of its lamp.'],
      [71, 'A indexes free space around its four sides and four corners.'],
      [80.8, 'Keep A’s front-right region.'],
      [85.5, 'Repeat the eight directional lookups around B.'],
      [96.0, 'Keep B’s front-left region on the same tabletop.'],
      [101, 'The hatching marks the part returned by both lookups.'],
      [106.5, 'The outside boundary encloses the combined placement region.']
    ]) : notesAt(t, [
      [8, 'The ground supports the empty white table.'],
      [17.5, 'The heading sets the orientation of the three-by-three grid.'],
      [24, 'Query the surface for its center receptacle.']
    ]);
    caption(msg);
  });
  if (u < 1) roomShot(wood ? 'occupied' : 'empty', u, t, v);
}

/* Reuse every object's geometry in the inventory, along its flight path and at its measured destination. */
function objectPlate(v, x, y, z, w, d, h, r, fill, side, edge) {
  const lower = roundedLoop(x, y, w, d, r, z),
    upper = roundedLoop(x, y, w, d, r, z + h);
  for (let i = 0; i < lower.length; i++) {
    const j = (i + 1) % lower.length,
      dx = lower[j][0] - lower[i][0],
      dy = lower[j][1] - lower[i][1];
    if (v.sn * dy + v.cs * dx <= 0) continue;
    face3(v, [lower[i], lower[j], upper[j], upper[i]], side);
    path3(v, [lower[i], lower[j]], edge, .85);
  }
  face3(v, upper, fill, edge, 1.05);
}

function itemModel(v, id, color = false) {
  const o = OBJECTS[id],
    w = o.w / 100,
    d = o.d / 100,
    h = o.h,
    edge = '#4f594e',
    light = '#fbf8e9',
    shade = '#d5d9c9';

  function plate(z, width, depth, height, r, fill, side) {
    objectPlate(v, 0, 0, z, width, depth, height, r, fill, side, edge);
  }

  function loop(wi, de, z, r, col) {
    const p = roundedLoop(0, 0, wi, de, r, z);
    path3(v, [...p, p[0]], col, .87);
  }
  if (id === 0) {
    const fill = color ? '#16716e' : light,
      side = color ? '#26857c' : shade,
      lip = color ? '#d4ad5d' : '#a2ab99';
    plate(0, w - .008, d - .008, h - .026, .016, fill, side);
    plate(h - .031, w, d, .031, .018, color ? '#efc66a' : '#eeeedf', lip);
    loop(w - .018, d - .018, h + .0002, .012, edge);
    // Embossed leaves on the lid and a screen-printed cartouche on the front.
    for (const sign of [-1, 1]) {
      const pts = [];
      for (let i = 0; i < 28; i++) {
        const a = i * Math.PI / 14;
        pts.push([sign * (.014 + .011 * Math.cos(a)) + .009 * Math.sin(a), .016 * Math.sin(a), h + .0005]);
      }
      face3(v, pts, color ? '#3b7560' : '#cbd5c5', edge, .65);
    }
    const y = -d / 2 + .003,
      face = [
        [-w * .34, y, h * .20],
        [w * .34, y, h * .20],
        [w * .34, y, h * .67],
        [-w * .34, y, h * .67]
      ];
    face3(v, face, color ? '#f0d9a8' : '#f3f0df', edge, .8);
    for (const len of [.20, .12]) {
      const z = h * (len === .20 ? .51 : .38);
      path3(v, [
        [-w * len, y - .001, z],
        [w * len, y - .001, z]
      ], edge, .95);
    }
  } else if (id === 1) {
    plate(0, w, d, .008, .009, color ? '#a34134' : light, color ? '#854031' : shade);
    plate(.007, w - .009, d - .007, h - .015, .006, '#f1eace', '#d5c9ad');
    plate(h - .008, w, d, .008, .009, color ? '#c55a43' : '#eff1e7', color ? '#9a493a' : shade);
    for (const xx of [-.060, -.054, .052, .058]) path3(v, [
      [xx, -d * .48, h + .0002],
      [xx, d * .48, h + .0002]
    ], xx > 0 ? (color ? '#d7a746' : '#88917e') : edge, .85);
    loop(w * .48, d * .28, h + .001, .004, color ? '#efcc89' : '#7d8776');
    for (let z = .009; z < h - .008; z += .004) path3(v, [
      [-w * .41, -d / 2 + .003, z],
      [w * .44, -d / 2 + .003, z]
    ], '#a39e87', .5);
  } else {
    plate(0, w, d, h, .065, color ? '#d6a365' : '#eee7d2', color ? '#ad8150' : '#cdc6b1');
    loop(w - .030, d - .030, h + .0002, .054, color ? '#9c6937' : '#82856c');
    for (let j = 0; j < 5; j++) {
      const pts = [];
      for (let k = 0; k <= 45; k++) {
        const f = k / 45;
        pts.push([-.46 + f * .91, -.052 + j * .024 + .005 * Math.sin(f * 8 + j), h + .0003]);
      }
      path3(v, pts, color ? '#ad7843' : '#b7b8a0', .58);
    }
    const hole = [];
    for (let k = 0; k <= 36; k++) {
      const a = k * Math.PI / 18;
      hole.push([-.52 + .023 * Math.cos(a), .014 * Math.sin(a), h + .0005]);
    }
    face3(v, hole, color ? '#b28a58' : '#c4c8b3', edge, .85);
  }
}

function itemAt(v, id, x, y, scale, col) {
  itemModel({
    ...v,
    ox: x,
    oy: y,
    aimZ: 0,
    sc: scale
  }, id, col);
}
const inventoryY = [359, 482, 605],
  iconScales = [445, 408, 84];

function inventory(v, t, idx) {
  small('AVAILABLE OBJECTS', 73, 258, {
    size: 16
  });
  line([73, 276], [350, 276], P.fine, .9);
  OBJECTS.forEach((o, i) => {
    const intro = curve(123.4 + i * .55, 125.3 + i * .55, t);
    if (!intro) return;
    atOpacity(intro, () => {
      const taken = i === idx ? curve(SHOTS.picks[i][0] + .3, SHOTS.picks[i][0] + 2, t) : 0;
      atOpacity(1 - .75 * taken, () => {
        const ink = curve(126.2 + i * .34, 127.7 + i * .34, t);
        if (ink < 1) itemAt(v, i, 131, inventoryY[i] + 4, iconScales[i], true);
        if (ink > 0) atOpacity(ink, () => itemAt(v, i, 131, inventoryY[i] + 4, iconScales[i], false));
        text(o.name, 203, inventoryY[i] - 11, 21, {
          family: serif
        });
        small(o.w + ' × ' + o.d + ' cm', 204, inventoryY[i] + 17, {
          size: 15,
          track: 0
        });
      });
      line([73, inventoryY[i] + 46], [350, inventoryY[i] + 46], P.pale, .75);
    });
  });
}
const graphPins = [
  [603, 401],
  [603, 535],
  [650, 663]
];

function taskTree(v, t, idx) {
  const boardPhase = idx !== 2 ? -1 : t < 157.9 ? 0 : t < 162 ? 1 : 2;
  const onA = idx === 1 || idx === 2 && boardPhase !== 1,
    onB = idx === 2 && boardPhase !== 0;
  const col = idx === 2 ? (boardPhase === 0 ? P.copper : boardPhase === 1 ? P.teal : P.emerald) : idx === 1 ? P.copper : P.teal;
  small('SCENE GRAPH', 388, 258, {
    size: 16
  });
  line([388, 276], [752, 276], P.fine, .9);
  const ons = curve(122.8, 124.4, t);
  atOpacity(ons, () => {
    miniGlyph(v, 'ground', 418, 318, P.ink);
    text('Ground', 443, 326, 24, {
      family: serif
    });
  });
  const row = (parent, x, y, label, when, active, glyph, tail = false) => {
    const f = curve(when, when + 1.25, t);
    if (!f) return;
    const c = active ? col : P.fine,
      elbow = Math.min(parent[0] + 17, x - 25);
    stroke([parent, [elbow, parent[1]],
      [elbow, y],
      [x - 14, y]
    ], f, c, active ? 2.1 : 1.15, tail ? [4, 4] : []);
    atOpacity(f, () => {
      if (glyph) miniGlyph(v, glyph, x, y, c);
      else circle(x, y, 4, c, 1, active ? c : P.paper);
      text(label, x + (glyph ? 20 : 12), y + 6, glyph ? 21 : 18, {
        family: glyph ? serif : mono,
        color: active ? col : P.muted
      });
    });
  };
  const root = [416, 337],
    wood = [459, 470],
    aa = [513, 506],
    bb = [513, 599];
  row(root, 458, 370, 'White table', 123.6, idx === 0, 'table');
  row([458, 382], 515, 401, 'center', 124.5, idx === 0, null, true);
  row(root, 458, 461, 'Wood table', 124.25, idx >= 1, 'table');
  row(wood, 513, 498, 'Lamp A', 125.3, onA, 'lamp');
  row(aa, 570, 535, 'rear', 126.1, idx === 1, null, true);
  row(aa, 570, 566, 'front-right', 126.4, idx === 2 && onA, null, true);
  row(wood, 513, 595, 'Lamp B', 125.7, onB, 'lamp');
  row(bb, 570, 628, 'front-left', 126.8, onB, null, true);
  const f = curve(127.2, 129.6, t),
    ac = boardPhase === 2 ? P.emerald : P.fine;
  atOpacity(f, () => {
    stroke([
      [698, 566],
      [725, 566],
      [725, 663],
      [642, 663]
    ], f, ac, boardPhase === 2 ? 1.9 : 1, [4, 4]);
    stroke([
      [689, 628],
      [709, 628],
      [709, 650],
      [642, 650],
      [642, 663]
    ], f, ac, boardPhase === 2 ? 1.9 : 1, [4, 4]);
    circle(637, 663, 3, ac, 1, ac);
    text('merged', 627, 669, 19, {
      family: mono,
      align: 'right',
      color: boardPhase === 2 ? ac : P.muted
    });
  });
}

function taskView(t) {
  const el = radians(39 + 2 * Math.sin((t - 122) / 26)),
    az = radians(-19 + 4 * Math.sin((t - 122) / 19));
  return {
    ox: 1170,
    oy: 514,
    sc: 236,
    aimZ: .32,
    se: Math.sin(el),
    ce: Math.cos(el),
    cs: Math.cos(az),
    sn: Math.sin(az)
  };
}

function regionHighlight(v, rs, col, opacity = 1) {
  tabletop(v, () => atOpacity(opacity, () => {
    const p = rs.length === 1 ? rectPts(rs[0].x, rs[0].y, rs[0].w, rs[0].h) : unionBoundary(rs[0], rs[1]);
    atOpacity(.30, () => fillPoly(p, col));
    stroke(p, 1, col, 3.4);
  }));
}

function boardCandidate(obj, r) {
  const w = obj.w / 100 * pxPerM,
    h = obj.d / 100 * pyPerM;
  return {
    x: r.x + (r.w - w) / 2,
    y: r.y + (r.h - h) / 2,
    w,
    h
  };
}
const boardProbes = [ra, rb].map(r => boardCandidate(OBJECTS[2], r));
const spanCM = r => Math.round(r.w / pxPerM * 100);

function movingCenter(t, i, v) {
  const dest = placements[i],
    anchor = r => tp(v, r.x + r.w * .5, r.y + r.h * .5, .008);
  const target = anchor(dest),
    pin = graphPins[i],
    base = SHOTS.picks[i][0],
    start = [131, inventoryY[i] + 4];
  const a = curve(base + .4, base + 2.5, t),
    b = curve(base + 2.5, base + 5.4, t);

  function between(p, q, f, lift) {
    return [lerp(p[0], q[0], f), lerp(p[1], q[1], f) - lift * Math.sin(f * Math.PI)];
  }
  if (i < 2) {
    if (t < base + 2.5) return {
      p: between(start, pin, a, 39),
      scale: lerp(iconScales[i], 215, a)
    };
    return {
      p: between(pin, target, b, 58),
      scale: lerp(215, v.sc, b)
    };
  }
  const p1 = anchor(boardProbes[0]),
    p2 = anchor(boardProbes[1]);
  if (t < base + 2.5) return {
    p: between(start, pin, a, 40),
    scale: lerp(iconScales[i], 126, a)
  };
  if (t < base + 5.0) {
    const f = curve(base + 2.5, base + 4.4, t);
    return {
      p: between(pin, p1, f, 72),
      scale: lerp(126, v.sc, f)
    };
  }
  if (t < base + 9) {
    const f = curve(base + 5.75, base + 7.55, t);
    return {
      p: between(p1, p2, f, 33),
      scale: v.sc
    };
  }
  const f = curve(base + 10.0, base + 13.7, t);
  return {
    p: between(p2, target, f, 46),
    scale: v.sc
  };
}

function generatedTask(index, elapsed) {
  const sentence = taskSentence(index),
    delay = .82;
  const animate = !reduced.matches;
  if (animate && elapsed < delay) {
    small('GENERATING TASK', 74, 784, {
      size: 14,
      color: P.muted
    });
    for (let i = 0; i < 3; i++) {
      const pulse = (1 + Math.cos(2 * Math.PI * (elapsed / delay - i / 3))) / 2;
      atOpacity(.30 + .70 * pulse, () => circle(79 + i * 16, 816, 3.2, P.emerald, 0, P.emerald));
    }
    return;
  }
  small('GENERATED TASK', 74, 784, {
    size: 14,
    color: P.emerald
  });
  const count = animate ? Math.max(0, Math.min(sentence.length, Math.floor((elapsed - delay) * 25))) : sentence.length;
  const fragment = sentence.slice(0, count);
  text(fragment, 74, 826, 29, {
    family: mono,
    color: P.emerald
  });
  if (count < sentence.length) {
    g.save();
    g.font = '29px ' + mono;
    const cursorX = 76 + g.measureText(fragment).width;
    line([cursorX, 802], [cursorX, 829], P.emerald, 1.7);
    g.restore();
  }
}

function taskBody(t) {
  const idx = t < 130 ? -1 : t < 141 ? 0 : t < 152 ? 1 : 2,
    v = taskView(t);
  headerFor(FILM_COPY.tasks);
  line([370, 235], [370, 704], P.pale, .9);
  line([775, 235], [775, 704], P.pale, .9);
  inventory(v, t, idx);
  taskTree(v, t, idx);
  const base = idx < 0 ? 0 : SHOTS.picks[idx][0];
  const resultAt = base + (idx === 2 ? 13.7 : 5.4),
    settled = idx >= 0 && t >= resultAt;
  if (settled) text('Expected Result', 815, 258, 17, {
    family: 'FilmLabelSC',
    color: P.emerald
  });
  else small('PLACEMENT TEST', 815, 258, {
    size: 16
  });
  line([815, 276], [1526, 276], P.fine, .9);
  if (idx < 0) {
    atOpacity(curve(124, 126, t), () => {
      tableFrame(v, true);
      lampShadow(v, A);
      lampShadow(v, B);
      prism(v, B, 'B', P.teal, 1);
      prism(v, A, 'A', P.copper, 1);
    });
    caption('Choose an object from the inventory and look up a placement region in the scene graph.');
    return;
  }
  const wood = idx > 0;
  const test = idx !== 2 ? 2 : t < base + 5.9 ? 0 : t < base + 10 ? 1 : 2;
  const rs = idx === 2 && test < 2 ? [
    [ra, rb][test]
  ] : destinations[idx];
  const fits = tryPlacement(OBJECTS[idx], rs, wood ? [ab, bb] : []) !== null;
  const label = idx === 2 && test < 2 ? (test === 0 ? 'A · front-right' : 'B · front-left') : destinationsText[idx];
  text(label, 816, 319, 26, {
    family: serif
  });
  tableFrame(v, wood);
  if (wood) {
    lampShadow(v, A);
    lampShadow(v, B);
  }
  if (idx === 0) drawWhiteGrid(v, t, true);
  else regionHighlight(v, rs, fits ? P.emerald : P.copper);
  if (idx === 2 && test === 2) {
    tabletop(v, () => {
      const ov = intersection(ra, rb);
      hatches(ov.x, ov.y, ov.w, ov.h, '#92a08b', 11);
    });
  }
  const {
    p,
    scale
  } = movingCenter(t, idx, v);
  const drawObject = () => {
    if (t >= base + .4) itemAt(v, idx, ...p, scale, false);
  };
  const physical = t >= base + (idx === 2 ? 4.36 : 5.36);
  if (physical) {
    const currentRect = idx === 2 && test < 2 ? boardProbes[test] : placements[idx];
    const wc = worldOnTable(currentRect.x + currentRect.w / 2, currentRect.y + currentRect.h / 2);
    planeShadow(v, ...wc, TABLE.top + .004, OBJECTS[idx].w / 170, OBJECTS[idx].d / 160, .25);
    if (!fits && idx === 2) tabletop(v, () => {
      // The overhanging strips remain visible around the board's outline.
      stroke(rectPts(currentRect.x - 2, currentRect.y - 2, currentRect.w + 4, currentRect.h + 4), 1, P.copper, 3.2, [7, 4]);
    });
  }
  const material = settled ? curve(resultAt, resultAt + .45, t) : 0;
  const models = wood ? [
    ['A', A],
    ['B', B]
  ].map(([id, o]) => ({
    depth: depthAt(v, ...worldOnTable(o.x, o.y), TABLE.top),
    draw: () => {
      if (material < 1) prism(v, o, id, id === 'A' ? P.copper : P.teal, 1);
      atOpacity(material, () => deskLamp(v, o, id, true));
    }
  })) : [];
  if (physical) {
    const rr = idx === 2 && test < 2 ? boardProbes[test] : placements[idx],
      wc = worldOnTable(rr.x + rr.w / 2, rr.y + rr.h / 2);
    models.push({
      depth: depthAt(v, ...wc, TABLE.top),
      draw: drawObject
    });
  }
  models.sort((a, b) => a.depth - b.depth).forEach(e => e.draw());
  if (!physical) drawObject();
  if (material > 0) atOpacity(material, () => {
    badgeAt(v, A, 'A', 1, P.copper);
    badgeAt(v, B, 'B', 1, P.teal);
  });
  if (idx === 2 && settled) atOpacity(curve(resultAt, resultAt + .45, t), () => {
    // Repeat the tabletop heading beside the final scene at this viewing angle.
    const start = xyz(v, TABLE.length / 2 + .10, -.17, TABLE.top),
      tip = xyz(v, TABLE.length / 2 + .10, .13, TABLE.top);
    arrow(...start, ...tip, P.muted);
    small('FRONT', tip[0] + 8, tip[1], {
      size: 13,
      track: .4
    });
  });
  const ri = boundsOf(rs),
    span = spanCM(ri),
    depth = Math.round(ri.h / pyPerM * 100);
  const arrived = idx !== 2 ? t >= base + 5.4 : test === 0 ? t >= base + 4.4 : test === 1 ? t >= base + 7.55 : t >= base + 13.7;
  const clr = arrived ? (fits ? P.emerald : P.copper) : P.muted;
  small('OBJECT   ' + OBJECTS[idx].w + ' × ' + OBJECTS[idx].d + ' cm', 815, 678, {
    size: 16,
    track: 0
  });
  small('REGION   ' + span + ' × ' + depth + ' cm', 815, 703, {
    size: 16,
    track: 0
  });
  text(arrived ? (fits ? 'Fits within region' : 'Exceeds region width') : 'Checking footprint…', 1519, 699, 23, {
    family: serif,
    color: clr,
    align: 'right'
  });
  line([73, 747], [1527, 747], P.pale, 1);
  if (settled) {
    generatedTask(idx, t - resultAt);
  } else {
    small('MATCHING OBJECT ' + (idx + 1) + ' OF 3', 74, 784, {
      size: 14,
      color: P.muted
    });
    const instruction = idx === 2 ? ['Test the board against A’s front-right region.', 'Try B’s front-left region on its own.', 'Join both regions and test the board again.'][test] : 'Find a region for the ' + OBJECTS[idx].label + '.';
    text(instruction, 74, 826, 29, {
      family: serif
    });
  }
}

function draw(t) {
  t = Math.max(0, Math.min(DURATION, t));
  g.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
  g.fillStyle = P.paper;
  g.fillRect(0, 0, WIDTH, HEIGHT);
  mast();
  if (t < 42) {
    surveyScene(t, false, curve(...SHOTS.emptyIn, t) * (1 - curve(...SHOTS.emptyOut, t)));
    return;
  }
  if (t < 122) {
    surveyScene(t, true, curve(...SHOTS.occupiedIn, t) * (1 - curve(...SHOTS.occupiedOut, t)));
    return;
  }
  if (t < 122.85) atOpacity(1 - curve(122, 122.85, t), () => roomShot('occupied', 0, t, cameraAt(t)));
  atOpacity(curve(122.7, 124.1, t) * (1 - curve(173, 174.25, t)), () => taskBody(t));
  if (t > 174.05) atOpacity(curve(174.05, 175.7, t), () => roomShot('empty', 0, 176, cameraAt(8)));
}
