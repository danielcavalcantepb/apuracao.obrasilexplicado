# Refinamento visual — 5 de outubro de 2026

Todos os arquivos existentes foram preservados. O repositório permanece sem arquivos rastreados; git diff --stat não representa as alterações locais.

O bloqueio anterior ocorreu em diagnósticos de rede/processos, não no refinamento. O servidor foi iniciado em background, com logs em outputs/dev-background.log. Nenhum watcher foi executado em foreground nesta retomada.

A central mantém três colunas, mapa central, placar e gráfico à esquerda, regiões/contexto/feed à direita e timeline inferior. Ajustes: gráfico inteiro em 1366×768, feed com rolagem própria, identificação dos líderes regionais, fallback compacto das fotos, aviso sobreposto sem redimensionar o mapa e nome correto das localidades do exterior. A infraestrutura TSE não foi alterada nesta retomada.

Verificação visual: 1366×768 e 1440×900, sem overflow horizontal e sem cortes do gráfico/timeline. Capturas: outputs/refined-1366x768.png e outputs/refined-1440x900.png. Organização comparada à descrição e referências disponíveis; não constitui comparação pixel a pixel com uma referência escura adicional.

Validação: lint sem erros/avisos; TypeScript aprovado; 50 testes unitários e 7 testes de navegador aprovados; build de produção aprovado. Navegador também validou nove larguras, filtros, exterior, busca, deep links, replay, 304, indisponibilidade e preservação do zoom.

Limitação observada na prévia headless: fotos não recebidas exibem iniciais. O componente mantém a imagem original colorida quando a rota de fotos responde. Esta retomada não publicou a nova central no endereço público.
