"""Generate presentation metadata from the official 2026 first-turn polling places.
No election results or zone boundaries are modified.
"""
import csv, io, json, pathlib, zipfile, collections, hashlib

source = pathlib.Path('outputs/eleitorado-local-2026.zip')
groups = collections.defaultdict(collections.Counter)
seen = set()
generated = set()
rows = 0
with zipfile.ZipFile(source) as archive:
    for name in archive.namelist():
        if not name.endswith('.csv') or name.endswith(('_BRASIL.csv', '_ZZ.csv')):
            continue
        with io.TextIOWrapper(archive.open(name), encoding='cp1252', newline='') as stream:
            for row in csv.DictReader(stream, delimiter=';'):
                if row['NR_TURNO'] != '1' or row['CD_SITU_LOCAL_VOTACAO'] != '1' or row['CD_SITU_SECAO'] != '1':
                    continue
                identity = (row['SG_UF'].lower(), row['CD_MUNICIPIO'].zfill(5), row['NR_ZONA'].zfill(4))
                section = (*identity, row['NR_SECAO'])
                if section in seen:
                    continue
                seen.add(section)
                generated.add(row['DT_GERACAO'] + ' ' + row['HH_GERACAO'])
                rows += 1
                neighborhood = ' '.join(row['NM_BAIRRO'].strip().split())
                groups[identity]  # Keep even a zone without a usable neighborhood.
                if neighborhood and neighborhood not in ('#NULO#', '#NE#', '-1', '-3', 'NÃO INFORMADO'):
                    groups[identity][neighborhood] += max(0, int(row['QT_ELEITOR_ELEICAO_FEDERAL']))

labels, audit = {}, {}
for (uf, city, zone), counts in sorted(groups.items()):
    key = f'{uf}/{city}/{zone}'
    ranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    if ranked:
        labels[key] = ranked[0][0]
    audit[key] = ranked
metadata = {'source': 'https://dadosabertos.tse.jus.br/dataset/eleitorado-2026',
            'resource': 'https://cdn.tse.jus.br/estatistica/sead/odsele/eleitorado_locais_votacao/eleitorado_local_votacao_2026.zip',
            'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
            'generated': sorted(generated), 'turn': 1, 'sections': rows,
            'municipalities': len({(uf, city) for uf, city, zone in groups}),
            'zonesInMunicipalities': len(groups), 'labeled': len(labels),
            'states': sorted({uf for uf, city, zone in groups}),
            'criterion': 'Neighborhood of polling places with the most registered federal-election voters within each municipality/zone; no territorial boundary inferred.'}
pathlib.Path('data/geography/zone-neighborhoods.json').write_text(json.dumps(labels, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
pathlib.Path('data/geography/zone-neighborhoods-audit.json').write_text(json.dumps({'metadata': metadata, 'zones': audit}, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
print(json.dumps(metadata, ensure_ascii=True))
print('Joao Pessoa:', {k: v for k, v in labels.items() if k.startswith('pb/20516/')})
