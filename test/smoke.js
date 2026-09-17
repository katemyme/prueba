/* Corre assets/plan.js contra un DOM mínimo y comprueba invariantes. */
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync(process.argv[2], 'utf8');

const store = {};
function mkEl(id) {
  return {
    id, innerHTML: '', textContent: '', value: '', hidden: false, width: 0, height: 0,
    clientWidth: 0, clientHeight: 0, style: {}, children: [],
    attrs: {}, handlers: {},
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k]; },
    addEventListener(t, f) { (this.handlers[t] ||= []).push(f); },
    classList: { toggle() {}, add() {}, remove() {} },
    appendChild() {}
  };
}
const document = {
  hidden: false,
  getElementById: id => (store[id] ||= mkEl(id)),
  createElement: t => mkEl(t),
  addEventListener() {},
  head: { appendChild() {} }
};
const ctx = {
  document, window: {}, console,
  devicePixelRatio: 1,
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  Promise, Map, Math, Object, Array, Number, JSON
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(src, ctx, { filename: 'plan.js' });

let fallos = 0;
const ok = (cond, msg) => { console.log((cond ? '  PASS  ' : '  FAIL  ') + msg); if (!cond) fallos++; };

const svg = store['plan'].innerHTML;
const viewBox = store['plan'].attrs.viewBox;
const areas = store['areas'].innerHTML;
const cartela = store['cartela'].innerHTML;
const flags = store['flags'].innerHTML;

console.log('\n-- valores por defecto (vivienda tipo) --');
ok(svg.length > 2000, 'la planta SVG se generó (' + svg.length + ' chars)');
ok(/^0 0 \d/.test(viewBox) && !/NaN/.test(viewBox), 'viewBox válido: ' + viewBox);
ok(!/NaN|undefined|Infinity/.test(svg), 'el SVG no contiene NaN/undefined');
ok(!/NaN|undefined/.test(areas), 'el cuadro de áreas no contiene NaN/undefined');
ok(!/NaN|undefined/.test(cartela), 'la cartela no contiene NaN/undefined');
ok(/Dorm\. secundario/.test(areas), 'los 7 ambientes aparecen en la tabla');
ok((areas.match(/<tr/g) || []).length === 11, 'la tabla trae 11 filas');
ok(flags.includes('flag'), 'los chequeos de diseño emiten al menos un aviso');

// Suma de ambientes <= área interior neta (los tabiques ocupan la diferencia).
const nums = [...areas.matchAll(/<td class="n">([\d.]+)<\/td>/g)].map(m => parseFloat(m[1]));
console.log('\n-- coherencia de áreas --');
const filas = [...areas.matchAll(/<tr[^>]*><td>([^<]+)<\/td><td class="n">([^<]*)<\/td><td class="n">([\d.]+)<\/td>/g)];
const por = Object.fromEntries(filas.map(f => [f[1], parseFloat(f[3])]));
const sumaAmbientes = ['Sala', 'Comedor', 'Cocina', 'Dorm. principal', 'Pasillo', 'Baño', 'Dorm. secundario']
  .reduce((a, k) => a + por[k], 0);
ok(Math.abs(sumaAmbientes + por['Tabiques internos'] - por['Área interior neta']) < 0.01,
  'ambientes + tabiques = área interior neta (' + sumaAmbientes.toFixed(2) + ' + ' +
  por['Tabiques internos'].toFixed(2) + ' = ' + por['Área interior neta'].toFixed(2) + ')');
ok(por['Tabiques internos'] > 0, 'el área de tabiques es positiva');
ok(por['Área construida'] > por['Área interior neta'], 'construida > interior neta');
const fos = parseFloat(cartela.match(/<dd>([\d.]+) %<\/dd>/)[1]);
ok(Math.abs(fos - por['Área construida'] * 3 / 198 * 100) < 0.1, 'FOS coherente: ' + fos.toFixed(1) + ' %');

console.log('\n-- barrido de los 5 sliders en todo su rango --');
const rangos = {
  retiro: [0.6, 2.0, 0.1], patio: [1.2, 3.0, 0.1], social: [2.6, 4.4, 0.05],
  bano: [1.3, 2.4, 0.05], pas: [0.9, 1.3, 0.05]
};
let combos = 0, peor = null;
for (const [k, [lo, hi, st]] of Object.entries(rangos)) {
  for (let v = lo; v <= hi + 1e-9; v += st) {
    const el = store['s-' + k];
    el.value = String(v);
    el.handlers.input[0]();
    combos++;
    const s = store['plan'].innerHTML;
    if (/NaN|undefined|Infinity/.test(s) || /NaN/.test(store['plan'].attrs.viewBox)) peor = k + '=' + v;
    if (/NaN|undefined/.test(store['areas'].innerHTML)) peor = k + '=' + v + ' (tabla)';
  }
  // volver al valor base antes del siguiente parámetro
  store['reset'].handlers.click[0]();
}
ok(peor === null, combos + ' combinaciones de slider sin NaN/undefined' + (peor ? ' — falló en ' + peor : ''));

console.log('\n-- producto cruzado: ningún rect con dimensión negativa --');
const negativos = /(?:width|height)="-/;
const set = (k, v) => { store['s-' + k].value = String(v); store['s-' + k].handlers.input[0](); };
let n = 0, malos = [];
for (let re = 0.6; re <= 2.0 + 1e-9; re += 0.1) {
  for (let pa = 1.2; pa <= 3.0 + 1e-9; pa += 0.1) {
    for (const so of [2.6, 3.5, 4.4]) {
      for (const ba of [1.3, 2.4]) {
        for (const ps of [0.9, 1.3]) {
          set('retiro', re); set('patio', pa); set('social', so); set('bano', ba); set('pas', ps);
          n++;
          const s = store['plan'].innerHTML;
          if (negativos.test(s) || /NaN|undefined|Infinity/.test(s) ||
              /NaN|undefined|-\d/.test(store['areas'].innerHTML)) {
            if (malos.length < 5) malos.push([re.toFixed(1), pa.toFixed(1), so, ba, ps].join('/'));
          }
        }
      }
    }
  }
}
ok(malos.length === 0, n + ' combinaciones sin dimensiones negativas' +
  (malos.length ? ' — falla en retiro/patio/social/bano/pas = ' + malos.join(', ') : ''));

console.log('\n-- caso límite: el programa no entra (retiro 2.0 + patio 3.0 + social 4.4) --');
set('retiro', 2); set('patio', 3); set('social', 4.4); set('bano', 1.6); set('pas', 0.9);
ok(!negativos.test(store['plan'].innerHTML), 'la planta no emite rects invertidos con fondo 6.00 m');
ok(/no entra en/.test(store['flags'].innerHTML), 'avisa explícitamente que el programa no entra');
console.log('  info  avisos: ' + (store['flags'].innerHTML.match(/class="flag[ "]/g) || []).length);
store['reset'].handlers.click[0]();

console.log('\n-- modos conjunto / 3D --');
store['m-conjunto'].handlers.click[0]();
const conj = store['plan'].innerHTML;
ok(conj.length > svg.length * 1.5, 'el modo conjunto dibuja las 3 unidades (' + conj.length + ' chars)');
ok(!/NaN|undefined/.test(conj), 'el conjunto no contiene NaN/undefined');
ok(store['m-conjunto'].attrs['aria-pressed'] === 'true' && store['m-unidad'].attrs['aria-pressed'] === 'false',
  'aria-pressed se mueve entre pestañas');
store['m-3d'].handlers.click[0]();
ok(store['m-3d'].attrs['aria-pressed'] === 'true', 'la pestaña 3D queda activa sin lanzar excepción');

console.log('\n-- capas --');
store['m-unidad'].handlers.click[0]();
const antes = store['plan'].innerHTML.length;
store['t-zonas'].handlers.click[0]();
ok(store['plan'].innerHTML.includes('#E4E7E0'), 'apagar Zonas cambia el relleno a neutro');
store['t-zonas'].handlers.click[0]();
store['t-cotas'].handlers.click[0]();
ok(store['plan'].innerHTML.length < antes, 'apagar Cotas reduce el dibujo');
store['t-cotas'].handlers.click[0]();
ok(store['plan'].innerHTML.length === antes, 'volver a encender Cotas restituye el dibujo');

console.log('\n' + (fallos === 0 ? 'TODO OK' : fallos + ' FALLOS'));
process.exit(fallos === 0 ? 0 : 1);
