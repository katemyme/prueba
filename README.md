# Conjunto de tres viviendas adosadas — 18 × 11 m

Generador paramétrico de planta para tres viviendas en hilera sobre un terreno de
198 m² (18 × 11 m). Mueve los cinco parámetros y la planta, el cuadro de áreas,
el FOS y el volumen 3D se recalculan en vivo.

Sitio estático puro: sin build, sin dependencias que instalar.

## Qué incluye

- **Planta 2D en SVG**, generada por código, en dos modos: vivienda tipo y
  conjunto 18 × 11 (la unidad central se dibuja espejada para que los ejes
  húmedos compartan medianera).
- **Cuadro de áreas** por ambiente, área interior neta, área construida y patio.
- **Chequeos de diseño** automáticos: fondo mínimo del dormitorio secundario,
  retiro frontal contra normativa, y proporción de superficie que se lleva el
  pasillo.
- **Volumen 3D** con three.js, cargado bajo demanda al abrir la pestaña.

## Parámetros

| Parámetro | Rango | Efecto |
|---|---|---|
| Retiro frontal | 0.60 – 2.00 m | Resta fondo construido |
| Patio trasero | 1.20 – 3.00 m | Resta fondo construido |
| Fondo zona social | 2.60 – 4.40 m | Lo que se le quita va a los dormitorios |
| Fondo del baño | 1.30 – 2.40 m | Resta fondo al dormitorio secundario |
| Ancho del pasillo | 0.90 – 1.30 m | Resta ancho a los dormitorios |

El fondo construido siempre es `11.00 − retiro − patio`.

## Estructura

```
index.html            marcado y controles
assets/styles.css     estilos
assets/plan.js        geometría, planta SVG, cuadro de áreas y 3D
test/smoke.js         prueba de humo sin dependencias
```

Toda la geometría sale de `geo()` en `assets/plan.js`. El resto —planta SVG,
tabla y modelo 3D— son tres lecturas distintas de esa misma estructura, así que
cualquier cambio de layout se hace en un solo lugar.

## Correr en local

No hace falta servidor, pero conviene usarlo para evitar restricciones de
`file://`:

```bash
python -m http.server 8080
# o
npx serve .
```

Luego abre <http://localhost:8080>.

## Pruebas

`test/smoke.js` corre `assets/plan.js` contra un DOM mínimo (sólo Node, sin
dependencias) y verifica que la planta, el cuadro de áreas y los modos no
produzcan `NaN` ni rectángulos de dimensión negativa, barriendo el producto
cruzado de los cinco parámetros:

```bash
node --check assets/plan.js
node test/smoke.js assets/plan.js
```

El workflow de deploy lo ejecuta antes de publicar.

## Deploy

El repositorio es un sitio estático en la raíz, así que funciona tal cual en
GitHub Pages, Netlify, Vercel o Cloudflare Pages sin configuración extra.

**GitHub Pages** (ya configurado): el workflow `.github/workflows/deploy.yml`
publica en cada push a `main`. Una sola vez, en el repo:
*Settings → Pages → Build and deployment → Source: **GitHub Actions***.

**Netlify / Vercel / Cloudflare Pages**: conecta el repo y deja el comando de
build vacío; el directorio de publicación es la raíz (`.`).

## Notas

- `three.js` se carga desde cdnjs sólo cuando se abre la pestaña 3D. Si no hay
  red, la planta y el cuadro de áreas siguen funcionando y aparece un aviso.
- Las fuentes vienen de Google Fonts; sin red cae al `system-ui` del equipo.
- Los chequeos normativos son orientativos y toman referencias de Managua.
  Confirmar retiros y FOS con la alcaldía antes de planos constructivos.

## Licencia

MIT — ver [LICENSE](LICENSE).
