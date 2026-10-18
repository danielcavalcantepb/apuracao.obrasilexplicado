# Proveniência

Arquivos públicos baixados diretamente de `https://resultados.tse.jus.br` durante a implementação em 04/10/2026. São amostras oficiais reais, mantidas somente para testes; o runtime não as importa.

| Arquivo local | Caminho oficial |
|---|---|
| ele-c.json | /oficial/comum/config/ele-c.json |
| municipalities.json | /oficial/ele2026/6257/config/mun-e006257-cm.json |
| president-br.json | /oficial/ele2026/6257/dados/br/br-c0001-e006257-u.json |
| president-pb.json | /oficial/ele2026/6257/dados/pb/pb-c0001-e006257-u.json |
| president-municipality.json | /oficial/ele2026/6257/dados/pb/pb20516-c0001-e006257-u.json |
| president-zz.json | /oficial/ele2026/6257/dados/zz/zz-c0001-e006257-u.json |
| president-locality.json | /oficial/ele2026/6257/dados/zz/zz29254-c0001-e006257-u.json |
| tracking-br.json | /oficial/ele2026/6257/dados/br/br-e006257-ab.json |
| tracking-pb.json | /oficial/ele2026/6257/dados/pb/pb-e006257-ab.json |

Todos esses caminhos retornaram HTTP 200. A amostra nacional tem geração em 03/10/2026 às 14:47:37, `and=n`, 0% totalizado e 12 candidaturas. O arquivo continua sendo consultado em runtime; estas amostras não pretendem representar a situação atual.

Os testes alteram cópias em memória para exercitar casos parciais, finais, inválidos e erros. Essas variações são dados de teste explicitamente isolados, nunca resultados apresentados ao público.

Documentação consultada: [página técnica oficial 2026](https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados), EA11, EA12, EA14, EA15, EA20 e instruções para download, todos nos links oficiais dessa página.
