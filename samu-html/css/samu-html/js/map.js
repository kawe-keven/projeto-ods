// ============================================================
//  map.js  Mapa 3D de risco cardíaco
//  Base: Mapbox GL JS dark-v11  |  Camadas: deck.gl
//  Dados: vendas anti-hipertensivos por farmácia (Aracaju/SE)
// ============================================================

const MapPanel = (() => {

  let _deck          = null;
  let _mapboxMap     = null;
  let _tooltip       = null;
  let _showHeat      = true;
  let _showContour   = true;
  let _showColumns   = false;
  let _showPoints    = false;
  let _satMode       = false;
  let _pulseT        = 0;
  let _pulseAF       = null;
  let _lastFrame     = 0;
  let _viewState     = null;
  let _pitch3D       = true;
  let _showTerrain   = false;

  const _BAIRROS = [
    { name:"Centro",           lat:-10.9145, lng:-37.0686, zoom:15.5 },
    { name:"Siqueira Campos",  lat:-10.9112, lng:-37.0618, zoom:15.5 },
    { name:"18 do Forte",      lat:-10.9240, lng:-37.0578, zoom:15.5 },
    { name:"Industrial",       lat:-10.9345, lng:-37.0738, zoom:15.5 },
    { name:"Get\u00falio Vargas",  lat:-10.9175, lng:-37.0618, zoom:15.5 },
    { name:"Santo Ant\u00f4nio",   lat:-10.9248, lng:-37.0598, zoom:15.5 },
    { name:"S\u00e3o Conrado",     lat:-10.9425, lng:-37.0662, zoom:15.5 },
    { name:"Jardins",           lat:-10.9292, lng:-37.0498, zoom:15.5 },
    { name:"Grageru",           lat:-10.9315, lng:-37.0460, zoom:15.5 },
    { name:"Luzia",             lat:-10.9210, lng:-37.0548, zoom:15.5 },
    { name:"Jabotiana",         lat:-10.9520, lng:-37.0850, zoom:15.0 },
    { name:"Atalaia",           lat:-10.9618, lng:-37.0368, zoom:15.0 },
    { name:"Farol\u00e2ndia",       lat:-10.9698, lng:-37.0510, zoom:15.0 },
    { name:"Coroa do Meio",     lat:-10.9750, lng:-37.0528, zoom:15.0 },
    { name:"Porto Dantas",      lat:-10.8868, lng:-37.0798, zoom:15.0 },
    { name:"Bu\u00edgio",           lat:-10.8998, lng:-37.0718, zoom:15.0 },
    { name:"In\u00e1cio Barbosa",   lat:-10.9498, lng:-37.0618, zoom:15.0 },
  ];

  // ── Helpers de risco ─────────────────────────────────────
  function _riskColor(w, alpha) {
    const a = alpha ?? 255;
    if (w >= 10) return [200,   0,  20, a];
    if (w >=  9) return [235,  50,   0, a];
    if (w >=  8) return [248, 115,   0, a];
    if (w >=  7) return [230, 185,   8, a];
    if (w >=  5) return [ 35, 195,  65, a];
    if (w >=  3) return [  0, 175, 218, a];
    return              [  8,  65, 185, a];
  }

  function _riskLabel(w) {
    if (w >= 10) return "🔴 CRÍTICO";
    if (w >=  8) return "🟠 ALTO";
    if (w >=  6) return "🟡 MÉDIO-ALTO";
    if (w >=  4) return "🟡 MÉDIO";
    if (w >=  2) return "🟢 BAIXO";
    return "⚪ MÍNIMO";
  }

  // ── Animação de pulso (20 fps — suficiente para percepção suave) ──
  function _startPulse() {
    if (_pulseAF) return;
    const tick = (ts) => {
      _pulseAF = requestAnimationFrame(tick);
      if (ts - _lastFrame < 50) return;   // ~20 fps
      _lastFrame = ts;
      _pulseT = (ts % 2500) / 2500;       // período: 2.5 s
      // Só atualiza se o heatmap estiver ativo (evita rebuild desnecessário)
      if (_deck && _showHeat) _deck.setProps({ layers: _buildLayers() });
    };
    _pulseAF = requestAnimationFrame(tick);
  }

  function _stopPulse() {
    if (_pulseAF) { cancelAnimationFrame(_pulseAF); _pulseAF = null; }
  }

  // ── Navegação ──────────────────────────────────────────────────
  function _flyTo(lng, lat, zoom, pitch, bearing, duration) {
    duration = duration === undefined ? 1500 : duration;
    if (!_deck) return;
    _deck.setProps({
      initialViewState: {
        longitude: lng, latitude: lat,
        zoom: zoom, pitch: pitch, bearing: bearing,
        transitionDuration: duration,
        transitionInterpolator: new deck.FlyToInterpolator({ speed: 1.4 }),
      },
    });
  }

  function _zoomIn() {
    if (!_viewState) return;
    _flyTo(_viewState.longitude, _viewState.latitude,
      Math.min(_viewState.zoom + 1, 22), _viewState.pitch, _viewState.bearing, 400);
  }

  function _zoomOut() {
    if (!_viewState) return;
    _flyTo(_viewState.longitude, _viewState.latitude,
      Math.max(_viewState.zoom - 1, 2), _viewState.pitch, _viewState.bearing, 400);
  }

  function _togglePitch() {
    _pitch3D = !_pitch3D;
    const cfg = MAP_CONFIG.deckgl;
    const pitch = _pitch3D ? (cfg.pitch || 52) : 0;
    const base = _viewState || cfg;
    _flyTo(base.longitude, base.latitude, base.zoom, pitch, base.bearing || 0, 800);
    document.getElementById("btnPitch")?.classList.toggle("nav-btn-active", _pitch3D);
    document.getElementById("btnPitch").textContent = _pitch3D ? "3D" : "2D";
  }

  function _resetBearing() {
    const base = _viewState || MAP_CONFIG.deckgl;
    _flyTo(base.longitude, base.latitude, base.zoom, base.pitch, 0, 800);
  }

  function _flyToBairro(name) {
    const b = _BAIRROS.find(x => x.name === name);
    if (!b) return;
    _flyTo(b.lng, b.lat, b.zoom, _pitch3D ? (MAP_CONFIG.deckgl.pitch || 52) : 0, 0, 1200);
  }

  function _updateNavUI(vs) {
    const zBadge = document.getElementById("navZoomBadge");
    const bBadge = document.getElementById("navBearBadge");
    const compass = document.getElementById("navCompassNeedle");
    if (zBadge) zBadge.textContent = "z " + (vs.zoom || 0).toFixed(1);
    if (bBadge) bBadge.textContent = Math.round(vs.bearing || 0) + "\u00b0";
    if (compass) compass.style.transform = "rotate(" + (vs.bearing || 0) + "deg)";
  }

  //  Render principal 
  function render() {
    const panel = document.getElementById("mapPanel");
    if (!panel) return;

    panel.innerHTML = `
      <div class="map-title-bar">
        <span class="map-menu-icon">\u2261</span>
        MAPA 3D DE RISCO CARD\u00cdACO \u2014 ARACAJU / SE
        <span class="map-title-badges">
          <span class="map-badge-city">\ud83d\udccd Aracaju, SE</span>
          <span class="map-badge-src">\ud83d\udc8a Anti-hipertensivos</span>
          <span class="map-badge-live">\u25cf AO VIVO</span>
        </span>
      </div>

      <div class="map-container" id="mapContainer">

        <!-- Legenda -->
        <div class="map-legend" id="mapLegend">
          <div class="map-legend-title">LEGENDA</div>
          <div class="legend-section">
            <div class="legend-section-title">RISCO CARD\u00cdACO</div>
            <div class="legend-gradient-bar"></div>
            <div class="legend-gradient-labels"><span>Baixo</span><span>Alto</span></div>
          </div>
          <div class="legend-section">
            <div class="legend-section-title">FARM\u00c1CIAS</div>
            <div class="legend-item"><span class="legend-dot" style="background:rgb(8,65,185)"></span>Risco baixo</div>
            <div class="legend-item"><span class="legend-dot" style="background:rgb(35,195,65)"></span>Risco m\u00e9dio</div>
            <div class="legend-item"><span class="legend-dot" style="background:rgb(230,185,8)"></span>Risco alto</div>
            <div class="legend-item"><span class="legend-dot" style="background:rgb(200,0,20);box-shadow:0 0 6px rgba(200,0,20,0.6)"></span>Cr\u00edtico \u25cf</div>
          </div>
          <div class="legend-section">
            <div class="legend-section-title">HOSPITAIS</div>
            <div class="legend-item"><span class="legend-dot" style="background:#06b6d4;box-shadow:0 0 6px #06b6d480"></span>Hospital</div>
            <div class="legend-item"><span class="legend-dot" style="background:#a855f7;box-shadow:0 0 6px #a855f780"></span>UPA / Unidade</div>
          </div>
        </div>

        <!-- Barra de navega\u00e7\u00e3o flutuante (direita) -->
        <div class="map-nav-toolbar" id="mapNavToolbar">
          <span class="nav-zoom-badge" id="navZoomBadge">z 13.0</span>

          <button class="nav-btn" id="btnZoomIn"  title="Ampliar (+)">+</button>
          <button class="nav-btn" id="btnZoomOut" title="Reduzir (-)">&#x2212;</button>

          <div class="nav-sep"></div>

          <!-- Bussola -->
          <button class="nav-btn nav-compass" id="btnResetBearing" title="Alinhar Norte (N)">
            <svg id="navCompassSvg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
              <g id="navCompassNeedle" style="transform-origin:12px 12px">
                <polygon points="12,3 14,12 12,10 10,12" fill="#e74c3c"/>
                <polygon points="12,21 14,12 12,14 10,12" fill="#aaa"/>
              </g>
            </svg>
          </button>
          <span class="nav-bear-badge" id="navBearBadge">0\u00b0</span>

          <div class="nav-sep"></div>

          <!-- Toggle 2D/3D -->
          <button class="nav-btn nav-btn-active" id="btnPitch" title="Alternar vista 2D/3D (T)">3D</button>

          <div class="nav-sep"></div>

          <!-- Camadas -->
          <button class="nav-btn nav-layer-btn on"  id="btnToggleHeat"    title="Mapa de calor (H)">\ud83c\udf21</button>
          <button class="nav-btn nav-layer-btn on"  id="btnToggleContour" title="Contornos (C)">\u25a7</button>
          <button class="nav-btn nav-layer-btn off" id="btnToggleColumns" title="Colunas 3D (G)">\u2b1b</button>
          <button class="nav-btn nav-layer-btn off" id="btnTogglePoints"  title="Pontos farm\u00e1cias (P)">\ud83d\udc8a</button>

          <div class="nav-sep"></div>

          <!-- Sat\u00e9lite -->
          <button class="nav-btn" id="btnToggleSat" title="Sat\u00e9lite (S)">\ud83d\udef0</button>
        </div>

        <!-- Ir para bairro (esquerda baixo) -->
        <div class="map-goto">
          <select class="goto-select" id="gotoSelect">
            <option value="">&#x1F4CD; Ir para bairro\u2026</option>
            ${_BAIRROS.map(b => `<option value="${b.name}">${b.name}</option>`).join("")}
          </select>
        </div>

      </div>

      <div class="map-footer">
        <span class="map-kbd-hints">
          <kbd>+</kbd>/<kbd>-</kbd> zoom &nbsp;
          <kbd>T</kbd> 2D/3D &nbsp;
          <kbd>N</kbd> norte &nbsp;
          <kbd>R</kbd> reset &nbsp;
          <kbd>H</kbd> calor &nbsp;
          <kbd>C</kbd> contornos &nbsp;
          <kbd>G</kbd> colunas &nbsp;
          <kbd>P</kbd> pontos &nbsp;
          <kbd>S</kbd> satélite &nbsp;
          <kbd>E</kbd> relevo
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
      if (el) el.textContent = new Date().toLocaleTimeString("pt-BR");
    };
    update();
    setInterval(update, 1000);
  }

  //  Botões de controle 
  function _layerBtn(id, stateRef, setter, label) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", () => {
      setter(!stateRef());
      el.classList.toggle("on",  stateRef());
      el.classList.toggle("off", !stateRef());
      _updateLayers();
    });
  }

  function _bindControls() {
    // Zoom
    document.getElementById("btnZoomIn") ?.addEventListener("click", _zoomIn);
    document.getElementById("btnZoomOut")?.addEventListener("click", _zoomOut);

    // Bussola / norte
    document.getElementById("btnResetBearing")?.addEventListener("click", _resetBearing);

    // 2D / 3D
    document.getElementById("btnPitch")?.addEventListener("click", _togglePitch);

    // Reset view (R)
    const _doReset = () => {
      const dv = _defaultView();
      _pitch3D = true;
      document.getElementById("btnPitch").textContent = "3D";
      document.getElementById("btnPitch").classList.add("nav-btn-active");
      _flyTo(dv.longitude, dv.latitude, dv.zoom, dv.pitch, dv.bearing, 900);
    };

    // Camadas
    _layerBtn("btnToggleHeat",    () => _showHeat,    v => { _showHeat    = v; }, "");
    _layerBtn("btnToggleContour", () => _showContour, v => { _showContour = v; }, "");
    _layerBtn("btnToggleColumns", () => _showColumns, v => { _showColumns = v; }, "");
    _layerBtn("btnTogglePoints",  () => _showPoints,  v => { _showPoints  = v; }, "");

    // Satélite
    document.getElementById("btnToggleSat")?.addEventListener("click", (e) => {
      _toggleSatellite();
      e.currentTarget.classList.toggle("nav-btn-active", _satMode);
    });

    // Relevo 3D
    document.getElementById("btnToggleTerrain")?.addEventListener("click", () => {
      _toggleTerrain();
    });

    // Ir para bairro
    document.getElementById("gotoSelect")?.addEventListener("change", (e) => {
      if (e.target.value) { _flyToBairro(e.target.value); e.target.value = ""; }
    });

    // Teclado
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      switch (e.key.toUpperCase()) {
        case "+": case "=": _zoomIn();        break;
        case "-": case "_": _zoomOut();       break;
        case "R": _doReset();                 break;
        case "T": _togglePitch();             break;
        case "N": _resetBearing();            break;
        case "H":
          _showHeat = !_showHeat;
          document.getElementById("btnToggleHeat")?.classList.toggle("on",  _showHeat);
          document.getElementById("btnToggleHeat")?.classList.toggle("off", !_showHeat);
          _updateLayers(); break;
        case "C":
          _showContour = !_showContour;
          document.getElementById("btnToggleContour")?.classList.toggle("on",  _showContour);
          document.getElementById("btnToggleContour")?.classList.toggle("off", !_showContour);
          _updateLayers(); break;
        case "G":
          _showColumns = !_showColumns;
          document.getElementById("btnToggleColumns")?.classList.toggle("on",  _showColumns);
          document.getElementById("btnToggleColumns")?.classList.toggle("off", !_showColumns);
          _updateLayers(); break;
        case "P":
          _showPoints = !_showPoints;
          document.getElementById("btnTogglePoints")?.classList.toggle("on",  _showPoints);
          document.getElementById("btnTogglePoints")?.classList.toggle("off", !_showPoints);
          _updateLayers(); break;
        case "S":
          _toggleSatellite();
          document.getElementById("btnToggleSat")?.classList.toggle("nav-btn-active", _satMode);
          break;
        case "E":
          _toggleTerrain();
          break;
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

    const _loadScript = (src, errmsg) => new Promise((resolve, reject) => {
      const s    = document.createElement("script");
      s.src      = src;
      s.onload   = resolve;
      s.onerror  = () => { _showOverlay(container, "error", errmsg); reject(); };
      document.head.appendChild(s);
    });

    // Injeta o CSS do Mapbox imediatamente (já pré-carregado via preload)
    if (!document.getElementById("mapbox-gl-css")) {
      const link  = document.createElement("link");
      link.id     = "mapbox-gl-css";
      link.rel    = "stylesheet";
      link.href   = "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.css";
      document.head.appendChild(link);
    }

    // Carrega Mapbox e deck.gl em paralelo quando nenhum está presente,
    // ou apenas o que faltar — elimina a cascata sequencial
    const needsMapbox = !window.mapboxgl;
    const needsDeck   = !window.deck;

    const loaders = [];
    if (needsMapbox) loaders.push(_loadScript(
      "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.js",
      "Falha ao carregar Mapbox GL JS. Verifique sua conexão."
    ));
    if (needsDeck) loaders.push(_loadScript(
      "https://unpkg.com/deck.gl@8.9.35/dist.min.js",
      "Falha ao carregar deck.gl. Verifique sua conexão."
    ));

    Promise.all(loaders).then(() => _createDeck(container)).catch(() => {});
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
      _add3DTerrain();

      _attachDeckCanvas(container);
    });
  }

  function _add3DBuildings() {
    if (!_mapboxMap) return;

    // Remove camadas existentes (dark e satélite) para recriar
    ["building", "building-outline", "3d-buildings", "3d-buildings-roof"].forEach(id => {
      if (_mapboxMap.getLayer(id)) _mapboxMap.removeLayer(id);
    });

    const isDark = !_satMode;

    // Cores das faces laterais
    const baseColor = isDark
      ? ["interpolate", ["linear"], ["get", "height"],
          0,   "#0d1b2e",
          20,  "#102440",
          60,  "#0f2d52",
          120, "#0a3568",
          200, "#074080"]
      : ["interpolate", ["linear"], ["get", "height"],
          0,   "#4a5260",
          20,  "#5a6270",
          60,  "#6a7480",
          120, "#7a8694",
          200, "#8a98a8"];

    // Cores dos topos
    const roofColor = isDark
      ? ["interpolate", ["linear"], ["get", "height"],
          0,   "#112233",
          60,  "#0e3555",
          120, "#0a4070",
          200, "#065090"]
      : ["interpolate", ["linear"], ["get", "height"],
          0,   "#8090a0",
          60,  "#90a2b4",
          120, "#a0b4c6",
          200, "#b0c4d6"];

    // Faces laterais
    _mapboxMap.addLayer({
      id:           "3d-buildings",
      source:       "composite",
      "source-layer": "building",
      filter:       ["==", "extrude", "true"],
      type:         "fill-extrusion",
      minzoom:      12,
      paint: {
        "fill-extrusion-color":   baseColor,
        "fill-extrusion-height":  ["get", "height"],
        "fill-extrusion-base":    ["get", "min_height"],
        "fill-extrusion-opacity": isDark ? 0.88 : 0.78,
      },
    });

    // Topos dos edifícios
    _mapboxMap.addLayer({
      id:           "3d-buildings-roof",
      source:       "composite",
      "source-layer": "building",
      filter:       ["==", "extrude", "true"],
      type:         "fill-extrusion",
      minzoom:      12,
      paint: {
        "fill-extrusion-color":   roofColor,
        "fill-extrusion-height":  ["+", ["get", "height"], 1],
        "fill-extrusion-base":    ["get", "height"],
        "fill-extrusion-opacity": isDark ? 0.55 : 0.65,
      },
    });
  }

  //  Relevo 3D (terrain-dem)  
  function _add3DTerrain() {
    if (!_mapboxMap || !_showTerrain) return;
    if (!_mapboxMap.getSource('mapbox-dem')) {
      _mapboxMap.addSource('mapbox-dem', {
        type:     'raster-dem',
        url:      'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom:  14,
      });
    }
    _mapboxMap.setTerrain({ source: 'mapbox-dem', exaggeration: 2.5 });
    if (!_mapboxMap.getLayer('sky')) {
      _mapboxMap.addLayer({
        id:   'sky',
        type: 'sky',
        paint: {
          'sky-type':                        'atmosphere',
          'sky-atmosphere-sun':              [0.0, 90.0],
          'sky-atmosphere-sun-intensity':    15,
        },
      });
    }
  }

  function _toggleTerrain() {
    _showTerrain = !_showTerrain;
    if (_mapboxMap) {
      if (_showTerrain) {
        _add3DTerrain();
      } else {
        _mapboxMap.setTerrain(null);
        if (_mapboxMap.getLayer('sky'))       _mapboxMap.removeLayer('sky');
        if (_mapboxMap.getSource('mapbox-dem')) _mapboxMap.removeSource('mapbox-dem');
      }
    }
    document.getElementById('btnToggleTerrain')?.classList.toggle('nav-btn-active', _showTerrain);
  }

  //  Alterna satélite ↔ dark  
  function _toggleSatellite() {
    _satMode = !_satMode;
    const newStyle = _satMode
      ? "mapbox://styles/mapbox/satellite-streets-v12"
      : MAP_CONFIG.mapbox.style;

    if (!_mapboxMap) return;
    _mapboxMap.setStyle(newStyle);
    _mapboxMap.once("style.load", () => {
      _add3DBuildings();
      _add3DTerrain();
    });
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
        _viewState = viewState;
        if (_mapboxMap) {
          _mapboxMap.jumpTo({
            center:  [viewState.longitude, viewState.latitude],
            zoom:    viewState.zoom,
            bearing: viewState.bearing,
            pitch:   viewState.pitch,
          });
        }
        _updateNavUI(viewState);
      },
      // Limitar o pixel ratio a 2 evita renders 3× ou 4× desnecessários
      // em telas de alta densidade (economiza ~44% de fill-rate em 3× DPR)
      useDevicePixels: Math.min(window.devicePixelRatio || 1, 2),
    });

    // Sincroniza tamanho ao redimensionar
    new ResizeObserver(() => {
      if (!_deck || !container) return;
      _deck.setProps({ width: container.offsetWidth, height: container.offsetHeight });
      if (_mapboxMap) _mapboxMap.resize();
    }).observe(container);

    // Inicia animação de pulso
    _startPulse();
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
    const pts = APP_DATA.pharmacyPoints;

    // ── 1. Heatmap — gradiente de 10 paradas ─────────────
    if (_showHeat) {
      layers.push(new deck.HeatmapLayer({
        id:           "cardiac-heat",
        data:         pts,
        getPosition:  d => [d.lng, d.lat],
        getWeight:    d => d.weight,
        aggregation:  "SUM",
        radiusPixels: 95,
        intensity:    1.9,
        threshold:    0.012,
        colorRange: [
          [  2,  12,  60,   0],   // transparente    zero
          [  5,  55, 175,  75],   // azul-escuro     mínimo
          [  0, 148, 215, 135],   // azul-ciano      muito baixo
          [  0, 205, 178, 162],   // ciano           baixo
          [ 38, 205,  58, 180],   // verde           moderado
          [155, 218,  18, 196],   // verde-amarelo   médio
          [228, 188,   5, 215],   // amarelo         elevado
          [245, 105,   0, 232],   // laranja         alto
          [212,  10,  18, 245],   // vermelho        crítico
          [148,   0,  65, 255],   // carmim          extremo
        ],
      }));
    }

    // ── 2. Pulso animado nas zonas críticas (weight ≥ 8) ─
    if (_showHeat) {
      const pulse = 0.55 + Math.sin(_pulseT * Math.PI * 2) * 0.45;
      layers.push(new deck.ScatterplotLayer({
        id:           "critical-pulse",
        data:         pts.filter(d => d.weight >= 8),
        getPosition:  d => [d.lng, d.lat],
        getRadius:    d => (55 + d.weight * 20) * (0.65 + pulse * 0.35),
        getFillColor: d => {
          const a = Math.round(pulse * (d.weight >= 10 ? 115 : d.weight >= 9 ? 85 : 65));
          return _riskColor(d.weight, a);
        },
        radiusUnits:     "meters",
        updateTriggers:  { getRadius: _pulseT, getFillColor: _pulseT },
        stroked:         false,
        pickable:        false,
      }));
    }

    // ── 3. Pontos das farmácias (pickable) ───────────────
    if (_showPoints) {
      layers.push(new deck.ScatterplotLayer({
        id:           "pharmacy-points",
        data:         pts,
        getPosition:  d => [d.lng, d.lat],
        getRadius:    d => 18 + d.weight * 5,
        getFillColor: d => _riskColor(d.weight, 215),
        getLineColor: [255, 255, 255, 160],
        lineWidthMinPixels: 1.5,
        radiusUnits:  "meters",
        stroked:      true,
        pickable:     true,
      }));
    }

    // ── 4. Iso-bandas + iso-linhas de contorno ───────────
    if (_showContour && window.deck.ContourLayer) {
      layers.push(new deck.ContourLayer({
        id:          "contour-risk",
        data:        pts,
        getPosition: d => [d.lng, d.lat],
        getWeight:   d => d.weight,
        cellSize:    150,
        contours: [
          // bandas preenchidas
          { threshold: [0,   2.5], color: [  5,  55, 175,  22] },
          { threshold: [2.5, 5  ], color: [  0, 195, 215,  55] },
          { threshold: [5,   7  ], color: [ 38, 200,  55,  85] },
          { threshold: [7,   9  ], color: [228, 182,   5, 118] },
          { threshold: [9,  11  ], color: [212,  20,  18, 155] },
          // iso-linhas visíveis sobre as bandas
          { threshold:  5,   color: [  0, 210, 220, 160], strokeWidth: 2 },
          { threshold:  8,   color: [235, 175,   0, 195], strokeWidth: 3 },
          { threshold:  9.5, color: [210,  15,  15, 230], strokeWidth: 4 },
        ],
        pickable: true,
      }));
    }

    // ── 5. Colunas 3D agregadas (GridLayer) ──────────────
    if (_showColumns && window.deck.GridLayer) {
      layers.push(new deck.GridLayer({
        id:             "risk-columns",
        data:           pts,
        getPosition:    d => [d.lng, d.lat],
        getWeight:      d => d.weight,
        cellSize:       280,
        elevationScale: 45,
        extruded:       true,
        pickable:       true,
        colorRange: [
          [  5,  55, 175, 180],
          [  0, 175, 215, 192],
          [ 38, 200,  58, 205],
          [228, 185,   5, 218],
          [245, 105,   0, 232],
          [210,   0,  18, 248],
        ],
      }));
    }

    // ── 6. Hospitais ──────────────────────────────────────
    layers.push(new deck.ScatterplotLayer({
      id:           "hospitals",
      data:         APP_DATA.hospitals,
      getPosition:  d => [d.lng, d.lat],
      getRadius:    d => d.tipo === "Hospital" ? 120 : 80,
      getFillColor: d => d.tipo === "Hospital" ? [6, 182, 212, 230] : [168, 85, 247, 230],
      getLineColor: [255, 255, 255, 200],
      lineWidthMinPixels: 2,
      stroked:  true,
      pickable: true,
    }));

    // ── 7. Labels hospitais ───────────────────────────────
    layers.push(new deck.TextLayer({
      id:                 "hosp-labels",
      data:               APP_DATA.hospitals,
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

    } else if (layer === "pharmacy-points") {
      const d = info.object;
      const [r,g,b] = _riskColor(d.weight, 255);
      const css = `rgb(${r},${g},${b})`;
      html = `
        <div class="dt-header">💊 Farmácia — ${d.bairro}</div>
        <div class="dt-row"><span>Bairro:</span><b>${d.bairro}</b></div>
        <div class="dt-row"><span>Índice:</span><b style="color:${css}">${d.weight}/10</b></div>
        <div class="dt-row"><span>Risco:</span><b style="color:${css}">${_riskLabel(d.weight)}</b></div>
        <div class="dt-coord">${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}</div>`;

    } else if (layer === "risk-columns") {
      const w   = info.object?.elevationValue ?? info.object?.colorValue ?? 0;
      const cnt = info.object?.count ?? 1;
      const avg = typeof w === "number" ? w.toFixed(1) : "—";
      const [r,g,b] = _riskColor(Math.round(w), 255);
      const css = `rgb(${r},${g},${b})`;
      html = `
        <div class="dt-header">📊 Zona Agregada</div>
        <div class="dt-row"><span>Farmácias:</span><b>${cnt}</b></div>
        <div class="dt-row"><span>Risco médio:</span><b style="color:${css}">${avg}/10</b></div>
        <div class="dt-row"><span>Nível:</span><b style="color:${css}">${_riskLabel(Math.round(w))}</b></div>`;

    } else if (layer === "contour-risk") {
      const w    = info.object?.weight ?? info.object?.elevationValue ?? 0;
      const avg  = typeof w === "number" ? w.toFixed(1) : "";
      const [r,g,b] = _riskColor(Math.round(w), 255);
      const css = `rgb(${r},${g},${b})`;
      html = `
        <div class="dt-header">🗺 Zona de Risco Cardíaco</div>
        <div class="dt-row"><span>Índice:</span><b style="color:${css}">${avg}/10</b></div>
        <div class="dt-row"><span>Nível:</span><b style="color:${css}">${_riskLabel(Math.round(w))}</b></div>`;

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
    const overlay = container.querySelector(".map-overlay");
    if (!overlay) return;
    overlay.style.transition = "opacity 0.35s ease";
    overlay.style.opacity    = "0";
    setTimeout(() => overlay.remove(), 360);
  }

  return { render };
})();
