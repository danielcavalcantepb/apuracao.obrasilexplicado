# Homepage presidencial — evolução de 04/10/2026

## Inventário e decisões

O projeto existente usa Next.js App Router, React e TypeScript. Os contratos TSE são validados por Zod em `schemas.ts` e normalizados em `normalizers.ts`. Configuração/catálogo descobrem a eleição presidencial, UFs, municípios e exterior. O `TseClient` coordena ETag/Last-Modified, single-flight, espaçamento, backoff e proteção contra gerações mais antigas. `FileBackedCache` mantém o último arquivo válido em memória e disco. Nenhum desses mecanismos foi substituído.

APIs mantidas: `/api/election/president` com filtros oficiais, `/api/election/geography`, `/api/election/photo/[id]`, `/api/election/president/map`. Nova API: `/api/election/president/history`. O mapa já incorporava as 27 geometrias reais do IBGE; a geometria, projeção e geração permanecem as mesmas. As cores partidárias compartilhadas e as fotos coloridas foram preservadas.

A referência conceitual foi a consulta rápida solicitada: dados presidenciais primeiro. O hero institucional saiu da homepage. Não há outros cargos, números fabricados ou previsão.

## Arquivos criados

- `src/lib/tse/analysis.ts`: análise consistente dos votos válidos.
- `src/lib/tse/history.ts`: registro e restauração das observações nacionais.
- `src/app/api/election/president/history/route.ts`: histórico com ETag/304.
- `src/features/election/use-election.ts`: polling reutilizável com retenção por abrangência.
- `src/features/election/candidate-list.tsx`: candidatos reutilizáveis, destaque aos dois primeiros.
- `src/features/election/state-results.tsx`: tabela/cards das UFs, ordenação e filtros regionais.
- `src/features/election/history-chart.tsx`: SVG temporal e consulta acessível das observações.
- `src/features/election/editorial.css`: camada visual incremental da homepage.
- `tests/editorial.test.ts`, `tests/e2e/editorial.spec.ts` e este relatório.

## Arquivos modificados

- `src/features/election/dashboard.tsx`: composição e detalhamento.
- `src/features/election/map/election-map.tsx`: compartilha o mesmo snapshot com a tabela; regiões comparáveis, peso eleitoral e método.
- `src/lib/tse/map-types.ts`, `map-normalizers.ts`: campos estaduais de votos válidos/eleitores aptos e peso regional.
- `src/lib/tse/types.ts`, `client.ts`, `service.ts`: análise adicional e horário da tentativa real; registro do nacional.
- `src/app/api/election/president/route.ts`: headers de telemetria também em 304, sem alterar o ETag eleitoral.
- `tests/e2e/dashboard.spec.ts`: texto do novo status, preservando os cenários de erro, finalização, filtros e mobile.
- `README.md`: referência à entrega.

## Estrutura final

Header compacto → totalização nacional → dois primeiros candidatos → leitura dos 50% → demais candidaturas → mapa → cinco regiões → 27 estados → evolução observada → consulta Exterior/Brasil → detalhamento estadual/municipal → transparência → rodapé independente.

Nacional permanece visível e atualizando mesmo ao selecionar uma localidade. Município fica no detalhamento, sem selects no bloco principal. Exterior continua usando os códigos oficiais do catálogo e fica fora do mapa e das cinco regiões.

## Mapa e estados

O SVG local usa a liderança por votos absolutos do agregado existente. Zero/empate/ausência continuam neutros; os últimos resultados válidos permanecem durante erros. Hover, foco, teclado e toque mostram o painel de detalhes com os dois primeiros, margem, totalização e horário da UF. Estados pequenos mantêm chamadas e botões de 44 px.

Uma única consulta do navegador ao agregado atualiza mapa, regiões e tabela. A tabela não faz consultas individuais ao TSE. Há filtros das cinco regiões e ordenação por nome, totalização, diferença e percentual do líder, em ambos os sentidos; ausências ficam no fim. Desktop usa tabela semântica; mobile reorganiza as mesmas células em cards compactos, preservando nomes e percentuais.

## Regiões e peso eleitoral

Percentuais regionais: soma dos votos absolutos destinados a `Válido` dividida pela soma de `v.vv` das UFs. Não há média de percentuais. Uma UF ausente, destino desconhecido positivo ou denominador inconsistente suspende o cálculo. Totalização regional soma seções totalizadas e totais antes de dividir.

Peso eleitoral: soma dos **eleitores aptos** das UFs da região dividida pelos **eleitores aptos nacionais**. O denominador nacional inclui exterior; por isso os cinco pesos podem somar menos de 100%. Se qualquer total necessário estiver ausente, o campo fica indisponível. Não usa comparecimento, votos ou percentual apurado. A definição aparece no tooltip e em texto visível, acessível no mobile e por teclado.

## Maioria absoluta

O backend valida a soma dos votos válidos dos candidatos contra `v.vv`, excluindo anulados e rejeitando destinos desconhecidos positivos. Só então entrega `analysis`. O indicador usa esse percentual, sem reinterpretar o `pvap` oficial das candidaturas. Distância: percentual atual − 50, em pontos percentuais. A linha de 50% é discreta, em uma barra própria de votos válidos; zero/votos inconsistentes mostram espera. O texto explica que é necessário **mais de** 50%, sem declarar eleição ou probabilidade. O resultado oficial/status de cada candidatura continua separado.

## Histórico real

Antes desta mudança só havia o último arquivo válido por URL. Não foi reconstruído histórico passado a partir de estimativas. A primeira observação é o snapshot nacional válido disponível ao iniciar o registro; as seguintes chegam pelo mesmo `president()` utilizado pelo painel e pelo mapa.

O arquivo `president-history.jsonl` fica em `TSE_CACHE_DIR`. Escritas são serializadas, versões repetidas são ignoradas e novos horários sem mudança eleitoral não produzem observações. Só Brasil presidencial entra; estados/exterior/municípios não entram. Apenas resultados com denominador de votos válidos consistente são registrados. Arquivos anteriores do cache não são modificados. A restauração valida cada linha com Zod; uma linha danificada não apaga as demais. Falha de escrita mantém observações em memória e informa a limitação.

O gráfico usa SVG leve, duas séries dos candidatos atualmente com mais votos válidos, eixo X pelo horário oficial e eixo Y pelo percentual válido. A escala vertical ampliada e seus limites são explicitamente indicados. Não há extrapolação. Seleção de observação e tabela fornecem os valores exatos por texto/teclado/toque. Com menos de duas observações, informa a insuficiência em vez de fabricar gráfico. `/history` não consulta o TSE; tem ETag/304 e polling de 15 segundos, pausado em aba oculta.

## Horários e erros

Horário oficial: `totaledAt ?? generatedAt`. Consulta bem-sucedida: `checkedAt` existente. Tentativa: `attemptedAt`, atualizado imediatamente antes do HTTP real, inclusive em falhas. Leituras só do cache/backoff não contam como nova tentativa. 304 pode atualizar a telemetria de consulta; não altera o horário oficial, votos ou histórico. O ETag eleitoral não inclui os relógios de telemetria. Os headers `X-TSE-Checked-At` e `X-TSE-Attempted-At` entregam esses valores em 200 e 304.

Quando há atraso ou erro, o painel sinaliza o último dado válido preservado, conserva votos e horários e segue o backoff. O mapa e os detalhes respeitam os snapshots da respectiva abrangência. Nacional não troca por um município. Os dados não são zerados e fixtures não são servidas em produção.

## Validação e limitações

Os testes unitários originais permanecem. Foram acrescentados cenários de 50,74%, 48,40% e exatamente 50%, denominadores inconsistentes, peso por eleitores aptos, deduplicação/restauração do histórico e tentativa versus consulta bem-sucedida. Navegador cobre os fluxos anteriores e acrescenta resultado acima da dobra, cinco regiões, 27 UFs, ordenação, filtro Nordeste, gráfico/seleção de observação, telemetria 304 e indisponibilidade preservando resultado.

Capturas nas larguras 375, 390, 430, 768, 1024, 1280 e 1440 em `outputs/editorial-{top,regions,states,history}-{largura}.png`. Dados sintéticos só aparecem nas interceptações dos testes; capturas de layout usam os dados oficiais recebidos.

**Hospedagem atual:** Vercel usa `/tmp`, disco temporário por instância. O histórico pode recomeçar após reciclagem, e múltiplas instâncias não têm histórico/cache/lock compartilhados. A interface sinaliza essa limitação. Em um processo Node com volume persistente, o registro sobrevive a reinícios. Para continuidade global em produção, é necessário armazenamento durável compartilhado e coordenação distribuída; não foi provisionada infraestrutura nova ou banco pago sem necessidade/autorização específica. O registro sob demanda observa publicações quando há consultas; não promete capturar cada publicação do TSE durante períodos sem acesso.

Resultados finais: lint aprovado; typecheck aprovado; 50 testes unitários aprovados; 7 testes de navegador aprovados; build de produção local e Vercel aprovados. Publicado em https://resultados-brasil-2026.vercel.app (deployment dpl_8HQXyn9NSDz7uny7M432ykrannUw).
