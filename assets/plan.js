/* Conjunto de tres viviendas adosadas — generador paramétrico.
   Todas las medidas en metros. El origen de cada unidad es su esquina
   frontal izquierda; el eje Y crece hacia el fondo del lote. */
'use strict';

const ME = 0.15;      // espesor de muro perimetral / medianero
const TA = 0.10;      // espesor de tabique interior
const H  = 2.50;      // altura libre
const LOTE_W = 6.00;  // ancho de cada unidad
const LOTE_D = 11.00; // fondo del terreno
const TERRENO = 198;  // 18 x 11 m

const DEFAULTS = { retiro: 1.0, patio: 2.0, social: 3.20, bano: 1.60, pas: 0.90 };
const P = Object.assign({}, DEFAULTS);
const L = { cotas: true, mob: true, zonas: true, eje: true };
let modo = 'unidad';

const $ = id => document.getElementById(id);
const elPlan = $('plan');

/* ---------------------------------------------------------------- geometría */

function geo() {
  const fondo = LOTE_D - P.retiro - P.patio;
  const iw = LOTE_W - ME;
  const rx = ME, rr = rx + iw;
  const y0 = ME, y1 = fondo - ME;
  const ySoc = y0 + P.social;
  const yPrivA = ySoc + TA;

  /* Los rangos de los sliders admiten combinaciones que no caben en el fondo
     disponible (p. ej. retiro 2.00 + patio 3.00 + social 4.40). Sin recortar,
     los ambientes de atrás salen con fondo negativo. Se recortan a cero y
     `cabe` queda en false para que el cuadro de áreas lo denuncie. */
  const dPriv = Math.max(0, y1 - yPrivA);
  const dBano = Math.max(0, Math.min(P.bano, dPriv));
  const yBanoFin = yPrivA + dBano;
  const yD2 = Math.min(yBanoFin + TA, y1);
  const dD2 = Math.max(0, y1 - yD2);
  const cabe = (y1 - yPrivA) >= (P.bano + TA + 0.01);
  const y1c = Math.max(y1, yPrivA);

  const wSala = 2.80, wCom = 1.55;
  const xSala = [rx, rx + wSala];
  const xCom = [rx + wSala, rx + wSala + wCom];
  const xCoc = [rx + wSala + wCom, rr];
  const wD1 = 2.45, pas = P.pas;
  const xD1 = [rx, rx + wD1];
  const xPas = [xD1[1] + TA, xD1[1] + TA + pas];
  const xRig = [xPas[1] + TA, rr];

  const R = [
    { k: 'sala', n: 'Sala', z: 'social', x: xSala[0], y: y0, w: wSala, d: P.social },
    { k: 'com', n: 'Comedor', z: 'social', x: xCom[0], y: y0, w: wCom, d: P.social },
    { k: 'coc', n: 'Cocina', z: 'humedo', x: xCoc[0], y: y0, w: xCoc[1] - xCoc[0], d: P.social },
    { k: 'd1', n: 'Dorm. principal', z: 'privado', x: xD1[0], y: yPrivA, w: wD1, d: dPriv },
    { k: 'pas', n: 'Pasillo', z: 'circ', x: xPas[0], y: yPrivA, w: pas, d: dPriv },
    { k: 'ban', n: 'Baño', z: 'humedo', x: xRig[0], y: yPrivA, w: xRig[1] - xRig[0], d: dBano },
    { k: 'd2', n: 'Dorm. secundario', z: 'privado', x: xRig[0], y: yD2, w: xRig[1] - xRig[0], d: dD2 }
  ];

  const muros = [
    { x: 0, y: 0, w: LOTE_W + ME, d: ME, run: 'h', segs: frenteSegs(rx, rr) },
    { x: 0, y: fondo - ME, w: LOTE_W + ME, d: ME, run: 'h', segs: fondoSegs(xD1, xPas, xRig) },
    { x: 0, y: 0, w: ME, d: fondo, run: 'v', segs: [] },
    { x: LOTE_W, y: 0, w: ME, d: fondo, run: 'v', segs: [] }
  ];

  // Los huecos se recortan al tramo realmente construido del tabique.
  const hueco = (a, b, t) => [Math.max(a, yPrivA), Math.min(b, y1c), t];

  const tabiques = [
    { o: 'h', y: ySoc, x0: rx, x1: rr, huecos: [[xPas[0], xPas[1], 'vano']] },
    { o: 'v', x: xD1[1], y0: yPrivA, y1: y1c, huecos: [hueco(yPrivA + 0.30, yPrivA + 1.10, 'puerta')] },
    { o: 'v', x: xPas[1], y0: yPrivA, y1: y1c, huecos: [hueco(yPrivA + 0.30, yPrivA + 1.00, 'puerta'), hueco(yD2 + 0.20, yD2 + 1.00, 'puerta')] },
    { o: 'h', y: yBanoFin, x0: xRig[0], x1: xRig[1], huecos: [] }
  ];

  return {
    fondo, rx, rr, y0, y1: y1c, ySoc, yPrivA, dPriv, dBano, dD2, cabe, R, muros, tabiques,
    xSala, xCom, xCoc, xD1, xPas, xRig, yD2, yBanoFin
  };
}

function frenteSegs(rx, rr) {
  const w = rr - rx;
  return [
    { a: rx + 0.20, b: rx + 1.60, t: 'ventana' },
    { a: rx + 1.80, b: rx + 2.70, t: 'puerta' },
    { a: rx + 3.15, b: rx + 4.15, t: 'ventana' },
    { a: rx + w - 1.35, b: rx + w - 0.15, t: 'ventana' }
  ];
}

function fondoSegs(xD1, xPas, xRig) {
  return [
    { a: xD1[0] + 0.70, b: xD1[0] + 2.20, t: 'ventana' },
    { a: xPas[0] + 0.05, b: xPas[0] + 0.85, t: 'puerta' },
    { a: xRig[0] + 0.60, b: xRig[0] + 1.60, t: 'ventana' }
  ];
}

/* Mobiliario esquemático: solo trazos, para verificar que los muebles caben. */
function mobiliario(g) {
  const f = k => g.R.find(r => r.k === k);
  const sala = f('sala'), com = f('com'), coc = f('coc');
  const d1 = f('d1'), d2 = f('d2'), ban = f('ban');
  return [
    { x: sala.x + 0.15, y: sala.y + sala.d - 0.95, w: 1.80, d: 0.80 },
    { x: sala.x + 0.85, y: sala.y + 1.30, w: 0.90, d: 0.50 },
    { x: sala.x + 0.30, y: sala.y, w: 1.20, d: 0.40 },
    { x: com.x + 0.40, y: com.y + 1.00, w: 0.75, d: 1.20 },
    { x: coc.x, y: coc.y, w: coc.w, d: 0.60 },
    { x: coc.x + coc.w - 0.60, y: coc.y + 0.60, w: 0.60, d: 1.80 },
    { x: coc.x + coc.w - 0.70, y: coc.y + coc.d - 0.80, w: 0.70, d: 0.70 },
    { x: ban.x + ban.w - 0.45, y: ban.y + 0.15, w: 0.40, d: 0.70 },
    { x: ban.x + ban.w - 0.90, y: ban.y + ban.d - 0.80, w: 0.90, d: 0.75 },
    { x: ban.x + 0.15, y: ban.y + ban.d - 0.45, w: 0.50, d: 0.40 },
    { x: d1.x + 0.15, y: d1.y + 0.10, w: 1.40, d: 1.90 },
    { x: d1.x, y: d1.y + d1.d - 2.00, w: 0.60, d: 2.00 },
    { x: d2.x + d2.w - 1.05, y: d2.y + 0.10, w: 1.00, d: 1.90 },
    { x: d2.x + 0.05, y: d2.y + d2.d - 1.25, w: 0.80, d: 1.20 }
  ];
}

/* --------------------------------------------------------------- planta SVG */

function svgPlan() {
  const g = geo();
  const unidad = modo === 'unidad';
  const nU = unidad ? 1 : 3;
  const s = unidad ? 62 : 32;
  const totW = unidad ? (LOTE_W + ME) : (LOTE_W * 3 + ME);
  const mx = unidad ? 96 : 60, my = unidad ? 66 : 60;
  const W = totW * s + mx * 2, Hgt = LOTE_D * s + my * 2 + 30;
  const Y = P.retiro;
  let o = '';

  const px = v => (mx + v * s).toFixed(1);
  const py = v => (my + v * s).toFixed(1);
  // Un <rect> con width o height negativo es inválido en SVG y anula el dibujo.
  const rect = (x, y, w, d, fill, stroke, sw) =>
    (w <= 0 || d <= 0) ? '' :
    '<rect x="' + px(x) + '" y="' + py(y) + '" width="' + (w * s).toFixed(1) +
    '" height="' + (d * s).toFixed(1) + '" fill="' + fill +
    '" stroke="' + (stroke || 'none') + '" stroke-width="' + (sw || 0) + '"/>';
  const txt = (x, y, t, cls, anchor) =>
    '<text x="' + px(x) + '" y="' + py(y) + '" text-anchor="' + (anchor || 'middle') +
    '" class="' + cls + '">' + t + '</text>';
  const line = (x1, y1, x2, y2, col, sw, dash) =>
    '<line x1="' + px(x1) + '" y1="' + py(y1) + '" x2="' + px(x2) + '" y2="' + py(y2) +
    '" stroke="' + col + '" stroke-width="' + sw + '"' +
    (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';

  o += '<style>' +
    "text{font-family:'Archivo',sans-serif;fill:#1B211C}" +
    '.nm{font-size:' + (unidad ? 13 : 10.5) + 'px;font-weight:500}' +
    '.dm{font-size:' + (unidad ? 11 : 9) + "px;font-family:'IBM Plex Mono',monospace;fill:#5D6459}" +
    ".ct{font-size:11px;font-family:'IBM Plex Mono',monospace;fill:#5D6459}" +
    '</style>';

  const zf = z => !L.zonas ? '#E4E7E0' : ({
    social: 'var(--social)', humedo: 'var(--humedo)',
    privado: 'var(--privado)', circ: 'var(--circ)'
  })[z];

  for (let u = 0; u < nU; u++) {
    const off = u * LOTE_W;
    // La unidad central se refleja para que los ejes húmedos compartan medianera.
    const mir = (!unidad && u === 1);
    const fx = v => mir ? (2 * off + LOTE_W + ME - v) : (off + v);
    const fw = (x, w) => mir ? [fx(x + w), w] : [fx(x), w];
    const anchoLote = LOTE_W + (u === nU - 1 ? ME : 0);

    o += rect(off, 0, anchoLote, P.retiro, 'var(--exterior)', 'var(--linea)', 0.6);
    o += rect(off, P.retiro + g.fondo, anchoLote, P.patio, 'var(--exterior)', 'var(--linea)', 0.6);

    g.R.forEach(r => {
      const xx = fw(r.x, r.w)[0], ww = r.w;
      o += rect(xx, Y + r.y, ww, r.d, zf(r.z), 'var(--linea)', 0.6);
      const cx = xx + ww / 2, cy = Y + r.y + r.d / 2;
      if (r.d * s > 26 && ww * s > 34) {
        o += txt(cx, cy - (r.d * s > 44 ? 0.06 : 0), r.n, 'nm');
        if (r.d * s > 44) o += txt(cx, cy + 0.22, r.w.toFixed(2) + ' × ' + r.d.toFixed(2), 'dm');
      }
    });

    g.muros.forEach(m => {
      if (m.run === 'h') {
        const ys = Y + m.y;
        const cuts = m.segs.map(sg => {
          const a = fw(sg.a, sg.b - sg.a)[0], w = sg.b - sg.a;
          return { a: Math.min(a, a + w), b: Math.max(a, a + w) };
        }).sort((p, q) => p.a - q.a);
        const fin = off + LOTE_W + ME;
        let x = off;
        cuts.forEach(c => {
          if (c.a > x) o += rect(x, ys, c.a - x, ME, 'var(--tinta)');
          x = c.b;
        });
        if (x < fin) o += rect(x, ys, fin - x, ME, 'var(--tinta)');
        // Línea fina en el hueco: marca el vidrio / la hoja.
        cuts.forEach(c => { o += rect(c.a, ys + 0.045, c.b - c.a, 0.06, 'none', 'var(--tinta)', 0.9); });
      } else {
        o += rect(fx(m.x) + (mir ? -ME : 0), Y + m.y, ME, m.d, 'var(--tinta)');
      }
    });

    g.tabiques.forEach(t => {
      if (t.o === 'h') {
        const p0 = fx(t.x0), p1 = fx(t.x1);
        const a = Math.min(p0, p1), b = Math.max(p0, p1);
        const hs = t.huecos.map(h => {
          const q0 = fx(h[0]), q1 = fx(h[1]);
          return { a: Math.min(q0, q1), b: Math.max(q0, q1) };
        }).sort((p, q) => p.a - q.a);
        let x = a;
        hs.forEach(h => {
          if (h.a > x) o += rect(x, Y + t.y, h.a - x, TA, 'var(--tinta)');
          x = h.b;
        });
        if (x < b) o += rect(x, Y + t.y, b - x, TA, 'var(--tinta)');
      } else {
        const xv = mir ? fx(t.x) - TA : fx(t.x);
        let y = t.y0;
        t.huecos.slice().sort((p, q) => p[0] - q[0]).forEach(h => {
          if (h[0] > y) o += rect(xv, Y + y, TA, h[0] - y, 'var(--tinta)');
          y = h[1];
        });
        if (y < t.y1) o += rect(xv, Y + y, TA, t.y1 - y, 'var(--tinta)');
      }
    });

    if (L.mob && unidad) {
      mobiliario(g).forEach(m => {
        o += rect(fw(m.x, m.w)[0], Y + m.y, m.w, m.d, 'none', '#6B7269', 0.9);
      });
      // Pila de lavar en el patio.
      o += rect(fx(g.xPas[0] + 0.15), P.retiro + g.fondo + 0.20, 1.20, 0.70, 'none', '#6B7269', 0.9);
    }

    if (L.eje) {
      const exx = unidad ? off + LOTE_W + 0.03 : (u === 1 ? off : off + LOTE_W);
      o += line(exx, 0.2, exx, LOTE_D - 0.3, 'var(--ladrillo)', 2, '7 5');
    }
  }

  if (L.cotas) {
    const yb = LOTE_D + 0.35;
    o += line(0, yb, totW, yb, '#5D6459', 0.7);
    o += txt(totW / 2, yb + 0.28, (unidad ? LOTE_W : 18).toFixed(2) + ' m', 'ct');
    const xb = -0.45;
    [[0, P.retiro], [P.retiro, g.fondo], [P.retiro + g.fondo, P.patio]].forEach(par => {
      const a = par[0], b = par[1];
      o += line(xb, a, xb, a + b, '#5D6459', 0.7);
      o += '<text x="' + (px(xb) - 6) + '" y="' + py(a + b / 2) +
        '" text-anchor="end" class="ct">' + b.toFixed(2) + '</text>';
    });
  }

  elPlan.setAttribute('viewBox', '0 0 ' + W + ' ' + Hgt);
  elPlan.innerHTML = o;
}

/* ------------------------------------------------------- cuadro de áreas */

function tabla() {
  const g = geo();
  let util = 0, rows = '';
  g.R.forEach(r => {
    const a = r.w * r.d;
    util += a;
    rows += '<tr><td>' + r.n + '</td><td class="n">' +
      r.w.toFixed(2) + ' × ' + r.d.toFixed(2) + '</td><td class="n">' + a.toFixed(2) + '</td></tr>';
  });

  const iw = LOTE_W - ME, id = g.fondo - 2 * ME;
  const neta = iw * id, bruta = LOTE_W * g.fondo;
  rows += '<tr><td>Tabiques internos</td><td class="n">—</td><td class="n">' + (neta - util).toFixed(2) + '</td></tr>';
  rows += '<tr><td>Área interior neta</td><td class="n">' + iw.toFixed(2) + ' × ' + id.toFixed(2) +
    '</td><td class="n">' + neta.toFixed(2) + '</td></tr>';
  rows += '<tr class="tot"><td>Área construida</td><td class="n">' + LOTE_W.toFixed(2) + ' × ' + g.fondo.toFixed(2) +
    '</td><td class="n">' + bruta.toFixed(2) + '</td></tr>';
  rows += '<tr><td>Patio trasero</td><td class="n">' + LOTE_W.toFixed(2) + ' × ' + P.patio.toFixed(2) +
    '</td><td class="n">' + (LOTE_W * P.patio).toFixed(2) + '</td></tr>';
  $('areas').innerHTML = rows;

  const d2 = g.R.find(r => r.k === 'd2');
  const pas = g.R.find(r => r.k === 'pas');
  const fos = bruta * 3 / TERRENO * 100;
  const bad = t => '<div class="flag">' + t + '</div>';
  const good = t => '<div class="flag ok">' + t + '</div>';
  let f = '';

  if (!g.cabe) {
    f += bad('Con retiro ' + P.retiro.toFixed(2) + ' m, patio ' + P.patio.toFixed(2) + ' m y zona social de ' +
      P.social.toFixed(2) + ' m ya no queda fondo para el baño y el segundo dormitorio: el programa no entra en ' +
      g.fondo.toFixed(2) + ' m de construcción. Reducí el patio o la zona social.');
  } else if (d2.d < 2.40) {
    f += bad('El dormitorio secundario queda en ' + (d2.w * d2.d).toFixed(2) + ' m² con ' + d2.d.toFixed(2) +
      ' m de fondo. Una cama de 1.90 ya no cabe con circulación. Subí el patio hacia abajo o reducí el fondo de la zona social.');
  } else if (d2.w * d2.d < 6.0) {
    f += bad('Dormitorio secundario en ' + (d2.w * d2.d).toFixed(2) +
      ' m². Por debajo de 6 m² es difícil de defender como dormitorio.');
  } else {
    f += good('Dormitorio secundario en ' + (d2.w * d2.d).toFixed(2) +
      ' m²: cabe cama, clóset y circulación de ' + (d2.w - 1.00 - 0.60).toFixed(2) + ' m.');
  }

  if (P.retiro < 2) {
    f += bad('Retiro frontal de ' + P.retiro.toFixed(2) + ' m y FOS de ' + fos.toFixed(1) +
      ' %. Varias zonas residenciales de Managua piden 2–3 m de retiro y máximo 60–70 % de ocupación. ' +
      'Confirmalo en la alcaldía antes de planos constructivos.');
  }

  if (pas.d * pas.w > 4.6) {
    f += bad('El pasillo se lleva ' + (pas.w * pas.d).toFixed(2) + ' m², ' +
      ((pas.w * pas.d) / neta * 100).toFixed(0) + ' % del interior. Es circulación que ya no se recupera.');
  }

  $('flags').innerHTML = f;

  $('cartela').innerHTML = [
    ['Fondo construido', g.fondo.toFixed(2) + ' m'],
    ['Construido total', (bruta * 3).toFixed(2) + ' m²'],
    ['Área libre', (TERRENO - bruta * 3).toFixed(2) + ' m²'],
    ['FOS', fos.toFixed(1) + ' %']
  ].map(par => '<div><dt>' + par[0] + '</dt><dd>' + par[1] + '</dd></div>').join('');
}

/* ----------------------------------------------------------------- 3D */

const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

let scene, cam, ren, root, cubo;
let az = -0.7, pol = 0.95, dist = 26;
let raf = null, estado3d = 'frio', sucio3d = true;
const materiales = new Map();

function cargarThree() {
  if (window.THREE) return Promise.resolve();
  return new Promise((ok, err) => {
    const s = document.createElement('script');
    s.src = THREE_URL;
    s.onload = () => window.THREE ? ok() : err(new Error('THREE no quedó definido'));
    s.onerror = () => err(new Error('no se pudo descargar three.js'));
    document.head.appendChild(s);
  });
}

function mat(col) {
  if (!materiales.has(col)) materiales.set(col, new THREE.MeshLambertMaterial({ color: col }));
  return materiales.get(col);
}

/* Una sola BoxGeometry unitaria escalada por instancia, y materiales cacheados:
   reconstruir el modelo en cada movimiento de slider ya no filtra memoria GPU. */
function box(x, y, w, d, h, col, yb) {
  if (w <= 0 || d <= 0 || h <= 0) return;   // escala negativa = caja invertida
  const m = new THREE.Mesh(cubo, mat(col));
  m.scale.set(w, h, d);
  m.position.set(x + w / 2, (yb || 0) + h / 2, y + d / 2);
  root.add(m);
}

function init3d() {
  const cv = $('c3d');
  ren = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
  ren.setPixelRatio(Math.min(devicePixelRatio, 2));
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xEEF0EA);
  cam = new THREE.PerspectiveCamera(38, 2, 0.1, 300);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xB8BCB2, 0.95));
  const dir = new THREE.DirectionalLight(0xffffff, 0.65);
  dir.position.set(8, 16, 6);
  scene.add(dir);
  cubo = new THREE.BoxGeometry(1, 1, 1);
  root = new THREE.Group();
  scene.add(root);

  let drag = false, lx = 0, ly = 0;
  cv.addEventListener('pointerdown', e => {
    drag = true; lx = e.clientX; ly = e.clientY;
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointerup', () => { drag = false; });
  cv.addEventListener('pointercancel', () => { drag = false; });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    az -= (e.clientX - lx) * 0.008;
    pol = Math.max(0.15, Math.min(1.45, pol - (e.clientY - ly) * 0.006));
    lx = e.clientX; ly = e.clientY;
  });
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    dist = Math.max(9, Math.min(48, dist + e.deltaY * 0.02));
  }, { passive: false });
}

function muroCorrido(o, fijo, a, b, huecos, th, col) {
  const tramo = (s, e) => {
    if (e - s <= 0.001) return;
    if (o === 'h') box(s, fijo, e - s, th, H, col);
    else box(fijo, s, th, e - s, H, col);
  };
  let c = a;
  huecos.slice().sort((p, q) => p[0] - q[0]).forEach(h => {
    const s = h[0], e = h[1], t = h[2];
    tramo(c, s);
    const antepecho = t === 'ventana' ? 1.00 : 0;   // alféizar de ventana
    if (antepecho > 0) {
      if (o === 'h') box(s, fijo, e - s, th, antepecho, col);
      else box(fijo, s, th, e - s, antepecho, col);
    }
    const dintel = H - 2.10;                        // dintel de puertas y ventanas
    if (o === 'h') box(s, fijo, e - s, th, dintel, col, 2.10);
    else box(fijo, s, th, e - s, dintel, col, 2.10);
    c = e;
  });
  tramo(c, b);
}

function build3d() {
  if (!root) return;
  for (let i = root.children.length - 1; i >= 0; i--) root.remove(root.children[i]);

  const g = geo();
  const COL = { muro: 0xD5D8CF, tab: 0xE2E4DC };
  const ZC = { social: 0xC8CFBE, humedo: 0xB6C9D0, privado: 0xD8C9B2, circ: 0xCFD3CA };
  const nU = 3, Y = P.retiro;

  for (let u = 0; u < nU; u++) {
    const off = u * LOTE_W;
    const fin = off + LOTE_W + (u === nU - 1 ? ME : 0);

    box(off, 0, LOTE_W, LOTE_D, 0.10, 0xC7CFBF, -0.10);
    g.R.forEach(r => box(off + r.x, Y + r.y, r.w, r.d, 0.04, ZC[r.z], 0.0));

    muroCorrido('h', Y, off, fin,
      frenteSegs(g.rx, g.rr).map(s => [off + s.a, off + s.b, s.t]), ME, COL.muro);
    muroCorrido('h', Y + g.fondo - ME, off, fin,
      fondoSegs(g.xD1, g.xPas, g.xRig).map(s => [off + s.a, off + s.b, s.t]), ME, COL.muro);

    box(off, Y, ME, g.fondo, H, COL.muro);
    if (u === nU - 1) box(off + LOTE_W, Y, ME, g.fondo, H, COL.muro);

    g.tabiques.forEach(t => {
      if (t.o === 'h') {
        muroCorrido('h', Y + t.y, off + t.x0, off + t.x1,
          t.huecos.map(h => [off + h[0], off + h[1], h[2]]), TA, COL.tab);
      } else {
        muroCorrido('v', off + t.x, Y + t.y0, Y + t.y1,
          t.huecos.map(h => [Y + h[0], Y + h[1], h[2]]), TA, COL.tab);
      }
    });
  }
  root.position.set(-9, 0, -5.5);
  sucio3d = false;
}

function loop() {
  raf = requestAnimationFrame(loop);
  const cv = $('c3d');
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return;                 // pestaña oculta: no hay nada que dibujar
  const dpr = ren.getPixelRatio();
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    ren.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  cam.position.set(
    Math.sin(az) * Math.cos(pol) * dist,
    Math.sin(pol) * dist,
    Math.cos(az) * Math.cos(pol) * dist
  );
  cam.lookAt(0, 1, 0);
  ren.render(scene, cam);
}

function pararLoop() {
  if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
}

function abrir3d() {
  if (estado3d === 'listo') {
    if (sucio3d) build3d();
    if (raf === null) loop();
    return;
  }
  if (estado3d === 'cargando' || estado3d === 'error') return;
  estado3d = 'cargando';
  cargarThree().then(() => {
    init3d();
    build3d();
    estado3d = 'listo';
    if (modo === '3d' && raf === null) loop();
  }).catch(e => {
    estado3d = 'error';
    const aviso = $('aviso3d');
    aviso.textContent = 'No se pudo cargar el visor 3D (' + e.message +
      '). La planta y el cuadro de áreas siguen funcionando sin conexión.';
    aviso.hidden = false;
    $('c3d').hidden = true;
  });
}

/* ------------------------------------------------------------ interacción */

function render() {
  svgPlan();
  tabla();
  sucio3d = true;
  if (modo === '3d' && estado3d === 'listo') build3d();
}

['retiro', 'patio', 'social', 'bano', 'pas'].forEach(k => {
  const el = $('s-' + k), out = $('v-' + k);
  el.addEventListener('input', () => {
    P[k] = parseFloat(el.value);
    out.textContent = P[k].toFixed(2) + ' m';
    render();
  });
});

[['t-cotas', 'cotas'], ['t-mob', 'mob'], ['t-zonas', 'zonas'], ['t-eje', 'eje']].forEach(par => {
  const b = $(par[0]), k = par[1];
  b.addEventListener('click', () => {
    L[k] = !L[k];
    b.setAttribute('aria-pressed', L[k]);
    svgPlan();
  });
});

const modos = { 'm-unidad': 'unidad', 'm-conjunto': 'conjunto', 'm-3d': '3d' };
Object.keys(modos).forEach(id => {
  $(id).addEventListener('click', () => {
    modo = modos[id];
    Object.keys(modos).forEach(i => $(i).setAttribute('aria-pressed', i === id));
    $('view2d').classList.toggle('on', modo !== '3d');
    $('view3d').classList.toggle('on', modo === '3d');
    if (modo === '3d') abrir3d();
    else { pararLoop(); svgPlan(); }
  });
});

$('reset').addEventListener('click', () => {
  Object.assign(P, DEFAULTS);
  Object.keys(DEFAULTS).forEach(k => {
    $('s-' + k).value = P[k];
    $('v-' + k).textContent = P[k].toFixed(2) + ' m';
  });
  render();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pararLoop();
  else if (modo === '3d' && estado3d === 'listo' && raf === null) loop();
});

render();
