# Cobertura dos resultados municipais

A revisão corrige a carga incompleta do mapa. O desenho municipal não usa resultados estaduais como substitutos: cada preenchimento continua ligado ao resultado real de seu código TSE.

## Causas e correção

- O polling não avançava para a próxima UF depois de falhas. O avanço agora acontece em `finally`, inclusive em respostas 304, preservando os resultados recebidos.
- O processo local anterior estava sem acesso à rede oficial. Foi reiniciado em background com acesso autorizado, sem restaurar ou descartar arquivos.
- Só eram consultados lotes de 24 municípios por UF, sem restaurar todo o cache persistido. A restauração agora valida os resultados existentes antes da consulta, e cada lote tem orçamento de 12 segundos além do timeout individual já existente.
- A carga nacional do cache roda independentemente do polling das UFs. Abrir outra sessão não reinicia a cobertura visual do zero.

## Dados e publicação

`scripts/collect-municipal-results.mjs` é uma coleta finita, com limite de 35 minutos, retomável pelo cache. Usa o mesmo `TseClient`, catálogo, normalizador, espaçamento de 250 ms e backoff do aplicativo. O progresso fica em `outputs/municipal-collection.json`.

`scripts/export-municipal-baseline.mjs` só exporta quando todos os resultados nacionais do catálogo têm respostas oficiais validadas. A cópia publicada em `data/tse/municipal-baseline.json` inclui origem, eleição, data de exportação e timestamps oficiais de cada resultado. É uma base de últimos dados conhecidos; consultas oficiais posteriores continuam prevalecendo. Não substitui o acompanhamento ao vivo.

Respostas municipais e frames completos usam gzip negociado, ETag por representação e streaming para respostas grandes sem gzip. Isso evita truncamento pelo limite de resposta da hospedagem e reduz a transferência no celular.

## Geometria

O catálogo nacional possui 5.571 localidades. A malha anterior tinha 5.570 e não incluía Boa Esperança do Norte. Mato Grosso passou a usar a [malha municipal oficial do IBGE de 2024](https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2024/UFs/MT/), incluindo os limites atualizados dos municípios vizinhos. A simplificação dessa UF usa tolerância de 0,01 grau; as demais mantêm a API v3 simplificada existente. Não há polígonos inventados nem sobreposição intencional de um município novo à malha antiga.

A auditoria `scripts/audit-municipal-geometry.mjs` confirma 5.571 associações TSE, 141.037 vértices e 3.168.707 bytes nos arquivos por UF.

## Verificação

Os testes de regressão verificam o avanço após 304/503, restauração de cache sem limpar backoff, rejeição de cache inválido e entrega integral das respostas comprimidas e em streaming. `scripts/verify-municipal-coverage.mjs` verifica cobertura completa e ausência de duplicatas nas 27 UFs, além das telas 1366×768, 1440×900 e 390×844.

Os relatórios e capturas ficam em `outputs/municipal-complete-validation.json` e `outputs/municipal-complete-*.png`.

Resultado final de 05/10/2026: 5.571 resultados recebidos, nenhuma duplicata, 27 UFs e nenhuma falha na coleta. Lint, TypeScript, 68 testes unitários, 12 cenários de navegador e build passaram. A conferência no [site publicado](https://resultados-brasil-2026.vercel.app/?view=municipalities) confirmou a cobertura integral nas três resoluções, com os painéis regionais carregados e sem erros JavaScript. A base publicada aceita o offset `-03:00` dos timestamps oficiais; o teste dessa base completa impede regressão nessa validação.
