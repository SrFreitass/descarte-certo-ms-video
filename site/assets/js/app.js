/* Descarte Certo MS: comportamento compartilhado.
   Cada página declara <body data-page="..."> e este arquivo inicia só o que ela usa.
   ?capture=1 desliga transições e rolagem suave (para gravação de vídeo).
   ?reset=1 volta a gaveta para o estado inicial (celular, pilhas e cabos). */
(function () {
  "use strict";

  var D = window.DC;
  if (!D) return;
  var ITEMS = D.ITEMS, POINTS = D.POINTS, SLUG = D.SLUG, KEYS = Object.keys(D.ITEMS);
  var params = new URLSearchParams(window.location.search);
  var CAPTURE = params.get("capture") === "1";
  var root = document.documentElement;
  if (CAPTURE) root.classList.add("capture");

  function reducedMotion() {
    return CAPTURE || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  /* ---------- Ícones ---------- */
  var UI = {
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    ext: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    alert: '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4M12 17v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/>',
    store: '<path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-6h6v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H16a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h7.5"/>',
    drawer: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 12h18M10 8h4M10 16h4"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7"/>'
  };
  function svg(path, cls, sw) {
    return '<svg class="' + (cls || "i") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + path + "</svg>";
  }
  function ui(name, cls) { return svg(UI[name], cls); }
  function itemIcon(k, cls) { return svg(D.ICONS[k], cls, 1.7); }
  var CHECK = svg('<path d="M5 12l5 5 9-10"/>', "i", 3);

  /* ---------- Utilidades de pontos ---------- */
  function pointById(id) { return POINTS.filter(function (p) { return p.id === id; })[0] || null; }
  function mapsQuery(p) { return p.nome + ", " + p.end + ", " + p.bairro + ", Campo Grande, MS"; }
  function embedQuery(p) { return p.end + ", " + p.bairro + ", Campo Grande, MS"; }
  function mapsLink(p) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(mapsQuery(p)); }
  function embedLink(p) { return "https://www.google.com/maps?q=" + encodeURIComponent(embedQuery(p)) + "&output=embed"; }
  function covHtml(keys) {
    return '<div class="cov">' + keys.map(function (k) { return "<span>" + CHECK + esc(ITEMS[k].curto) + "</span>"; }).join("") + "</div>";
  }

  /* Mesma lógica do original: a cada passo, escolhe o ponto que cobre mais itens restantes
     (em empate, o primeiro da lista) e registra os outros como alternativas. */
  function planStops(chosen) {
    var left = chosen.slice(), stops = [];
    while (left.length && stops.length < 6) {
      var scored = POINTS.map(function (p) { return { p: p, cov: left.filter(function (k) { return p.aceita.indexOf(k) > -1; }) }; });
      var best = Math.max.apply(null, scored.map(function (s) { return s.cov.length; }));
      if (best === 0) break;
      var tops = scored.filter(function (s) { return s.cov.length === best; });
      stops.push({ p: tops[0].p, cov: tops[0].cov, alts: tops.slice(1).map(function (s) { return s.p; }) });
      left = left.filter(function (k) { return tops[0].cov.indexOf(k) < 0; });
    }
    return stops;
  }

  /* ---------- Gaveta (localStorage, mesma chave do original) ---------- */
  function loadGaveta() {
    var g = JSON.parse(JSON.stringify(D.DEFAULTS.gaveta));
    try {
      if (params.get("reset") === "1") {
        localStorage.removeItem(D.DEFAULTS.gavetaKey);
        /* Tira o reset da URL para um recarregamento não apagar a gaveta de novo. */
        var u = new URL(window.location.href); u.searchParams.delete("reset");
        if (window.history && history.replaceState) history.replaceState(null, "", u.pathname + u.search + u.hash);
      }
      var s = localStorage.getItem(D.DEFAULTS.gavetaKey);
      if (s) { var parsed = JSON.parse(s); if (parsed && typeof parsed === "object") g = parsed; }
    } catch (e) { /* sem armazenamento: usa o padrão */ }
    return g;
  }
  function saveGaveta(g) { try { localStorage.setItem(D.DEFAULTS.gavetaKey, JSON.stringify(g)); } catch (e) {} }

  /* ---------- Cabeçalho: menu no celular e links em modo captura ---------- */
  function initHeader() {
    var btn = $(".menu-btn"), nav = $("#site-nav");
    if (btn && nav) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", String(open));
        nav.classList.toggle("is-open", open);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true" && !Modal.isOpen()) {
          btn.setAttribute("aria-expanded", "false"); nav.classList.remove("is-open"); btn.focus();
        }
      });
      window.addEventListener("resize", function () {
        if (window.innerWidth > 960 && nav.classList.contains("is-open")) { nav.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }
      });
    }
    if (CAPTURE) {
      /* Mantém ?capture=1 ao navegar entre as páginas do site. */
      $all("a[href]").forEach(function (a) { keepCapture(a); });
    }
  }
  function keepCapture(a) {
    if (!CAPTURE) return;
    var href = a.getAttribute("href");
    if (!href || /^(https?:|mailto:|tel:|#)/.test(href) || href.indexOf(".html") < 0 || /[?&]capture=1/.test(href)) return;
    var hash = "", i = href.indexOf("#");
    if (i > -1) { hash = href.slice(i); href = href.slice(0, i); }
    a.setAttribute("href", href + (href.indexOf("?") > -1 ? "&" : "?") + "capture=1" + hash);
  }

  /* ---------- Modal com mapa ---------- */
  var Modal = (function () {
    var backdrop, dialog, lastFocus, timer, openId = null;
    var outside = [];

    function build() {
      backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      backdrop.hidden = true;
      backdrop.setAttribute("data-video", "modal-fundo");
      backdrop.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc" tabindex="-1" data-video="modal">' +
          '<button class="modal-close" type="button" aria-label="Fechar" data-video="modal-fechar">' + ui("x") + "</button>" +
          '<div class="modal-info"></div>' +
          '<div class="modal-map"></div>' +
        "</div>";
      document.body.appendChild(backdrop);
      dialog = $(".modal", backdrop);
      $(".modal-close", backdrop).addEventListener("click", close);
      /* Só fecha se o clique começou e terminou fora da caixa (evita fechar ao arrastar seleção). */
      backdrop.addEventListener("mousedown", function (e) { backdrop._down = (e.target === backdrop); });
      backdrop.addEventListener("click", function (e) { if (e.target === backdrop && backdrop._down !== false) close(); backdrop._down = null; });
      document.addEventListener("keydown", onKey, true);
      document.addEventListener("focusin", function (e) {
        if (isOpen() && !dialog.contains(e.target)) { var f = focusables(); (f[0] || dialog).focus(); }
      });
    }
    function focusables() {
      return $all('a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])', dialog)
        .filter(function (el) { return el.offsetParent !== null || el.tagName === "IFRAME"; });
    }
    function onKey(e) {
      if (!isOpen()) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key === "Tab") {
        var f = focusables(); if (!f.length) { e.preventDefault(); return; }
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function isOpen() { return !!backdrop && !backdrop.hidden; }

    function open(p, trigger) {
      if (!backdrop) build();
      openId = p.id;
      lastFocus = trigger || document.activeElement;
      var link = mapsLink(p);
      $(".modal-info", dialog).innerHTML =
        '<span class="tag">' + ui("store", "i-sm") + esc(p.tipo) + "</span>" +
        '<h2 id="modal-title" data-video="modal-titulo">' + esc(p.nome) + "</h2>" +
        '<ul class="info" id="modal-desc">' +
          '<li><span class="ii">' + ui("pin") + "</span><div><small>Endereço</small><span>" + esc(p.end) + ", " + esc(p.bairro) + "</span></div></li>" +
          '<li><span class="ii">' + ui("clock") + "</span><div><small>Horário</small><span>" + esc(p.hor) + "</span></div></li>" +
        "</ul>" +
        '<div class="filter-block"><span class="mat-label">Itens aceitos</span>' + covHtml(p.aceita) + "</div>" +
        '<p class="obs">' + esc(p.obs) + "</p>" +
        '<div class="notice small"><span class="ic">' + ui("info") + "</span><p>Ponto levantado pelo grupo em " + esc(D.LEVANTAMENTO) + ". <strong>Confirme horário e itens aceitos antes de ir</strong>, pois podem mudar.</p></div>" +
        '<div class="modal-actions">' +
          '<a class="btn btn--primary" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer" data-video="modal-abrir-google">' + ui("ext") + "Abrir no Google Maps<span class=\"sr-only\"> (abre em nova aba)</span></a>" +
        "</div>";
      var mapBox = $(".modal-map", dialog);
      mapBox.className = "modal-map";
      mapBox.innerHTML =
        '<div class="map-fallback" role="note">' + ui("map") +
          "<p>Não foi possível carregar o mapa aqui.</p>" +
          '<a class="btn btn--outline btn--sm" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer" tabindex="-1">Abrir no Google Maps' + ui("ext") + "</a>" +
        "</div>" +
        '<iframe src="' + esc(embedLink(p)) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa do Google mostrando ' + esc(p.nome) + ", " + esc(p.end) + ', Campo Grande/MS" data-video="modal-mapa"></iframe>';
      var iframe = $("iframe", mapBox), fbLink = $(".map-fallback a", mapBox);
      function fail() { mapBox.classList.add("is-failed"); fbLink.removeAttribute("tabindex"); iframe.setAttribute("tabindex", "-1"); }
      clearTimeout(timer);
      if (navigator.onLine === false) fail();
      else {
        timer = setTimeout(fail, 12000);
        iframe.addEventListener("load", function () { clearTimeout(timer); });
        iframe.addEventListener("error", fail);
      }

      /* Deixa o resto da página inerte enquanto o modal está aberto. */
      outside = $all("body > *").filter(function (el) { return el !== backdrop && el.tagName !== "SCRIPT" && !el.hasAttribute("inert"); });
      outside.forEach(function (el) { el.setAttribute("inert", ""); el.setAttribute("aria-hidden", "true"); });
      backdrop.hidden = false;
      document.body.classList.add("modal-open");
      root.setAttribute("data-modal", "aberto");
      $(".modal-close", dialog).focus();
    }
    function close() {
      if (!isOpen()) return;
      clearTimeout(timer);
      backdrop.hidden = true;
      $(".modal-map", dialog).innerHTML = "";
      document.body.classList.remove("modal-open");
      root.removeAttribute("data-modal");
      outside.forEach(function (el) { el.removeAttribute("inert"); el.removeAttribute("aria-hidden"); });
      outside = [];
      openId = null;
      if (lastFocus && document.contains(lastFocus) && lastFocus.focus) lastFocus.focus();
    }
    return { open: open, close: close, isOpen: isOpen, current: function () { return openId; } };
  })();
  window.DescarteModal = Modal;

  /* Qualquer elemento com data-open-ponto="id" abre o modal daquele ponto. */
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-open-ponto]");
    if (!t) return;
    var p = pointById(Number(t.getAttribute("data-open-ponto")));
    if (p) { e.preventDefault(); Modal.open(p, t); }
  });

  /* ---------- Início ---------- */
  function initHome() {
    $all("[data-stat='pontos']").forEach(function (el) { el.textContent = String(POINTS.length); });
    $all("[data-stat='tipos']").forEach(function (el) { el.textContent = String(KEYS.length); });
    var box = $("#preview-result");
    if (!box) return;
    var chosen = KEYS.filter(function (k) { return D.DEFAULTS.gaveta[k]; });
    var stops = planStops(chosen);
    if (!stops.length) return;
    var s = stops[0];
    box.innerHTML =
      '<span class="sum">' + (stops.length === 1 ? "Uma única parada" : stops.length + " paradas") + "</span>" +
      "<strong>" + esc(s.p.nome) + "</strong>" +
      '<span class="meta">' + ui("pin") + esc(s.p.end) + ", " + esc(s.p.bairro) + "</span>" +
      '<span class="meta">' + ui("clock") + esc(s.p.hor) + "</span>";
  }

  /* ---------- Pontos de coleta ---------- */
  function initPontos() {
    var state = { item: D.DEFAULTS.item, bairro: D.DEFAULTS.bairro, sel: null };
    var qi = params.get("item"), qb = params.get("bairro"), qp = Number(params.get("ponto"));
    if (qi && ITEMS[qi]) state.item = qi;
    if (qb && POINTS.some(function (p) { return p.bairro === qb; })) state.bairro = qb;
    if (qp && pointById(qp)) state.sel = qp;

    var chipsEl = $("#chips"), sel = $("#bairro"), listEl = $("#list"), countEl = $("#count"), card = $("#detail"), guide = $("#guia-mini");

    KEYS.forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip";
      b.setAttribute("data-k", k);
      b.setAttribute("data-video", "chip-" + SLUG[k]);
      b.innerHTML = '<span class="ci">' + itemIcon(k) + "</span>" + esc(ITEMS[k].nome);
      b.addEventListener("click", function () { state.item = k; state.sel = null; render(); });
      chipsEl.appendChild(b);
    });

    var bairros = POINTS.map(function (p) { return p.bairro; }).sort(function (a, b) { return a.localeCompare(b, "pt-BR"); });
    sel.innerHTML = '<option value="todos">Todos os bairros</option>' + bairros.map(function (b) { return '<option value="' + esc(b) + '">' + esc(b) + "</option>"; }).join("");
    sel.value = state.bairro;
    sel.addEventListener("change", function () { state.bairro = sel.value; state.sel = null; render(); });

    function matches() {
      return POINTS.filter(function (p) { return p.aceita.indexOf(state.item) > -1 && (state.bairro === "todos" || p.bairro === state.bairro); });
    }

    function renderList() {
      var m = matches();
      countEl.innerHTML = m.length + " <small>" + (m.length === 1 ? "ponto encontrado" : "pontos encontrados") + " para " + esc(ITEMS[state.item].curto) + "</small>";
      var focusedId = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("data-id");
      listEl.innerHTML = "";
      if (!m.length) {
        listEl.innerHTML = '<div class="empty" data-video="lista-vazia">' + ui("info") + '<p>Nenhum ponto cadastrado aceita este item nesse bairro. Escolha "Todos os bairros".</p></div>';
        return;
      }
      m.forEach(function (p) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "pt";
        b.setAttribute("data-id", String(p.id));
        b.setAttribute("data-video", "ponto-" + p.id);
        b.setAttribute("aria-pressed", String(state.sel === p.id));
        var aceita = p.aceita.map(function (k) { return ITEMS[k].curto; }).join(", ");
        b.innerHTML =
          '<span class="pin" aria-hidden="true">' + p.id + "</span>" +
          '<span class="top"><strong>' + esc(p.nome) + '</strong><span class="tag">' + esc(p.tipo) + "</span></span>" +
          '<span class="meta">' + ui("pin") + "<span>" + esc(p.end) + " · " + esc(p.bairro) + "</span></span>" +
          '<span class="meta">' + ui("clock") + "<span>" + esc(p.hor) + "</span></span>" +
          '<span class="sr-only">Aceita: ' + esc(aceita) + ".</span>" +
          '<span class="acc">' + p.aceita.map(function (k) { return '<span class="ai' + (k === state.item ? " hit" : "") + '" title="' + esc(ITEMS[k].nome) + '" aria-hidden="true">' + itemIcon(k) + "</span>"; }).join("") +
          '<span class="selmark">' + CHECK + "Selecionado</span></span>";
        b.addEventListener("click", function () {
          state.sel = p.id; render();
          if (window.innerWidth <= 960 && card.scrollIntoView) card.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
        });
        listEl.appendChild(b);
      });
      if (focusedId) { var again = $('.pt[data-id="' + focusedId + '"]', listEl); if (again) again.focus(); }
    }

    function renderDetail() {
      var p = pointById(state.sel);
      card.setAttribute("data-state", p ? "selecionado" : "vazio");
      var body = $(".detail-body-slot", card);
      if (!p) {
        body.innerHTML =
          '<div class="detail-empty">' +
            '<svg class="ill" viewBox="0 0 120 96" fill="none" aria-hidden="true"><rect x="8" y="14" width="104" height="70" rx="14" fill="#e8f3ea"/><path d="M8 50c22-10 40 10 60 0s32-12 44-6" stroke="#b8d9bf" stroke-width="3" fill="none"/><path d="M60 22c-9 0-16 7-16 16 0 12 16 26 16 26s16-14 16-26c0-9-7-16-16-16z" fill="#1d6b3c"/><circle cx="60" cy="38" r="6" fill="#fff"/></svg>' +
            "<p><strong>Nenhum ponto selecionado.</strong><br>Toque em um ponto da lista para ver os detalhes.</p>" +
          "</div>";
        return;
      }
      body.innerHTML =
        '<div class="detail-body">' +
          '<span class="tag">' + ui("store", "i-sm") + esc(p.tipo) + "</span>" +
          "<h3>" + esc(p.nome) + "</h3>" +
          '<ul class="info">' +
            '<li><span class="ii">' + ui("pin") + "</span><div><small>Endereço</small><span>" + esc(p.end) + ", " + esc(p.bairro) + "</span></div></li>" +
            '<li><span class="ii">' + ui("clock") + "</span><div><small>Horário</small><span>" + esc(p.hor) + "</span></div></li>" +
          "</ul>" +
          covHtml(p.aceita) +
          '<p class="obs">' + esc(p.obs) + "</p>" +
          '<p class="small muted">Confirme horário e itens aceitos antes de ir: veja o ponto no mapa.</p>' +
          '<button class="btn btn--primary btn--block" type="button" data-open-ponto="' + p.id + '" data-video="abrir-mapa">' + ui("map") + "Ver no mapa e detalhes</button>" +
        "</div>";
    }

    function renderGuide() {
      var it = ITEMS[state.item];
      guide.setAttribute("data-item", SLUG[state.item]);
      guide.innerHTML =
        '<div class="sechead sechead--row" style="margin-bottom:18px"><div class="sechead" style="margin:0"><span class="eyebrow">Antes de levar</span>' +
        "<h2>Como descartar: " + esc(it.curto) + "</h2></div>" +
        '<a class="textlink" href="como-descartar.html#' + state.item + '" data-video="guia-completo">Ver o guia completo' + ui("arrow") + "</a></div>" +
        '<div class="guide-mini">' +
          '<div class="col"><div class="risk">' + ui("alert") + "<p><b>Risco.</b> " + esc(it.risco) + "</p></div>" +
          '<ol class="dolist">' + it.fazer.map(function (f) { return "<li><span>" + esc(f) + "</span></li>"; }).join("") + "</ol></div>" +
          '<div class="col"><span class="mat-label">Materiais que podem voltar à produção</span>' +
          '<div class="mat">' + it.mat.map(function (m) { return "<span>" + esc(m) + "</span>"; }).join("") + "</div></div>" +
        "</div>";
      keepCaptureIn(guide);
    }

    function syncChips() {
      $all(".chip", chipsEl).forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-k") === state.item)); });
    }

    function render() { syncChips(); renderList(); renderDetail(); renderGuide(); }
    render();
  }
  function keepCaptureIn(ctx) { if (CAPTURE) $all("a[href]", ctx).forEach(keepCapture); }

  /* ---------- Como descartar ---------- */
  function initGuia() {
    var wrap = $("#guias"), jump = $("#salto");
    KEYS.forEach(function (k) {
      var it = ITEMS[k];
      var aceitam = POINTS.filter(function (p) { return p.aceita.indexOf(k) > -1; });
      var a = document.createElement("a");
      a.className = "chip"; a.href = "#" + k;
      a.setAttribute("data-video", "salto-" + SLUG[k]);
      a.innerHTML = '<span class="ci">' + itemIcon(k) + "</span>" + esc(it.nome);
      jump.appendChild(a);

      var art = document.createElement("article");
      art.className = "panel gcard"; art.id = k;
      art.setAttribute("data-video", "guia-" + SLUG[k]);
      art.setAttribute("aria-labelledby", "g-" + k);
      art.innerHTML =
        '<div class="gcard-head"><span class="ic">' + itemIcon(k) + '</span><div><h2 id="g-' + k + '">' + esc(it.nome) + "</h2></div></div>" +
        '<div class="risk">' + ui("alert") + "<p><b>Risco.</b> " + esc(it.risco) + "</p></div>" +
        '<div class="filter-block"><span class="mat-label">O que fazer</span><ol class="dolist">' + it.fazer.map(function (f) { return "<li><span>" + esc(f) + "</span></li>"; }).join("") + "</ol></div>" +
        '<div class="filter-block"><span class="mat-label">Materiais que podem voltar à produção</span><div class="mat">' + it.mat.map(function (m) { return "<span>" + esc(m) + "</span>"; }).join("") + "</div></div>" +
        '<div class="gcard-foot"><p class="where"><b>' + aceitam.length + (aceitam.length === 1 ? " ponto aceita" : " pontos aceitam") + "</b>: " + aceitam.map(function (p) { return esc(p.rot); }).join(", ") + ".</p>" +
        '<a class="btn btn--outline btn--sm" href="pontos.html?item=' + k + '" data-video="guia-pontos-' + SLUG[k] + '">' + ui("search") + "Ver pontos</a></div>";
      wrap.appendChild(art);
    });
    keepCaptureIn(wrap); keepCaptureIn(jump);
    /* Ao abrir com âncora (#pilha), rola até o cartão depois de montar a página. */
    if (location.hash && document.getElementById(location.hash.slice(1))) {
      document.getElementById(location.hash.slice(1)).scrollIntoView({ block: "start" });
    }
  }

  /* ---------- Gaveta ---------- */
  function initGaveta() {
    var gaveta = loadGaveta();
    var tilesEl = $("#tiles"), planEl = $("#plan"), countEl = $("#gcount");
    function chosenKeys() { return KEYS.filter(function (k) { return gaveta[k]; }); }

    KEYS.forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "tile";
      b.setAttribute("data-k", k);
      b.setAttribute("data-video", "tile-" + SLUG[k]);
      b.innerHTML = '<span class="ok" aria-hidden="true">' + CHECK + '</span><span class="ico">' + itemIcon(k) + '</span><span class="nm">' + esc(ITEMS[k].nome) + '</span><span class="st" aria-hidden="true"><span class="y">Na gaveta</span><span class="n">Toque para marcar</span></span>';
      b.addEventListener("click", function () { gaveta[k] = !gaveta[k]; saveGaveta(gaveta); sync(); renderPlan(); });
      tilesEl.appendChild(b);
    });
    $("#gall").addEventListener("click", function () { KEYS.forEach(function (k) { gaveta[k] = true; }); saveGaveta(gaveta); sync(); renderPlan(); });
    $("#gnone").addEventListener("click", function () { KEYS.forEach(function (k) { gaveta[k] = false; }); saveGaveta(gaveta); sync(); renderPlan(); });

    function sync() {
      $all(".tile", tilesEl).forEach(function (t) { t.setAttribute("aria-pressed", String(!!gaveta[t.getAttribute("data-k")])); });
    }

    function renderPlan() {
      var chosen = chosenKeys();
      countEl.innerHTML = ui("drawer", "i-sm") + chosen.length + " de " + KEYS.length + " selecionados";
      planEl.setAttribute("data-paradas", "0");
      if (!chosen.length) {
        planEl.innerHTML = '<div class="plan-empty" data-video="plano-vazio">' + ui("drawer") + "<p>Toque nos itens acima para montar a sua ida ao ponto de coleta.</p></div>";
        return;
      }
      var stops = planStops(chosen);
      planEl.setAttribute("data-paradas", String(stops.length));
      var html = '<div class="plan-sum"><span class="badge">' + ui("route") + (stops.length === 1 ? "1 parada" : stops.length + " paradas") + '</span><span class="big" data-video="plano-resumo">' +
        (stops.length === 1 ? "Dá para levar tudo em uma única parada." : "Você resolve tudo em " + stops.length + " paradas.") + '</span></div><div class="stops">';
      stops.forEach(function (s, i) {
        var n = i + 1;
        html += '<article class="stop" data-video="parada-' + n + '"><div class="stop-main">' +
          '<span class="sn"><i>' + n + "</i>" + (stops.length > 1 ? "Parada " + n + " de " + stops.length : "Ponto indicado") + "</span>" +
          "<h3>" + esc(s.p.nome) + "</h3>" +
          '<span class="meta">' + ui("pin") + "<span>" + esc(s.p.end) + ", " + esc(s.p.bairro) + "</span></span>" +
          '<span class="meta">' + ui("clock") + "<span>" + esc(s.p.hor) + "</span></span>" +
          covHtml(s.cov) +
          (s.alts.length ? '<p class="alt">Também recebe esses itens: ' + s.alts.map(function (a) { return esc(a.rot); }).join(", ") + ".</p>" : "") +
          "</div>" +
          '<div class="stopbtns">' +
            '<button class="btn btn--primary btn--sm" type="button" data-open-ponto="' + s.p.id + '" data-video="abrir-mapa-parada-' + n + '">' + ui("map") + "Ver detalhes e mapa</button>" +
            '<a class="linkbtn" href="pontos.html?item=' + s.cov[0] + "&amp;ponto=" + s.p.id + '" data-video="ver-na-busca-parada-' + n + '">' + ui("search") + "Ver na busca</a>" +
          "</div></article>";
      });
      planEl.innerHTML = html + "</div>";
      keepCaptureIn(planEl);
    }
    sync(); renderPlan();
  }

  /* ---------- Por que importa ---------- */
  function initImporta() {
    var d = $("#dots");
    if (!d || d.children.length) return;
    var h = "";
    for (var i = 0; i < 100; i++) h += '<i class="' + (i < 22 ? "on" : "") + '"></i>';
    d.innerHTML = h;
  }

  initHeader();
  var page = document.body.getAttribute("data-page");
  if (page === "inicio") initHome();
  if (page === "pontos") initPontos();
  if (page === "como-descartar") initGuia();
  if (page === "gaveta") initGaveta();
  if (page === "por-que-importa") initImporta();
})();
