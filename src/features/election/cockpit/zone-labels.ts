import neighborhoods from '../../../../data/geography/zone-neighborhoods.json';
import { editorialName } from './editorial-name';
// Presentation metadata from official 2026 polling places; results remain by zone.
// UF + municipality + zone prevents mixing municipalities sharing an electoral zone.
export const zoneNeighborhoodSource = 'https://dadosabertos.tse.jus.br/dataset/eleitorado-2026';
const labels: Record<string, string> = neighborhoods;
export function zoneNeighborhood(uf: string, municipality: string, zone: string) {
  const name = labels[`${uf.toLowerCase()}/${municipality}/${zone.padStart(4, '0')}`];
  return name ? editorialName(name).replace(/\bBancarios\b/g, 'Bancários') : undefined;
}
export function zoneLabel(uf: string, municipality: string, zone: string) {
  return zoneNeighborhood(uf, municipality, zone) ?? `Zona ${Number(zone)}`;
}
