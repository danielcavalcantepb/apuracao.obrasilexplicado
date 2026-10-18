# Malha do mapa eleitoral

Fonte: API pública de malhas geográficas do IBGE, qualidade mínima (malha simplificada oficial).

- Geometria: https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF&formato=application%2Fvnd.geo%2Bjson&qualidade=minima
- Nomes, siglas e macrorregiões: https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome
- Documentação: https://servicodados.ibge.gov.br/api/docs/malhas?versao=3

Arquivos baixados em 04/10/2026. A geometria tem 27 features. O script `scripts/generate-map.mjs` projeta os polígonos em coordenadas SVG e arredonda a duas casas; não inventa, amplia ou substitui territórios. Usa projeção equiretangular com correção na latitude central do conjunto. Pontos de siglas são calculados dentro do maior polígono; pequenas UFs recebem chamadas externas conectadas à sua posição real.

O resultado `src/features/election/map/geometry.json` é incorporado ao bundle. Não há requisições geográficas no runtime nem parsing de GeoJSON durante atualizações eleitorais. Para regenerar: `node scripts/generate-map.mjs`.
