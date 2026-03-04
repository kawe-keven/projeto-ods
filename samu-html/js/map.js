// ============================================================
//  map.js  Mapa 3D de risco cardíaco
//  Base: Mapbox GL JS dark-v11  |  Camadas: deck.gl
//  Dados: vendas anti-hipertensivos por farmácia (Aracaju/SE)
// ============================================================

const MapPanel = (() => {

  let _deck        = null;
  let _mapboxMap   = null;
  let _tooltip     = null;
  let _showHeat    = true;
  let _showContour = true;

  //  Render principal 
  function render() {
    const panel = document.getElementById("mapPanel");
    if (!panel) return;

    panel.innerHTML = `
      <div class="map-title-bar">
        <span class="map-menu-icon">≡</span>
        MAPA 3D DE RISCO CARDÍACO — ARACAJU / SE
        <span class="map-title-badges">
          <span class="map-badge-city">📍 Aracaju, SE</span>
          <span class="map-badge-src">💊 Anti-hipertensivos</span>
          <span class="map-badge-live">● AO VIVO</span>
        </span>
      </div>

      <div class="map-container" id="mapContainer">
        <div class="map-legend" id="mapLegend">
          <div class="map-legend-title">LEGENDA</div>
          <div class="legend-section">
            <div class="legend-section-title">RISCO CARDÍACO</div>
            <div class="legend-gradient-bar"></div>
            <div class="legend-gradient-labels"><span>Baixo</span><span>Alto</span></div>
          </div>
          <div class="legend-section">
            <div class="legend-section-title">HOSPITAIS</div>
            <div class="legend-item"><span class="legend-dot" style="background:#06b6d4;box-shadow:0 0 6px #06b6d480"></span>Hospital</div>
            <div class="legend-item"><span class="legend-dot" style="background:#a855f7;box-shadow:0 0 6px #a855f780"></span>UPA / Unidade</div>
          </div>
        </div>
      </div>

      <div class="map-footer">
        <span class="map-nav" id="mapControls">
          <button class="map-ctrl-btn" id="btnResetView" title="Restaurar ângulo 3D (R)">⊙ Reset 3D</button>
          <button class="map-ctrl-btn" id="btnToggleContour" title="Mostrar/ocultar contornos de risco">◧ Contornos On</button>
          <button class="map-ctrl-btn" id="btnToggleHeat" title="Mostrar/ocultar mapa de calor">🌡 Calor On</button>
        </span>
        <span class="map-info" id="mapClock"></span>
      </div>
    `;

    _startClock();
    _initDeckGL(document.getElementById("mapContainer"));
    _bindControls();
  }

  //  Relógio 
  function _startClock() {
    const update = () => {
      const el = document.getElementById("mapClock");
      if (el) el.textContent =
        `Scroll=zoom  Arrastar=mover  Ctrl+drag=girar  R=reset  |  ${new Date().toLocaleTimeString("pt-BR")}`;
    };
    update();
    setInterval(update, 1000);
  }

  //  Botões de controle 
  function _bindControls() {
    document.getElementById("btnResetView")?.addEventListener("click", () => {
      if (_deck) _deck.setProps({ initialViewState: { ..._defaultView(), transitionDuration: 900 } });
      if (_mapboxMap) _mapboxMap.jumpTo({ center: [MAP_CONFIG.deckgl.longitude, MAP_CONFIG.deckgl.latitude], zoom: MAP_CONFIG.deckgl.zoom, pitch: MAP_CONFIG.deckgl.pitch, bearing: MAP_CONFIG.deckgl.bearing });
    });
    document.getElementById("btnToggleContour")?.addEventListener("click", (e) => {
      _showContour = !_showContour;
      e.currentTarget.textContent = `◧ Contornos ${_showContour ? "On" : "Off"}`;
      e.currentTarget.classList.toggle("inactive", !_showContour);
      _updateLayers();
    });
    document.getElementById("btnToggleHeat")?.addEventListener("click", (e) => {
      _showHeat = !_showHeat;
      e.currentTarget.textContent = `🌡 Calor ${_showHeat ? "On" : "Off"}`;
      e.currentTarget.classList.toggle("inactive", !_showHeat);
      _updateLayers();
    });
    // Atalho de teclado: R = reset view
    document.addEventListener("keydown", (e) => {
      if (e.key === "r" || e.key === "R") {
        if (_deck) _deck.setProps({ initialViewState: { ..._defaultView(), transitionDuration: 900 } });
        if (_mapboxMap) _mapboxMap.jumpTo({ center: [MAP_CONFIG.deckgl.longitude, MAP_CONFIG.deckgl.latitude], zoom: MAP_CONFIG.deckgl.zoom, pitch: MAP_CONFIG.deckgl.pitch, bearing: MAP_CONFIG.deckgl.bearing });
      }
    });
  }

  //  Inicialização Mapbox GL + deck.gl 
  function _initDeckGL(container) {
    _showOverlay(container, "loading");

    _tooltip = document.createElement("div");
    _tooltip.className = "deck-tooltip";
    _tooltip.style.display = "none";
    container.appendChild(_tooltip);

    // 1 — Mapbox GL CSS
    if (!document.getElementById("mapbox-gl-css")) {
      const link  = document.createElement("link");
      link.id     = "mapbox-gl-css";
      link.rel    = "stylesheet";
      link.href   = "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.css";
      document.head.appendChild(link);
    }

    const _loadScript = (src, onload, errmsg) => {
      const s    = document.createElement("script");
      s.src      = src;
      s.onload   = onload;
      s.onerror  = () => _showOverlay(container, "error", errmsg);
      document.head.appendChild(s);
    };

    // 2 — deck.gl (depois de ter mapboxgl)
    const _loadDeck = () => {
      if (window.deck) { _createDeck(container); return; }
      _loadScript(
        "https://unpkg.com/deck.gl@8.9.35/dist.min.js",
        () => _createDeck(container),
        "Falha ao carregar deck.gl. Verifique sua conexão."
      );
    };

    // 1 — Mapbox GL JS
    if (window.mapboxgl) { _loadDeck(); return; }
    _loadScript(
      "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.js",
      _loadDeck,
      "Falha ao carregar Mapbox GL JS. Verifique sua conexão."
    );
  }

  function _createDeck(container) {
    const cfg = MAP_CONFIG.deckgl;

    // ── Verifica suporte a WebGL ──────────────────────────
    const testCanvas = document.createElement("canvas");
    const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
    if (!gl) {
      _showOverlay(container, "error", "WebGL não suportado neste navegador. Use Chrome ou Firefox.");
      return;
    }

    // ── Mapbox GL como camada base ───────────────────────
    const mapDiv = document.createElement("div");
    mapDiv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
    mapDiv.id = "mapboxBase";
    container.insertBefore(mapDiv, container.firstChild);

    mapboxgl.accessToken = MAP_CONFIG.mapbox.accessToken;

    try {
      _mapboxMap = new mapboxgl.Map({
        container:   mapDiv,
        style:       MAP_CONFIG.mapbox.style,
        center:      [cfg.longitude, cfg.latitude],
        zoom:        cfg.zoom,
        pitch:       cfg.pitch,
        bearing:     cfg.bearing,
        interactive: false,
        antialias:   true,
        failIfMajorPerformanceCaveat: false,
      });
    } catch (e) {
      _showOverlay(container, "error", "Falha ao inicializar Mapbox GL: " + e.message);
      return;
    }

    // Timeout de 15s: se o mapa não carregar, mostra erro diagnóstico
    const loadTimeout = setTimeout(() => {
      if (_deck) return; // já carregou
      _showOverlay(container, "error",
        "Tempo esgotado ao carregar o mapa. Verifique: token Mapbox, conexão com internet, e abra via http:// (não file://).");
    }, 15000);

    _mapboxMap.on("error", (ev) => {
      clearTimeout(loadTimeout);
      const msg = ev.error?.message || JSON.stringify(ev.error) || "erro desconhecido";
      console.error("Mapbox error:", ev.error);
      _showOverlay(container, "error", "Mapbox: " + msg);
    });

    // Aguarda o Mapbox carregar o estilo antes de criar o deck.gl
    _mapboxMap.on("load", () => {
      clearTimeout(loadTimeout);
      _clearOverlay(container);

      // ── Edifícios 3D (fill-extrusion) ──────────────────
      _add3DBuildings();

      _attachDeckCanvas(container);
    });
  }

  function _add3DBuildings() {
    if (!_mapboxMap) return;

    // Remove camada plana de edifícios do estilo dark-v11 (se existir)
    ["building", "building-outline"].forEach(id => {
      if (_mapboxMap.getLayer(id)) _mapboxMap.removeLayer(id);
    });

    // Adiciona fill-extrusion com altura real + gradiente de cor
    if (!_mapboxMap.getLayer("3d-buildings")) {
      _mapboxMap.addLayer({
        id:           "3d-buildings",
        source:       "composite",
        "source-layer": "building",
        filter:       ["==", "extrude", "true"],
        type:         "fill-extrusion",
        minzoom:      12,
        paint: {
          // Cor base azul-escura com variação por altura
          "fill-extrusion-color": [
            "interpolate", ["linear"],
            ["get", "height"],
            0,   "#0d1b2e",
            20,  "#102440",
            60,  "#0f2d52",
            120, "#0a3568",
            200, "#074080",
          ],
          "fill-extrusion-height":  ["get", "height"],
          "fill-extrusion-base":    ["get", "min_height"],
          "fill-extrusion-opacity": 0.88,
        },
      });

      // Topo dos edifícios mais alto com cor de acento ciano suave
      _mapboxMap.addLayer({
        id:           "3d-buildings-roof",
        source:       "composite",
        "source-layer": "building",
        filter:       ["==", "extrude", "true"],
        type:         "fill-extrusion",
        minzoom:      12,
        paint: {
          "fill-extrusion-color": [
            "interpolate", ["linear"],
            ["get", "height"],
            0,   "#112233",
            60,  "#0e3555",
            120, "#0a4070",
            200, "#065090",
          ],
          "fill-extrusion-height": ["+", ["get", "height"], 1],
          "fill-extrusion-base":   ["get", "height"],
          "fill-extrusion-opacity": 0.55,
        },
      });
    }
  }

  function _attachDeckCanvas(container) {
    // ── Canvas do deck.gl sobreposto ao mapa ──────────────
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;outline:none;pointer-events:all;";
    canvas.id = "deckCanvas";
    container.appendChild(canvas);

    const w = container.offsetWidth  || 900;
    const h = container.offsetHeight || 600;

    _deck = new deck.Deck({
      canvas,
      width:  w,
      height: h,
      initialViewState: _defaultView(),
      controller: { dragRotate: true, touchRotate: true, keyboard: true },
      layers: _buildLayers(),
      onHover: (info) => _onHover(info),
      onViewStateChange: ({ viewState }) => {
        if (_mapboxMap) {
          _mapboxMap.jumpTo({
            center:  [viewState.longitude, viewState.latitude],
            zoom:    viewState.zoom,
            bearing: viewState.bearing,
            pitch:   viewState.pitch,
          });
        }
      },
      useDevicePixels: true,
    });

    // Sincroniza tamanho ao redimensionar
    new ResizeObserver(() => {
      if (!_deck || !container) return;
      _deck.setProps({ width: container.offsetWidth, height: container.offsetHeight });
      if (_mapboxMap) _mapboxMap.resize();
    }).observe(container);
  }

  function _defaultView() {
    const cfg = MAP_CONFIG.deckgl;
    return {
      longitude: cfg.longitude,
      latitude:  cfg.latitude,
      zoom:      cfg.zoom,
      pitch:     cfg.pitch,
      bearing:   cfg.bearing,
      maxPitch:  85,
    };
  }

  //  Camadas deck.gl 
  function _buildLayers() {
    const layers = [];

    // 1  Heatmap meteorológico  gradiente suave de risco
    if (_showHeat) {
      layers.push(new deck.HeatmapLayer({
        id: "cardiac-heat",
        data: APP_DATA.pharmacyPoints,
        getPosition:  d => [d.lng, d.lat],
        getWeight:    d => d.weight,
        radiusPixels: 120,
        intensity:    2.2,
        threshold:    0.03,
        colorRange: [
          [  0,  20,  80,   0],   // transparente   risco nulo
          [ 10,  80, 200, 100],   // azul            risco muito baixo
          [  0, 180, 220, 160],   // ciano           risco baixo
          [ 30, 200,  80, 180],   // verde           risco moderado
          [220, 210,  10, 210],   // amarelo         risco elevado
          [240,  90,   0, 235],   // laranja         risco alto
          [210,   0,   0, 255],   // vermelho        risco crítico
        ],
      }));
    }

    // 2  Contornos meteorológicos  isobandas de risco
    if (_showContour && window.deck.ContourLayer) {
      layers.push(new deck.ContourLayer({
        id: "contour-risk",
        data: APP_DATA.pharmacyPoints,
        getPosition: d => [d.lng, d.lat],
        getWeight:   d => d.weight,
        cellSize:    200,
        contours: [
          { threshold: [0, 3],  color: [  0,  80, 200,  35] },  // azul leve
          { threshold: [3, 5],  color: [  0, 200, 220,  65] },  // ciano
          { threshold: [5, 7],  color: [ 40, 200,  50,  90] },  // verde
          { threshold: [7, 9],  color: [230, 200,   0, 120] },  // amarelo
          { threshold: [9, 11], color: [220,  40,   0, 160] },  // vermelho
        ],
      }));
    }

    // 3  Hospitais
    layers.push(new deck.ScatterplotLayer({
      id: "hospitals",
      data: APP_DATA.hospitals,
      getPosition:  d => [d.lng, d.lat],
      getRadius:    d => d.tipo === "Hospital" ? 120 : 80,
      getFillColor: d => d.tipo === "Hospital" ? [6, 182, 212, 230] : [168, 85, 247, 230],
      getLineColor: [255, 255, 255, 200],
      lineWidthMinPixels: 2,
      stroked:  true,
      pickable: true,
    }));

    // 4  Labels hospitais
    layers.push(new deck.TextLayer({
      id: "hosp-labels",
      data: APP_DATA.hospitals,
      getPosition:        d => [d.lng, d.lat],
      getText:            d => d.label,
      getSize:            10,
      getColor:           [6, 218, 240, 235],
      getPixelOffset:     [0, -24],
      fontFamily:         "Rajdhani, sans-serif",
      fontWeight:         "700",
      background:         true,
      getBackgroundColor: [5, 15, 30, 185],
      backgroundPadding:  [4, 2, 4, 2],
    }));

    return layers;
  }

  function _updateLayers() {
    if (_deck) _deck.setProps({ layers: _buildLayers() });
  }

  //  Tooltip interativo 
  function _onHover(info) {
    if (!_tooltip) return;
    if (!info.object) { _tooltip.style.display = "none"; return; }

    const layer = info.layer?.id || "";
    let html = "";

    if (layer === "hospitals" || layer === "hosp-labels") {
      const d   = info.object;
      const clr = d.ocupacao >= 85 ? "#ef4444" : d.ocupacao >= 70 ? "#f97316" : "#22c55e";
      html = `
        <div class="dt-header">🏥 ${d.label}</div>
        <div class="dt-row"><span>Tipo:</span>${d.tipo}</div>
        <div class="dt-row"><span>Leitos:</span>${d.leitos}</div>
        <div class="dt-row"><span>Ocupação:</span><b style="color:${clr}">${d.ocupacao}%</b></div>
        <div class="dt-coord">${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}</div>`;

    } else if (layer === "contour-risk") {
      const pts  = info.object?.contour || [];
      const w    = info.object?.weight ?? info.object?.elevationValue ?? 0;
      const avg  = typeof w === "number" ? w.toFixed(1) : "";
      const nivel = w >= 9 ? "🔴 CRÍTICO" : w >= 7 ? "🟠 ALTO" : w >= 5 ? "🟡 MÉDIO" : "🟢 BAIXO";
      html = `
        <div class="dt-header">💊 Zona de Risco Cardíaco</div>
        <div class="dt-row"><span>Índice:</span>${avg}/10</div>
        <div class="dt-row"><span>Nível:</span><b>${nivel}</b></div>`;

    } else { _tooltip.style.display = "none"; return; }

    _tooltip.innerHTML = html;
    _tooltip.style.display = "block";

    // Posicionamento inteligente: evita sair dos limites do contêiner
    const container = _tooltip.parentElement;
    const cw = container?.offsetWidth  || 600;
    const ch = container?.offsetHeight || 400;
    const tw = _tooltip.offsetWidth    || 220;
    const th = _tooltip.offsetHeight   || 120;
    const MARGIN = 10;
    let lx = info.x + 14;
    let ly = info.y - 10;
    if (lx + tw > cw - MARGIN) lx = info.x - tw - 14;
    if (ly + th > ch - MARGIN) ly = info.y - th - 10;
    if (lx < MARGIN) lx = MARGIN;
    if (ly < MARGIN) ly = MARGIN;
    _tooltip.style.left = lx + "px";
    _tooltip.style.top  = ly + "px";
  }

  //  Overlay loading / error 
  function _showOverlay(container, type, msg = "") {
    container.querySelector(".map-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.className = "map-overlay";

    if (type === "loading") {
      overlay.innerHTML = `
        <div class="map-loading">
          <div class="deck-spinner"></div>
          <span>Carregando mapa 3D…</span>
        </div>`;
    } else {
      overlay.innerHTML = `
        <div class="map-error">
          <span>⚠ ${msg}</span>
          <small>Verifique sua conexão com a internet.</small>
        </div>`;
    }
    container.appendChild(overlay);
  }

  function _clearOverlay(container) {
    container.querySelector(".map-overlay")?.remove();
  }

  return { render };
})();
