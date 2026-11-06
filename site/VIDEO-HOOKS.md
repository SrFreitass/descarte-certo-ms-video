# Ganchos para gravação de vídeo

Todos os elementos abaixo têm o atributo `data-video="..."`. Seletor: `[data-video="chip-pilhas"]`.

## Parâmetros de URL

| Parâmetro | Efeito |
|---|---|
| `?capture=1` | Desliga transições e rolagem suave. Os links internos passam a levar `capture=1` junto, então o modo continua ao navegar. |
| `?reset=1` | Volta a gaveta ao estado inicial (celular, pilhas e cabos marcados). Depois de aplicado, o `reset` sai da URL, então recarregar a página não apaga a gaveta de novo. |
| `pontos.html?item=pilha` | Abre a busca já filtrada. Valores: `celular`, `pilha`, `computador`, `tv`, `cabos`, `lampada`. |
| `pontos.html?bairro=Moreninha` | Abre a busca filtrada pelo bairro (nome exato do bairro). |
| `pontos.html?ponto=6` | Abre a busca com o ponto 6 já selecionado. Pode ser combinado: `?item=lampada&ponto=6&capture=1`. |

Sem parâmetros, a busca começa com "Celular e tablet" e "Todos os bairros" (igual ao original). Os filtros da busca não ficam salvos. Só a gaveta fica salva, em `localStorage`, na chave `descarte-certo-ms-gaveta`.

## Em todas as páginas (cabeçalho)

| data-video | Elemento |
|---|---|
| `logo` | Marca "Descarte Certo MS" (vai para o início) |
| `menu` | Botão "Menu" (só aparece em telas de até 960px; `aria-expanded` muda) |
| `nav-inicio` | Link Início |
| `nav-pontos` | Link Pontos de coleta |
| `nav-como-descartar` | Link Como descartar |
| `nav-gaveta` | Link Gaveta |
| `nav-por-que-importa` | Link Por que importa |
| `nav-estudos` | Link Estudos |

A página atual tem `aria-current="page"` e fica com fundo verde.

## Modal do mapa (pontos.html e gaveta.html)

| data-video | Elemento |
|---|---|
| `modal-fundo` | Fundo escuro (clicar nele fecha o modal) |
| `modal` | A caixa do modal (`role="dialog"`) |
| `modal-fechar` | Botão X |
| `modal-titulo` | Nome do ponto |
| `modal-mapa` | iframe do Google Maps |
| `modal-abrir-google` | Botão "Abrir no Google Maps" (abre em nova aba) |

Enquanto o modal está aberto, `<html>` recebe `data-modal="aberto"`. O modal fecha com Esc, com clique fora da caixa ou com o X.

## index.html

| data-video | Elemento |
|---|---|
| `cta-pontos` | Botão "Encontrar um ponto" |
| `cta-gaveta` | Botão "Montar minha gaveta" |
| `previa-gaveta` | Cartão "Exemplo da gaveta", à direita do título |
| `previa-montar` | Link "Montar a minha gaveta" dentro do cartão |
| `card-pontos`, `card-como-descartar`, `card-gaveta`, `card-por-que-importa`, `card-estudos` | Cartões de "Explore o guia" |
| `aviso` | Aviso "Confirme antes de ir" |

## pontos.html

| data-video | Elemento |
|---|---|
| `chip-celular`, `chip-pilhas`, `chip-computador`, `chip-tv`, `chip-cabos`, `chip-lampada` | Filtros por item (`aria-pressed="true"` no ativo) |
| `bairro` | Seleção de bairro (`<select>`) |
| `contagem` | Texto "N pontos encontrados para ..." |
| `lista-pontos` | Lista de resultados |
| `ponto-1` … `ponto-7` | Cada ponto da lista (`aria-pressed="true"` no selecionado). Só existe se o ponto passar no filtro atual. |
| `lista-vazia` | Mensagem quando nenhum ponto aceita o item no bairro escolhido |
| `ponto-detalhe` | Cartão "Ponto selecionado" (`data-state="vazio"` ou `"selecionado"`) |
| `abrir-mapa` | Botão "Ver no mapa e detalhes" no cartão do ponto, que abre o modal |
| `guia-item` | Painel "Como descartar: ...", que muda com o filtro (`data-item` = slug do item) |
| `guia-completo` | Link "Ver o guia completo" |
| `aviso` | Aviso "Confirme antes de ir" |

Quais pontos aparecem em cada filtro (todos os bairros):

- celular, computador, cabos: pontos 1 a 7
- tv: pontos 1 a 6
- pilhas: pontos 6 e 7
- lâmpadas: só o ponto 6

Em 1920x1080 a lista começa perto da dobra. Para mostrar `ponto-2`, role a página antes, por exemplo com `scrollIntoView({block: "center"})`. No celular (largura até 960px), escolher um ponto rola a página até o cartão de detalhe.

## como-descartar.html

| data-video | Elemento |
|---|---|
| `salto-celular`, `salto-pilhas`, `salto-computador`, `salto-tv`, `salto-cabos`, `salto-lampada` | Atalhos fixos no topo (âncoras `#celular`, `#pilha`, `#computador`, `#tv`, `#cabos`, `#lampada`) |
| `guia-celular` … `guia-lampada` | Cartão de cada tipo de item (o cartão da âncora atual fica com contorno verde) |
| `guia-pontos-celular` … `guia-pontos-lampada` | Botão "Ver pontos" de cada cartão (abre `pontos.html?item=...`) |

## gaveta.html

| data-video | Elemento |
|---|---|
| `tile-celular`, `tile-pilhas`, `tile-computador`, `tile-tv`, `tile-cabos`, `tile-lampada` | Cartões dos itens (`aria-pressed="true"` = marcado) |
| `gaveta-contador` | "N de 6 selecionados" |
| `gaveta-todos` | "Selecionar tudo" |
| `gaveta-limpar` | "Limpar" |
| `plano` | Área do plano (`data-paradas` = número de paradas, `0` quando vazio) |
| `plano-vazio` | Mensagem quando nada está marcado |
| `plano-resumo` | Frase "Dá para levar tudo em uma única parada." |
| `parada-1` (`parada-2`…) | Cartão de cada parada |
| `abrir-mapa-parada-1` | Botão "Ver detalhes e mapa" da parada, que abre o modal |
| `ver-na-busca-parada-1` | Link "Ver na busca" (vai para `pontos.html?item=...&ponto=...`) |
| `aviso` | Aviso "Confirme antes de ir" |

Observação: o Recic.LE aceita os 6 tipos de item, então com os dados atuais o plano sempre fecha em 1 parada. O ponto indicado muda conforme os itens marcados. Só TV, por exemplo, indica o Ecoponto Panamá.

## por-que-importa.html

| data-video | Elemento |
|---|---|
| `fato-reciclado` | Cartão 22,3% (quadrados) |
| `fato-cresce` | Cartão 62 para 82 Mt (barras) |
| `fato-metais` | Cartão 31 Mt (barra de metais) |
| `cta-importa-gaveta`, `cta-importa-pontos` | Botões do bloco "Comece pela sua gaveta" |

## estudos.html

| data-video | Elemento |
|---|---|
| `estudo-1`, `estudo-2`, `estudo-3` | Cartões dos três estudos |
| `referencias` | Lista de referências |
