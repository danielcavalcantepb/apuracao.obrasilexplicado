# Design system editorial

Revisão de apresentação em 05/10/2026. Dados eleitorais, consultas TSE, cache, histórico, rotas e regras de navegação permanecem preservados.

`src/features/election/cockpit/design-tokens.css` centraliza as cores, superfícies, bordas, fontes, espaçamento, raios e tratamento cartográfico. Os estilos do cockpit não contêm cores hexadecimais fora desse arquivo. `editorial.css` organiza a apresentação editorial sobre os estilos e breakpoints existentes.

- Canvas neutro `#0B0B0A`, painéis `#121210`, raio 13 px e bordas discretas.
- Georgia para títulos narrativos e territórios; Arial para números, controles e metadados. Fontes locais, sem download ou pacote novo.
- Caixa editorial aplicada somente ao texto exibido. Nomes e identificadores oficiais não são modificados.
- Placar com retratos de 48–52 px, percentuais maiores, barra contínua de 5 px e marcador central.
- Modos em pills de 31 px no desktop e 44 px no celular. Timeline com trilho de 2 px e indicador ao vivo pontual.
- Feed usa os percentuais realmente registrados nos momentos históricos existentes; a apresentação deixa de usar a expressão técnica “observação geográfica”.
- Canvas lê os mesmos tokens da interface para cor de fundo, traços, rótulos e variantes de cor. Cores de partido nos dados originais são preservadas; apenas o tratamento de exibição muda.
- Fotos continuam coloridas, sem grayscale. Quando o endpoint existente está indisponível, preserva-se seu fallback de iniciais; nenhuma fonte ou política TSE foi alterada para produzir screenshots.

## Validação

Auditoria do estilo computado em 1366×768, 1440×900, 1920×1080 e 390×844: canvas RGB 11/11/10; painel RGB 18/18/16; raio 13 px; Georgia nos títulos e Arial nos números; sem overflow horizontal. Visão nacional mantém Brasil com 87% da altura do canvas.

Lint, typecheck, 56 testes unitários e build aprovados. Os sete cenários de dashboard/composição/mapa passaram; a execução combinada atingiu seu timeout antes dos dois cenários finais. Os dois testes de navegação foram executados separadamente e passaram. Expectativas de nomes nos testes foram atualizadas para caixa editorial, mantendo as verificações de identidade, seleção e resultado.

Capturas: `outputs/design-system-{1366x768,1440x900,1920x1080,390x844}.png`. Comparação lado a lado com a referência escura fornecida e implementação anterior: `outputs/design-system-comparison.html`. Auditoria reproduzível: `node scripts/verify-editorial-design.mjs` (timeout global 45 segundos).

O material disponível é a screenshot da referência; não houve acesso ao arquivo de vídeo original nesta rodada. A referência é usada para neutralidade, contraste tipográfico e tratamento de superfícies, sem copiar branding ou atribuir seus limites de zonas à malha oficial.
