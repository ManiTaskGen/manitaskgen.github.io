const W = 1600,
  H = 900,
  C = document.querySelector('canvas'),
  g = C.getContext('2d');
const c = {
  paper: '#f7f5ee',
  ink: '#232f2b',
  muted: '#56665e',
  faint: '#bfc4b7',
  rule: '#d1d3c7',
  teal: '#1b6f66',
  copper: '#a74e2d',
  pale: '#eeeae0',
  tealLight: '#d5e5db',
  copperLight: '#f1dfcc',
  white: '#fffcf4'
};
const font = {
  s: 'FilmRoman',
  i: 'FilmItalic',
  m: 'FilmMono',
  u: 'FilmSans'
};
const clamp = x => Math.max(0, Math.min(1, x)),
  ramp = (a, b, t) => clamp((t - a) / (b - a)),
  ease = (a, b, t) => {
    let q = ramp(a, b, t);
    return q * q * (3 - 2 * q)
  },
  mix = (a, b, q) => a + (b - a) * q;
const circle = (x, y, r, fill, st = null, w = 1) => {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    g.fillStyle = fill;
    g.fill()
  }
  if (st) {
    g.strokeStyle = st;
    g.lineWidth = w;
    g.stroke()
  }
};

function rect(x, y, w, h, fill, st = null) {
  if (fill) {
    g.fillStyle = fill;
    g.fillRect(x, y, w, h)
  }
  if (st) {
    g.lineWidth = 1;
    g.strokeStyle = st;
    g.strokeRect(x, y, w, h)
  }
}
let paperModel = false;

function path2(pts, col, w = 1, dash = [], fill, close = false) {
  if (!pts.length) return;
  g.save();
  g.beginPath();
  g.moveTo(...pts[0]);
  for (const p of pts.slice(1)) g.lineTo(...p);
  if (close) g.closePath();
  if (fill) {
    g.fillStyle = paperModel ? c.paper : fill;
    g.fill()
  }
  if (col) {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.setLineDash(dash);
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.stroke()
  }
  g.restore()
}

function line(x, y, xx, yy, col = c.rule, w = 1, dash = []) {
  path2([
    [x, y],
    [xx, yy]
  ], col, w, dash)
}

function ink(s, x, y, size = 25, f = 's', col = c.ink, align = 'left') {
  g.save();
  g.font = size + 'px ' + font[f];
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillStyle = col;
  g.fillText(s, x, y);
  g.restore()
}

function width(s, sz, f) {
  g.save();
  g.font = sz + 'px ' + font[f];
  const w = g.measureText(s).width;
  g.restore();
  return w
}

function alpha(o, fn) {
  if (o < .002) return;
  g.save();
  g.globalAlpha *= clamp(o);
  fn();
  g.restore()
}

function clip(x, y, w, h, fn) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  fn();
  g.restore()
}

function ellipse(x, y, rx, ry, fill, stroke, w = 1) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    g.fillStyle = paperModel ? (stroke ? c.paper : 'rgba(120,130,113,.12)') : fill;
    g.fill()
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = w;
    g.stroke()
  }
}

function mast(section, brand = true) {
  ink(brand ? 'ManiTaskGen' : 'Mobile manipulation', 72, 60, 33);
  line(72, 86, 1528, 86);
  ink(section, 1528, 54, 18, 'm', c.muted, 'right')
}

function title(s) {
  ink(s, 72, 164, 53)
}

function arrow(a, b, col, w = 2) {
  line(...a, ...b, col, w);
  const q = Math.atan2(b[1] - a[1], b[0] - a[0]);
  path2([
    [b[0] - 9 * Math.cos(q - .44), b[1] - 9 * Math.sin(q - .44)], b, [b[0] - 9 * Math.cos(q + .44), b[1] - 9 * Math.sin(q + .44)]
  ], col, w)
}
const dims = window.sceneSpriteBounds,
  imgs = {},
  keys = ['ground', 'room', 'table', 'basket', 'dish', 'cup', 'fixture', 'block'];
const bytes = Uint8Array.from(atob(window.scenePointBytes), ch => ch.charCodeAt(0));
const points = new Float32Array(bytes.buffer);
const pointCanvas = document.createElement('canvas');
pointCanvas.width = 1050;
pointCanvas.height = 591;
const pg = pointCanvas.getContext('2d'),
  pix = pg.createImageData(1050, 591);
const ids = ['basket', 'cup', 'dish', 'block'],
  D = {
    ground: 0,
    table: 1,
    basket: 2,
    dish: 2,
    cup: 2,
    fixture: 2,
    block: 3
  },
  starts = [15.15, 18.45, 21.55, 25.3];
const zMean = {
  ground: 0,
  room: 128,
  table: 138,
  basket: 180,
  cup: 157,
  dish: 151,
  block: 162,
  fixture: 160
};
const sa = Math.sqrt(1 - .79 * .79);

function photoMatrix(z, a) {
  const co = Math.cos(a),
    si = Math.sin(a);
  return [co, sa * si, -si / sa, co, 525 * (1 - co) + (335 - .79 * z) * si / sa, 335 * (1 - co) - sa * si * 525 - .79 * z * (1 - co)];
}

function cloud(t, ang) {
  const dst = pix.data;
  dst.fill(0);
  const co = Math.cos(ang),
    si = Math.sin(ang);
  for (let i = 0; i < points.length; i += 9) {
    const X = points[i],
      Y = points[i + 1],
      Z = points[i + 2];
    const x = Math.round(525 + co * X + si * Y),
      y = Math.round(335 + sa * si * X - sa * co * Y - .79 * Z);
    if (x < 1 || x > 1047 || y < 1 || y > 588) continue;
    const j = (x + y * 1050) * 4,
      k = points[i + 7],
      a = points[i + 8] * 242;
    const rr = points[i + 3],
      gg = points[i + 4],
      bb = points[i + 5];
    for (const offset of (k === 2 ? bigBits : smallBits)) {
      const l = j + offset;
      dst[l] = rr;
      dst[l + 1] = gg;
      dst[l + 2] = bb;
      dst[l + 3] = a
    }
  }
  pg.putImageData(pix, 0, 0);
}
const smallBits = [0, 4, 4200, 4204],
  bigBits = [-4, 0, 4, 4196, 4200, 4204, 8396, 8400];

function sprite(id, mode, ang) {
  const box = dims[id];
  g.save();
  g.transform(...photoMatrix(zMean[id], ang));
  g.drawImage(imgs[id + '-' + mode], box[0], box[1]);
  g.restore()
}

function fr(t) {
  const k = ease(11.7, 14.0, t);
  return [mix(649, 72, k), mix(205, 234, k), mix(880, 911, k), mix(495, 513, k)]
}

function scene(t) {
  const [x, y, w, h] = fr(t), blend = ease(12.75, 15.1, t), ang = .059 * ease(13.4, 23.1, t) - .043 * ease(24, 31, t);
  clip(x, y, w, h, () => {
    g.save();
    g.translate(x, y);
    g.scale(w / 1050, h / 591);
    rect(0, 0, 1050, 591, c.pale);
    if (blend < 1) g.drawImage(imgs.input, 0, 0, 1050, 591);
    if (blend > 0) alpha(blend, () => {
      rect(0, 0, 1050, 591, '#ebe8de');
      cloud(t, ang);
      g.drawImage(pointCanvas, 0, 0);
      for (const [i, id] of keys.entries()) {
        if (id === 'room') continue;
        const d = D[id],
          s = starts[d];
        const next = starts[d + 1] ?? 30.3;
        const focus = ease(s + .52, s + 1.44, t) * (1 - .61 * ease(next - .15, next + .65, t));
        const highlight = ease(s, s + .23, t) * (1 - ease(s + .59, s + 1.17, t));
        alpha(focus * (id === 'ground' ? .68 : .98), () => sprite(id, 'solid', ang));
        alpha(highlight, () => sprite(id, 'active', ang));
      }
    });
    g.restore()
  });
  rect(x, y, w, h, null, c.rule);
  return {
    x,
    y,
    w,
    h,
    ang
  };
}

const npos = {
  ground: [1061, 271],
  table: [1120, 351],
  basket: [1190, 432],
  cup: [1190, 504],
  dish: [1190, 576],
  block: [1273, 656]
};
const data = [
  ['ground', 'Ground', null],
  ['table', 'Wooden table', 'ground'],
  ['basket', 'Basket', 'table'],
  ['cup', 'Cup', 'table'],
  ['dish', 'Shallow dish', 'table'],
  ['block', 'Yellow block', 'dish']
];

function graph(t) {
  ink('SCENE GRAPH  /  SUPPORT RELATIONS', 1040, 230, 17, 'm', c.muted);
  for (const [id, label, par] of data) {
    let when = starts[D[id]] + .24 + (id === 'cup' ? .18 : id === 'dish' ? .30 : 0);
    const q = ease(when, when + .72, t),
      p = npos[id];
    if (q <= 0) continue;
    const active = t < ((starts[D[id] + 1] ?? 34) + .25);
    alpha(q, () => {
      if (par) {
        const [x, y] = npos[par];
        const xx = (x + p[0]) / 2;
        path2([
          [x, y + 10],
          [x, y + 25],
          [xx, y + 25],
          [xx, p[1]],
          [p[0] - 11, p[1]]
        ], active ? c.copper : c.faint, active ? 2 : 1.45)
      }
      circle(...p, 7, active ? c.copper : c.teal, c.paper, 2);
      ink(label, p[0] + 18, p[1] + 8, 27, 's', active ? c.ink : c.muted);
    })
  }
}

function extraction(t) {
  mast('Scene graph');
  title('Read the scene from the ground up.');
  const reg = scene(t);
  graph(t);
  // Magnify the nested support relation only after the full scene and its branch are visible.
  const zoom = ease(26.4, 27.25, t) * (1 - ease(29.7, 30.8, t));
  alpha(zoom, () => {
    const center = [reg.x + reg.w * .16, reg.y + reg.h * .74],
      rr = 54;
    const mat = photoMatrix(zMean.block, reg.ang),
      u = 278,
      v = 201;
    const anchor = [reg.x + (mat[0] * u + mat[2] * v + mat[4]) * reg.w / 1050, reg.y + (mat[1] * u + mat[3] * v + mat[5]) * reg.h / 591];
    path2([anchor, [anchor[0] - 22, anchor[1] + 29],
      [center[0] + rr * .56, center[1] - rr * .78]
    ], c.copper, 1.6);
    circle(...anchor, 4, c.paper, c.copper, 1.6);
    g.save();
    g.beginPath();
    g.arc(...center, rr, 0, 2 * Math.PI);
    g.clip();
    const sw = 91,
      sh = 91;
    g.drawImage(imgs.input, ((278 - sw / 2) / 1050) * imgs.input.width, ((201 - sh / 2) / 591) * imgs.input.height, sw / 1050 * imgs.input.width, sh / 591 * imgs.input.height, center[0] - rr, center[1] - rr, rr * 2, rr * 2);
    g.restore();
    circle(...center, rr, null, c.paper, 5);
    circle(...center, rr + 1, null, c.copper, 1.6)
  });
  let d = starts.filter(x => t >= x).length - 1;
  d = Math.max(0, d);
  const notes = ['The floor is the root.', 'The floor supports the wooden table.', 'The table supports a basket, a cup and a dish.', 'The dish supports the yellow block.'];
  line(72, 798, 1528, 798);
  ink('DEPTH ' + d, 74, 843, 19, 'm', c.copper);
  ink(notes[d], 224, 844, 27);
  ink('Illustrative point cloud', 1527, 842, 17, 'i', c.muted, 'right');
}

function sketch(id, x, y, size, paint = false) {
  // Hand-drawn profiles from the observed objects, also used on the inventory sheet.
  g.save();
  g.translate(x, y);
  g.scale(size / 100, size / 100);
  const e = paint ? '#665d50' : c.ink,
    f = paint ? '#e3c77c' : c.paper;
  if (id === 'block') {
    path2([
      [-31, -13],
      [4, -26],
      [32, -12],
      [-4, 3]
    ], e, 1.8, [], paint ? '#ebca79' : '#faf8ef', true);
    path2([
      [-31, -13],
      [-4, 3],
      [-4, 29],
      [-31, 13]
    ], e, 1.8, [], paint ? '#bf994d' : '#dddccf', true);
    path2([
      [-4, 3],
      [32, -12],
      [32, 13],
      [-4, 29]
    ], e, 1.8, [], paint ? '#cfad58' : '#ebeadc', true);
    path2([
      [-23, -12],
      [3, -21],
      [24, -12]
    ], e, .6);
  } else if (id === 'basket') {
    path2([
      [-42, -12],
      [8, -30],
      [44, -13],
      [37, 24],
      [-8, 39],
      [-37, 18]
    ], e, 1.7, [], paint ? '#aa815f' : '#e9e7db', true);
    path2([
      [-42, -12],
      [-7, 8],
      [44, -13],
      [8, -30]
    ], e, 1.8, [], paint ? '#8e6646' : '#d9d7c5', true);
    path2([
      [-34, -12],
      [-7, 3],
      [35, -13],
      [8, -24]
    ], e, 1, [], paint ? '#9c7758' : '#f7f5eb', true);
    line(-7, 9, -8, 36, e, 1.3);
    for (let i = 1; i <= 5; i++) {
      let u = i / 6;
      line(mix(-38, -7, u), mix(-6, 11, u), mix(-34, -8, u), mix(17, 32, u), '#85887a', .8);
      line(mix(-6, 40, u), mix(11, -8, u), mix(-7, 35, u), mix(32, 19, u), '#85887a', .8)
    }
  } else if (id === 'cup') {
    path2([
      [-21, -17],
      [-17, 16],
      [-12, 24],
      [4, 28],
      [15, 21],
      [21, -16]
    ], e, 1.8, [], paint ? '#e9e0d6' : '#ebeade', true);
    ellipse(0, -17, 21, 10, paint ? '#92899b' : '#dadbd0', e, 1.8);
    ellipse(0, -16, 16, 6, paint ? '#9b9197' : '#cecec1', e, .6);
    for (const [xx, yy] of [
        [-10, 3],
        [8, 14]
      ]) {
      for (let i = 0; i < 5; i++) ellipse(xx + Math.cos(i * 1.257) * 3, yy + Math.sin(i * 1.257) * 3, 2, 2, paint ? '#84718d' : '#91988b')
    }
  } else {
    path2([
      [-36, -7],
      [-31, 7],
      [-20, 18],
      [0, 22],
      [22, 17],
      [32, 8],
      [36, -7]
    ], e, 1.8, [], '#e5e6d9', true);
    ellipse(0, -7, 36, 17, paint ? '#b2b8bb' : '#f6f4e9', e, 1.6);
    ellipse(0, -7, 28, 12, paint ? '#657992' : '#d5d9cc', e, 1.1);
  }
  g.restore();
}

function regionIcon(x, y, which, size = 1) {
  g.save();
  g.translate(x, y);
  g.scale(size, size);
  const proj = (a, b) => [a + b * .30, b * .62 - a * .13];
  const pp = poly => poly.map(v => proj(...v));
  path2(pp([
    [-80, -57],
    [80, -57],
    [80, 57],
    [-80, 57]
  ]), c.muted, 1.7, [], c.white, true);
  path2(pp(which === 0 ? [
    [36, 3],
    [78, 3],
    [78, 27],
    [36, 27]
  ] : [
    [-77, -29],
    [-39, -29],
    [-39, 12],
    [-77, 12]
  ]), c.teal, 1.8, [4, 3], '#c5dbce', true);
  const basket = pp([
    [-35, -31],
    [-9, -31],
    [-9, 12],
    [-35, 12]
  ]);
  path2(basket, c.muted, 1.3, [], '#e0dece', true);
  const cup = proj(26, 15);
  ellipse(...cup, 7, 5, '#e2dfd0', c.muted, 1.2);
  const dish = proj(-56, 29);
  ellipse(...dish, 8, 5, '#e4e3d7', c.muted, 1);
  g.restore()
}

function renderTable(x, y, sc, progress, showGoal = true) {
  const k = (a, b, z = 0) => [x + sc * (.97 * a + .22 * b), y + sc * (.15 * a - .55 * b - .84 * z)];

  function face(vertices, fill, st = '#696b5d', lw = 1) {
    path2(vertices.map(p => k(...p)), st, lw, [], fill, true)
  }

  function post(a, b, z, l, d, h, colors) {
    const x0 = a - l / 2,
      x1 = a + l / 2,
      y0 = b - d / 2,
      y1 = b + d / 2,
      z1 = z + h;
    face([
      [x1, y0, z],
      [x1, y1, z],
      [x1, y1, z1],
      [x1, y0, z1]
    ], colors[1]);
    face([
      [x0, y0, z],
      [x1, y0, z],
      [x1, y0, z1],
      [x0, y0, z1]
    ], colors[2]);
    face([
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1]
    ], colors[0]);
  }
  const edge = '#585d53',
    L = 1.18,
    B = .60,
    top = .72,
    wood = ['#ddd4bf', '#b5ad98', '#c5bda8'];
  const shadow = k(0, 0);
  ellipse(shadow[0], shadow[1], sc * 1.14, sc * .22, 'rgba(80,76,53,.08)');
  for (const [a, b] of [
      [-1, .48],
      [1, .48],
      [-1, -.48],
      [1, -.48]
    ]) post(a, b, 0, .080, .080, top - .055, ['#d8d3be', '#aaa899', '#bdb8a5']);
  post(0, 0, top - .064, L * 2, B * 2, .064, wood);
  for (let n = 0; n < 7; n++) {
    const v = -.49 + n * .16;
    path2([k(-1.12, v, top + .001), k(-.35, v + .012, top + .001), k(.65, v - .012, top + .001), k(1.12, v + .006, top + .001)], '#c5beaa', .65)
  }
  const pos = {
    dish: [-.82, -.11],
    basket: [-.29, .06],
    cup: [.37, -.21],
    target: [.78, -.21]
  };
  if (showGoal) {
    const pts = [
      [.52, -.38],
      [1.06, -.38],
      [1.06, -.08],
      [.52, -.08]
    ].map(([a, b]) => k(a, b, top + .001));
    path2(pts, c.teal, 2, [7, 5], 'rgba(113,170,147,.28)', true);
  }

  function ring(a, b, z, rx, ry, n = 54) {
    return Array.from({
      length: n + 1
    }, (_, i) => k(a + rx * Math.cos(2 * Math.PI * i / n), b + ry * Math.sin(2 * Math.PI * i / n), z))
  }

  function pot(a, b, r, h, dish = false) {
    const z = top,
      bot = ring(a, b, z, r * .68, r * .68),
      rim = ring(a, b, z + h, r, r);
    path2([...rim.slice(27, 54), ...bot.slice(27, 54).reverse()], edge, 1.2, [], dish ? '#d9dcce' : '#e5ded6', true);
    path2(rim, edge, 1.8, [], dish ? '#e6e5d9' : '#f0eee4', true);
    path2(ring(a, b, z + h + .001, r * .82, r * .82), dish ? '#5c6b7a' : '#827f83', 1, [], dish ? '#8c9da9' : '#a9a6a1', true);
    if (!dish) {
      for (const [u, v] of [
          [-.035, .04],
          [.026, .061]
        ]) {
        const s = k(a + u, b - r * .82, z + v);
        for (let j = 0; j < 5; j++) ellipse(s[0] + Math.cos(j * 1.256) * 2.7, s[1] + Math.sin(j * 1.256) * 2.6, 1.8, 1.7, '#897994')
      }
    }
  }

  function basket() {
    const [a, b] = pos.basket, l = .36, d = .44, h = .16, z = top;
    post(a, b, z, l, d, h, ['#c9b394', '#a88e6f', '#b69a7a']);
    const r = .027;
    face([
      [a - l / 2 + r, b - d / 2 + r, z + h + .001],
      [a + l / 2 - r, b - d / 2 + r, z + h + .001],
      [a + l / 2 - r, b + d / 2 - r, z + h + .001],
      [a - l / 2 + r, b + d / 2 - r, z + h + .001]
    ], '#8c765c', '#927e66', .8);
    for (let j = 1; j < 11; j++) {
      const xx = a - l / 2 + l * j / 11;
      path2([k(xx, b - d / 2, z + .008), k(xx, b - d / 2, z + h - .008)], '#967e65', .7)
    }
    for (let j = 1; j < 6; j++) {
      const zz = z + h * j / 6;
      path2([k(a - l / 2, b - d / 2, zz), k(a + l / 2, b - d / 2, zz)], '#9d876e', .65)
    }
  }
  // The white fixture at the rear stays contextual, as in the observation.
  post(.15, .50, top, .15, .09, .023, ['#e8e6da', '#b5b7ab', '#d0d1c5']);
  post(.15, .50, top + .025, .095, .043, .065, ['#efede2', '#b9bcaf', '#dbddcf']);
  basket();
  pot(...pos.dish, .126, .048, true);
  pot(...pos.cup, .087, .14);
  const u = progress,
    a = mix(pos.dish[0], pos.target[0], u),
    b = mix(pos.dish[1], pos.target[1], u);
  const hh = top + mix(.041, 0, u) + .38 * Math.sin(u * Math.PI);
  if (showGoal && u > 0 && u < 1) {
    const pts = Array.from({
      length: 33
    }, (_, i) => {
      const v = i / 32;
      return k(mix(pos.dish[0], pos.target[0], v), mix(pos.dish[1], pos.target[1], v), top + .07 + .38 * Math.sin(v * Math.PI))
    });
    path2(pts, c.copper, 1.4, [4, 5])
  }
  const sh = k(a, b, top + .006);
  ellipse(sh[0], sh[1], sc * .095, sc * .037, 'rgba(95,80,49,.12)');
  post(a, b, hh, .11, .18, .062, ['#e6c16c', '#b39758', '#ceb16a']);
  return {
    dish: k(...pos.dish, top + .05),
    target: k(...pos.target, top + .04),
    block: k(a, b, hh + .07)
  };
}

function typed(lines, t, start, speed, x, y, sz = 34, lh = 49, f = 'm', col = c.ink) {
  const full = lines.join(' '),
    n = Math.min(full.length, Math.max(0, Math.floor((t - start) * speed)));
  let used = 0;
  lines.forEach((s, i) => {
    const count = Math.max(0, Math.min(s.length, n - used)),
      frag = s.slice(0, count);
    ink(frag, x, y + lh * i, sz, f, col);
    if (t >= start && n < full.length && n >= used && n <= used + s.length) {
      const xx = x + width(frag, sz, f) + 3;
      line(xx, y + lh * i - sz * .77, xx, y + lh * i + 3, col, 1.6)
    }
    used += s.length + 1;
  });
}

function processShot(t) {
  mast('Task generation');
  title('Process-based tasks');
  ink('Specify the object and its destination.', 73, 213, 25, 'u', c.muted);
  line(924, 266, 924, 717);
  const u = ease(45.05, 48.6, t);
  const m = renderTable(485, 619, 302, u);
  alpha(ease(42.0, 43.0, t) * (1 - ease(45.0, 46.1, t)), () => {
    const p = m.dish;
    path2([
      [p[0] - 2, p[1] - 9],
      [p[0] - 22, p[1] - 52],
      [p[0] - 124, p[1] - 52]
    ], c.copper, 1.5);
    ink('Source dish', p[0] - 125, p[1] - 65, 20, 'm', c.copper)
  });
  alpha(ease(47.75, 48.8, t), () => {
    const p = m.target;
    path2([
      [p[0], p[1] - 14],
      [p[0] + 25, p[1] - 72],
      [p[0] + 89, p[1] - 72]
    ], c.teal, 1.5);
    ink('Destination', p[0] + 92, p[1] - 83, 20, 'm', c.teal, 'right')
  });
  ink('GENERATED INSTRUCTION', 972, 315, 18, 'm', c.copper);
  typed(['Move the yellow block', 'from the dish to the', 'right of the cup.'], t, 41.55, 25, 972, 405, 33, 58, 'm');
  alpha(ease(48.60, 49.35, t), () => {
    line(973, 591, 1488, 591);
    circle(984, 639, 8, c.teal);
    ink('Placement reached', 1007, 645, 24, 'u', c.teal)
  });
  line(73, 774, 1528, 774);
  ink('Object', 74, 828, 21, 'm', c.muted);
  ink('Yellow block', 176, 830, 28);
  ink('Receptacle', 765, 828, 21, 'm', c.muted);
  ink('Right of the cup', 935, 830, 28);
}

const scores = [
  ['Claude 4.5 Sonnet', 40.3],
  ['GPT-5.2', 37.2],
  ['Gemini 3.1 Pro', 36.2],
  ['GPT-4o', 22.7],
  ['Qwen 2.5 VL 72B Instruct', 16.2],
  ['Human', 83.3]
];

function results(t) {
  mast('Benchmark results');
  title('How much of the benchmark can each agent solve?');
  const x = 818,
    x1 = 1442,
    w = x1 - x;
  ink('12 VLM agents', 72, 320, 55);
  ink('4 task levels', 72, 388, 55, 'i', c.teal);
  ink('ReplicaCAD and AI2-THOR', 73, 456, 24, 'u', c.muted);
  line(73, 491, 496, 491);
  ink('Process-based tasks', 74, 545, 26);
  ink('Levels 1–3', 74, 581, 20, 'm', c.copper);
  ink('Outcome-based tasks', 74, 652, 26);
  ink('Level 4', 74, 686, 20, 'm', c.teal);
  ink('MEAN SUCCESS RATE ACROSS LEVELS', 607, 241, 18, 'm', c.muted);
  for (let j = 0; j <= 4; j++) {
    const k = x + w * j / 4;
    line(k, 278, k, 709, j === 0 ? c.faint : c.rule, .85);
    ink(j * 25 + '%', k, 267, 17, 'm', c.muted, 'center')
  }
  scores.forEach(([name, score], i) => {
    const yy = 332 + i * 61 + (i === 5 ? 24 : 0),
      co = i === 5 ? c.copper : c.teal;
    const u = ease(72.1 + i * .28, 74.3 + i * .28, t);
    ink(name, x - 19, yy + 6, 22, 's', c.ink, 'right');
    rect(x, yy - 11, w * (score / 100) * u, 18, co);
    alpha(ease(73.5 + i * .28, 74.3 + i * .28, t), () => ink(score.toFixed(1) + '%', x + w * score / 100 + 10, yy + 5, 20, 'm', co));
  });
  line(598, 605, 1527, 605, c.rule, .85);
  ink('Selected agents and human reference · ManiTaskGen, Table 3', 605, 750, 18, 'u', c.muted);
  line(72, 790, 1528, 790);
  alpha(ease(79.2, 80.4, t), () => {
    ink('Watch next', 73, 843, 22, 'i', c.copper);
    ink('How does ManiTaskGen index receptacles?', 220, 843, 28);
    arrow([784, 834], [829, 834], c.copper, 1.6)
  })
}
