// ============================================================
//  header.js — Barra de status superior
// ============================================================

const Header = (() => {

  let _clockInterval = null;

  function render() {
    const el = document.getElementById("header");
    if (!el) return;

    const crit   = APP_DATA.pharmacyPoints.filter(p => p.weight >= 8).length;
    const hosps  = APP_DATA.hospitals;
    const hiOcup = hosps.filter(h => h.ocupacao >= 85).length;

    el.innerHTML = `
      ${item("Data:",             _formatDate())}
      <div class="header-divider"></div>
      ${item("Hora:", `<span id="hdrClock" class="accent-cyan">${_formatTime()}</span>`)}
      <div class="header-divider"></div>
      ${item("Zonas Críticas:",  String(crit),  "accent-red")}
      <div class="header-divider"></div>
      ${item("Hospitais Críticos:", String(hiOcup), hiOcup > 0 ? "accent-red pulse" : "accent-green")}
      <div class="header-divider"></div>
      ${item("Fonte:", "Farmácias • Anti-hipertensivos", "accent-blue")}
      <div class="header-divider"></div>
      ${item("Cidade:", "Aracaju / SE")}
    `;

    if (_clockInterval) clearInterval(_clockInterval);
    _clockInterval = setInterval(() => {
      const clockEl = document.getElementById("hdrClock");
      if (clockEl) clockEl.textContent = _formatTime();
    }, 1000);
  }

  function _formatDate() { return new Date().toLocaleDateString("pt-BR"); }
  function _formatTime() { return new Date().toLocaleTimeString("pt-BR"); }

  function item(label, value, cls = "") {
    return `
      <div class="header-item">
        <span class="header-label">${label}</span>
        <span class="header-value ${cls}">${value}</span>
      </div>
    `;
  }

  return { render };
})();
