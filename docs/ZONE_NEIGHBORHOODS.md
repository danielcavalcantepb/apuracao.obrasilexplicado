# Bairros de referência das zonas

Fonte: [Eleitorado por local de votação — TSE, 2026](https://dadosabertos.tse.jus.br/dataset/eleitorado-2026). Extração oficial: 04/10/2026 às 06:27:35. Dados do primeiro turno, apenas seções e locais ativos, sem duplicar seções.

Cobertura: 27 UFs, 5.571 municípios e 6.106 pares município/zona, todos com bairro informado. Conferência com o catálogo eleitoral usado pela aplicação: nenhuma zona doméstica sem associação.

Para cada UF, município e zona, somam-se os eleitores aptos à eleição federal das seções por bairro do local de votação. O bairro com maior soma é a referência exibida; empates são resolvidos por nome em ordem alfabética. O número da zona permanece visível. Não se trata de voto por bairro nem de limite territorial: os resultados eleitorais continuam sendo da zona inteira.

O catálogo compacto tem cerca de 167 KB, fica junto da aplicação e não exige consultas adicionais ao TSE durante a navegação. O arquivo de auditoria preserva todos os bairros e seus quantitativos, o endereço da fonte e SHA-256 do ZIP. Ambos são gerados por `scripts/build-zone-neighborhoods.py`, a partir de `outputs/eleitorado-local-2026.zip`. A rotina não altera o coletor, os resultados, o histórico nem a geometria eleitoral.

Identidades inexistentes continuam como “Zona N”; nomes de outra cidade ou UF nunca são reutilizados. A grafia original permanece no catálogo; a apresentação aplica capitalização e acentuação de “Bancários”.
