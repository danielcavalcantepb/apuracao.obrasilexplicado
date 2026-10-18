# Primeiro carregamento

Esta rodada adiciona uma camada de entrada sem editar os componentes principais, o desenho final, o mapa interativo, o parser, as regras eleitorais, o histórico ou a infraestrutura de cache/TSE.

## Entrega inicial

`page.tsx` lê somente recursos já presentes no cache validado. Não aguarda a rede TSE. A leitura reutiliza `TseClient.restore`, sem escrita ou registro de uma observação nova. Os timestamps e votos do último resultado são preservados. A atualização continua pelas APIs e pelo polling existentes quando o cockpit monta.

O fallback de streaming tem a composição escura do cockpit: marca inline, busca, placar, mapa nacional neutro com a geometria IBGE já existente, regiões e área de atualizações. Valores ausentes são “—”. O fallback usa `boot-content`, evitando duplicar o identificador do conteúdo ativo durante o streaming.

Sem catálogo ou resultado, a camada de entrada busca as APIs existentes em paralelo. Uma resposta nacional válida aparece mesmo se o catálogo ainda não chegou. Cada pedido tem timeout de 15 segundos; uma tentativa sem dados é repetida após 15 segundos, com cleanup dos timers e cancelamento das requisições ao desmontar. A indisponibilidade mantém o shell e a mensagem “Aguardando primeiro resultado oficial disponível.”

O cockpit só monta com um catálogo válido, para preservar a validação de `state`, `municipality`, `zone` e `candidate` já existente. A busca digitada na entrada é transferida para a busca principal. Os botões de modos mantêm a seleção na URL; informações, compartilhamento e tela cheia têm ações durante a entrada.

## Apresentação

Regiões, gráfico, retratos e legenda têm espaços reservados durante a entrada. Um SVG neutro acompanha a mesma câmera do canvas; sua opacidade diminui em 220 ms quando os dados correspondentes aparecem. Ele não intercepta cliques, toques ou zoom. A pedido do usuário, percentuais e votos contam visualmente de zero até o valor oficial em 1,2 segundo na abertura. A camada visual tem aria-hidden; o texto acessível, snapshots e histórico permanecem oficiais. A interação interrompe a entrada, e atualizações posteriores não reiniciam a contagem.

Somente a apresentação do primeiro resultado sem cache usa opacidade, com entradas de 420 ms e atrasos de até 360 ms. `prefers-reduced-motion` elimina essas animações e transições. Somente a camada visual dos números de entrada é interpolada; nenhum snapshot ou histórico é interpolado. Movimento reduzido também desativa a contagem. Não há catch-up com valores inventados.

O relógio da entrada usa `America/Sao_Paulo`, assim como o relógio ao vivo existente. O horário do dado oficial permanece separado. Somente os dois retratos principais recebem preload; o logo é SVG inline, e a tipografia usa as fontes de sistema já configuradas.

## Validação reproduzível

- `tests/first-access.test.ts`: cache vazio, cache válido, timestamp preservado, corrupção rejeitada e ausência de chamada/escrita upstream no primeiro HTML.
- `tests/e2e/first-access.spec.ts`: retenção após falha da primeira atualização e navegação territorial sem bloqueio pela decoração de entrada.
- `outputs/first-access/verify.mjs`: build de produção em servidores isolados com e sem cache; 1366×768, 1440×900 e 390×844; reload; deep links de candidato, estado e município; busca durante sincronização; rede lenta; indisponibilidade com/sem cache; reduced motion.
- `outputs/first-access/metrics.json`: FCP, LCP, CLS, estimativas de shell/mapa/dado visíveis e marcas de interação.
- `outputs/first-access/videos/`: gravações dos cenários.

Os cenários controlados reutilizam uma resposta real capturada das APIs locais. As respostas eleitorais não são fabricadas. A rede lenta usa CDP com 1,6 Mbps de download e latência de 150 ms ou 300 ms. O cenário de atraso acrescenta 3 segundos às respostas de dados. Fotos e consultas opcionais são deliberadamente indisponíveis nos cenários controlados, verificando o fallback com dimensões reservadas.

As medidas são de laboratório local, com Edge headless e build de produção; não representam percentis de usuários da Vercel. Os tempos de shell e mapa são estimados por presença do DOM e limitados inferiormente pelo FCP. A marca interativa registra a montagem dos handlers; o teste de busca confirma a interação real. LCP continua sendo observado até o fim da captura, portanto o cenário de dados atrasados pode ter LCP tardio mesmo com shell já visível.

Os servidores de validação são desacoplados, ocultos e têm watchdog de 600 segundos. O navegador e os checks têm timeout finito. O servidor principal existente é preservado.

## Arquivos desta rodada

- `src/app/page.tsx` e `src/app/loading.tsx`: entrada por cache existente e fallback estrutural.
- `src/features/election/first-access/read-boot-cache.ts`, `boot-shell.tsx`, `first-access.tsx` e `first-access.css`: camada de entrada e reservas visuais.
- `tests/first-access.test.ts` e `tests/e2e/first-access.spec.ts`: verificações novas.
- `tests/e2e/dashboard.spec.ts` e `tests/e2e/editorial.spec.ts`: espera pelo painel hidratado após navegação/reload; as verificações originais permanecem.
- `docs/FIRST_LOAD_EXPERIENCE.md` e `outputs/first-access/`: estratégia, medidas, scripts, capturas e vídeos.

Nenhum arquivo dos componentes principais, da cartografia interativa ou de `src/lib/tse` foi editado nesta rodada.
