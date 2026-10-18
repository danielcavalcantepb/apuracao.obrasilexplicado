// Build-time only. Uses the downloaded IBGE geometry unchanged apart from projection/rounding.
import { readFile, writeFile } from 'node:fs/promises';
const geography = JSON.parse(await readFile('data/geography/br-ufs.geojson', 'utf8'));
const metadata = JSON.parse(await readFile('data/geography/ufs.json', 'utf8'));
if (geography.features.length !== 27 || metadata.length !== 27) throw new Error('Expected 27 UFs');
const polygons = (feature) =>
  feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;
const all = geography.features.flatMap((f) => polygons(f).flat(1).flat(1));
const latitudes = all.map((p) => p[1]);
const reference = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
const project = ([lon, lat]) => [lon * Math.cos((reference * Math.PI) / 180), -lat];
const projected = all.map(project);
const xmin = Math.min(...projected.map((p) => p[0])),
  xmax = Math.max(...projected.map((p) => p[0]));
const ymin = Math.min(...projected.map((p) => p[1])),
  ymax = Math.max(...projected.map((p) => p[1]));
const scale = Math.min(640 / (xmax - xmin), 630 / (ymax - ymin));
const screen = (p) => {
  const [x, y] = project(p);
  return [+(20 + (x - xmin) * scale).toFixed(2), +(20 + (y - ymin) * scale).toFixed(2)];
};
const area = (ring) =>
  Math.abs(
    ring.reduce((sum, p, i) => {
      const q = ring[(i + 1) % ring.length];
      return sum + p[0] * q[1] - q[0] * p[1];
    }, 0) / 2,
  );
const inside = (point, ring) => {
  let result = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      result = !result;
  }
  return result;
};
const distance = (p, a, b) => {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)),
  );
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
// Interior label point: choose the grid point furthest from the polygon boundary.
function labelPoint(ring) {
  const xs = ring.map((p) => p[0]),
    ys = ring.map((p) => p[1]);
  const loX = Math.min(...xs),
    hiX = Math.max(...xs),
    loY = Math.min(...ys),
    hiY = Math.max(...ys);
  let best = ring[0],
    radius = -1;
  for (let i = 0; i < 24; i++)
    for (let j = 0; j < 24; j++) {
      const p = [loX + ((hiX - loX) * (i + 0.5)) / 24, loY + ((hiY - loY) * (j + 0.5)) / 24];
      if (inside(p, ring)) {
        const d = Math.min(...ring.map((a, k) => distance(p, a, ring[(k + 1) % ring.length])));
        if (d > radius) {
          radius = d;
          best = p;
        }
      }
    }
  return best;
}
const shapes = geography.features
  .map((feature) => {
    const info = metadata.find((m) => String(m.id) === feature.properties.codarea);
    if (!info) throw new Error('Unknown UF');
    const rings = polygons(feature).map((poly) => poly.map((ring) => ring.map(screen)));
    const d = rings
      .flat(1)
      .map((ring) => ring.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join('') + 'Z')
      .join('');
    const largest = rings.map((poly) => poly[0]).sort((a, b) => area(b) - area(a))[0];
    return {
      uf: info.sigla.toLowerCase(),
      name: info.nome,
      region: info.regiao.nome,
      ibge: String(info.id),
      path: d,
      label: labelPoint(largest).map((v) => +v.toFixed(2)),
    };
  })
  .sort((a, b) => a.uf.localeCompare(b.uf));
const external = ['rn', 'pb', 'pe', 'al', 'se', 'es', 'rj'];
const callouts = shapes
  .filter((s) => external.includes(s.uf))
  .sort((a, b) => a.label[1] - b.label[1]);
let previousY = 0;
for (const s of callouts) {
  const y = Math.max(s.label[1], previousY + 36);
  s.callout = [710, +y.toFixed(2)];
  previousY = y;
}
const df = shapes.find((s) => s.uf === 'df');
df.callout = [+(df.label[0] - 46).toFixed(2), +(df.label[1] - 50).toFixed(2)];
await writeFile(
  'src/features/election/map/geometry.json',
  JSON.stringify({
    viewBox: '0 0 760 680',
    projection: 'Equirectangular with central-latitude correction',
    states: shapes,
  }),
);
await writeFile(
  'src/lib/tse/map-geography.json',
  JSON.stringify(shapes.map(({ uf, name, region }) => ({ uf, name, region }))),
);
console.log(
  `Generated ${shapes.length} independent SVG paths from IBGE (${reference.toFixed(2)}° reference latitude).`,
);
