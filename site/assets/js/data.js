/* Descarte Certo MS: dados do site.
   Copiados do site original (página única). Não acrescente pontos, endereços,
   números ou estudos que não tenham sido levantados pelo grupo. */
(function () {
  "use strict";

  /* Ícones dos 6 tipos de item (traços SVG 24x24). */
  var ICONS = {
    celular: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
    pilha: '<rect x="8" y="4.5" width="8" height="17" rx="1.5"/><path d="M10.5 2h3M12 9v4M10 11h4"/>',
    computador: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19.5h20"/>',
    tv: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
    cabos: '<path d="M9 3v4M15 3v4"/><path d="M7 7h10v4a5 5 0 0 1-10 0z"/><path d="M12 16v5"/>',
    lampada: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'
  };

  var ITEMS = {
    celular: { nome: "Celular e tablet", curto: "celular e tablet", risco: "A bateria de íon-lítio pode inchar, pegar fogo se for perfurada e contaminar o solo.", fazer: ["Apague seus dados e saia das contas antes de entregar.", "Entregue inteiro, sem tentar abrir ou retirar a bateria.", "Leve com carregador e fones, se tiver."], mat: ["cobre", "ouro", "prata", "lítio"] },
    pilha: { nome: "Pilhas e baterias", curto: "pilhas e baterias", risco: "Contêm metais pesados que contaminam solo e água quando vão para o lixo comum.", fazer: ["Guarde em pote seco e fechado até levar.", "Leve separadas as baterias estufadas ou vazando.", "Use os coletores de pilhas dos pontos cadastrados."], mat: ["zinco", "níquel", "cobalto", "lítio"] },
    computador: { nome: "Computador e notebook", curto: "computador", risco: "Placas e componentes têm substâncias perigosas, mas também muito material valioso.", fazer: ["Apague os dados do disco antes de entregar.", "Entregue o equipamento completo, mesmo se não ligar.", "Se ainda funciona, considere doar antes de descartar."], mat: ["cobre", "ouro", "alumínio", "ferro"] },
    tv: { nome: "TV e monitor", curto: "TV e monitor", risco: "Telas e circuitos pedem manuseio cuidadoso. Quebrar o aparelho em casa aumenta o risco.", fazer: ["Não quebre nem desmonte o aparelho.", "Transporte com cuidado para não trincar a tela.", "Confirme no ponto se aceita aparelhos grandes."], mat: ["vidro", "plástico", "cobre", "ferro"] },
    cabos: { nome: "Cabos e carregadores", curto: "cabos", risco: "Misturados ao lixo comum, desperdiçam o cobre e vão parar em aterro.", fazer: ["Junte tudo em uma sacola.", "Não precisa separar por tipo.", "Pode levar junto com outro item eletrônico."], mat: ["cobre", "plástico", "ouro (conectores)"] },
    lampada: { nome: "Lâmpadas", curto: "lâmpadas", risco: "As fluorescentes contêm mercúrio. Se quebrarem, o risco é maior para quem manuseia.", fazer: ["Embale em jornal ou na caixa original.", "Não quebre nem esmague.", "Leve a um ponto que aceite lâmpadas."], mat: ["vidro", "alumínio", "mercúrio (a ser tratado)"] }
  };

  var ECO_ACEITA = ["celular", "computador", "tv", "cabos"];
  var POINTS = [
    { id: 1, nome: "Ecoponto Panamá", rot: "Panamá", bairro: "Jardim Panamá", tipo: "Ecoponto", end: "Av. José Barbosa Rodrigues, 196", lat: -20.43981, lon: -54.67134, hor: "Seg a sáb, 8h às 18h", aceita: ECO_ACEITA, obs: "Também recebe eletrodomésticos, móveis e entulho de obras (limite de 1 m³ por dia). Não recebe pilhas nem lâmpadas." },
    { id: 2, nome: "Ecoponto União", rot: "União", bairro: "Parque Residencial União", tipo: "Ecoponto", end: "Av. Roseira, 912", lat: -20.51412, lon: -54.65487, hor: "Seg a sáb, 8h às 18h", aceita: ECO_ACEITA, obs: "Também recebe eletrodomésticos, móveis e entulho. Não recebe pilhas nem lâmpadas." },
    { id: 3, nome: "Ecoponto Nova Lima", rot: "Nova Lima", bairro: "Vila Palmira", tipo: "Ecoponto", end: "Rua Pacajús, 194", lat: -20.40381, lon: -54.59392, hor: "Seg a sáb, 8h às 18h", aceita: ECO_ACEITA, obs: "Também recebe eletrodomésticos, móveis e entulho. Não recebe pilhas nem lâmpadas." },
    { id: 4, nome: "Ecoponto Noroeste", rot: "Noroeste", bairro: "Jardim Noroeste", tipo: "Ecoponto", end: "Rua Guarulhos, 788", lat: -20.44391, lon: -54.53761, hor: "Seg a sáb, 8h às 18h", aceita: ECO_ACEITA, obs: "Também recebe eletrodomésticos, móveis e entulho. Não recebe pilhas nem lâmpadas." },
    { id: 5, nome: "Ecoponto Moreninha", rot: "Moreninha", bairro: "Moreninha", tipo: "Ecoponto", end: "Rua Copaíba, 640", lat: -20.53123, lon: -54.58245, hor: "Seg a sáb, 8h às 18h", aceita: ECO_ACEITA, obs: "Também recebe eletrodomésticos, móveis e entulho. Não recebe pilhas nem lâmpadas." },
    { id: 6, nome: "Recic.LE", rot: "Recic.LE", bairro: "Rita Vieira", tipo: "Associação", end: "Rua Vera Cruz, 542", lat: -20.49524, lon: -54.59112, hor: "Seg a sex, 8h às 12h30 e 14h às 17h30", aceita: ["celular", "computador", "tv", "cabos", "pilha", "lampada"], obs: "Associação de Recicladores de Lixo Eletroeletrônico de MS. Também recebe eletrodomésticos e baterias." },
    { id: 7, nome: "Casas Bahia, Norte Sul Plaza", rot: "Casas Bahia", bairro: "Jóquei Club", tipo: "Loja parceira", end: "Av. Ernesto Geisel, 2300", lat: -20.48281, lon: -54.62254, hor: "Seg a sáb, 10h às 22h; dom, 12h às 20h", aceita: ["celular", "computador", "cabos", "pilha"], obs: "Só eletroeletrônicos de pequeno porte (celulares, tablets, notebooks e cabos) e pilhas e baterias. Não recebe TVs grandes nem lâmpadas." }
  ];

  /* Nomes estáveis usados nos atributos data-video (chip-pilhas, tile-tv...). */
  var SLUG = { celular: "celular", pilha: "pilhas", computador: "computador", tv: "tv", cabos: "cabos", lampada: "lampada" };

  /* Valores iniciais iguais ao original. */
  var DEFAULTS = {
    item: "celular",
    bairro: "todos",
    gaveta: { celular: true, pilha: true, cabos: true },
    gavetaKey: "descarte-certo-ms-gaveta"
  };

  var LEVANTAMENTO = "09/10/2026";

  window.DC = { ICONS: ICONS, ITEMS: ITEMS, POINTS: POINTS, SLUG: SLUG, DEFAULTS: DEFAULTS, LEVANTAMENTO: LEVANTAMENTO };
})();
