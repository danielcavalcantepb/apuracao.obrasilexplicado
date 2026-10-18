# Navegação contínua do mapa

Implementação em 05/10/2026, preservando o cockpit e a infraestrutura TSE existente.

- Pan, wheel e pinch mantêm a navegação no mapa. Municípios surgem por nível de zoom, sem exigir seleção de UF. Somente seleções significativas entram na URL.
- Malhas municipais IBGE existentes são carregadas por UF visível, com timeout de 15 segundos. Path2D é compilado uma vez; índice espacial restringe desenho e hit testing. Hover usa bitmap base e destaca apenas o polígono consultado. Rótulos passam por seleção de prioridade e supressão de colisões.
- Seleção municipal anima o enquadramento e atualiza breadcrumb e painel direito. Movimento reduzido elimina a animação. Atualizações não reenquadram a seleção existente.
- Resultado municipal no hover usa a API já existente. Sem resultado, apresenta ausência de dados; nunca copia o resultado estadual para municípios.
- Adaptador adicional de zonas valida identidade EA20 antes de reutilizar a normalização eleitoral. Usa o cliente TSE compartilhado, catálogo oficial, cache, ETag e cooldown existentes. Um snapshot em disco é revalidado antes de ser exibido como último resultado recebido, quando não há valor disponível em memória.
- Zonas 1, 64, 70, 76 e 77 de João Pessoa têm resultados oficiais. Controles do mapa e lista lateral sincronizam hover e seleção. Link direto preserva município e zona.

## Limitação geográfica

Não foi obtida malha georreferenciada verificável dos limites intramunicipais das zonas. Os controles de zona são explicitamente não espaciais. Não representam polígonos, bairros, locais de votação ou limites inventados. Comparação de zonas com 2022 também não é apresentada.

## Verificação

Lint e typecheck aprovados; 56 testes unitários e 9 testes de navegador aprovados; build Next.js concluído. Navegador verificou zoom livre, hover de João Pessoa, seleção animada, zona 70, retorno a Paraíba/Brasil, movimento reduzido, toque, links diretos e retenção de mapa em 304/falhas.

Composição verificada em 1366×768, 1440×900 e 1920×1080: sem overflow horizontal; Brasil ocupa 87% da altura do canvas na visão nacional. Capturas em `outputs/cartographic-*.png` e `outputs/navigation-joao-pessoa-zona70.png`.

Benchmark em Edge headless, 1440×900, 120 frames durante pan/wheel após carregamento: 54,75 FPS, intervalo p95 66,7 ms, desenho máximo 4,7 ms, 2.487 polígonos visíveis. Medição local em desenvolvimento, não garantia de desempenho em outros dispositivos; há variação de frame e o resultado não sustenta promessa de 60 FPS constantes. Script reproduzível: `node scripts/verify-map-performance.mjs`; números em `outputs/map-navigation-performance.json`.

Fontes: documentação EA20 oficial de 2026 do TSE, catálogo eleitoral e arquivos `pb20516-zNNNN-c0001-e006257-u.json`. Nenhum resultado sintético foi usado na validação de navegador.
