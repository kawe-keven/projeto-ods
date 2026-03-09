// ============================================================
//  settings.js — Painel de Configurações e Metodologia
// ============================================================

const SettingsPanel = (() => {

  function render() {
    const el = document.getElementById("settingsPanel");
    if (!el) return;

    const u = (typeof Auth !== "undefined") ? Auth.getUser() : null;
    const bairros    = new Set(APP_DATA.pharmacyPoints.map(p => p.bairro)).size;
    const totalPts   = APP_DATA.pharmacyPoints.length;
    const overallAvg = (APP_DATA.pharmacyPoints.reduce((s, p) => s + p.weight, 0) / totalPts).toFixed(1);
    const critCount  = APP_DATA.pharmacyPoints.filter(p => p.weight >= 8).length;
    const hosps      = APP_DATA.hospitals;
    const hiOcup     = hosps.filter(h => h.ocupacao >= 85).length;

    el.innerHTML = `
      <div class="settings-wrap">

        <div class="settings-section">
          <div class="fleet-sub-title" style="margin-bottom:10px">FONTE DE DADOS</div>
          ${_row("Tipo de dado",            "Vendas de Anti-hipertensivos",          "accent-cyan")}
          ${_row("Abrangência",             "Aracaju / SE")}
          ${_row("Farmácias monitoradas",   `${totalPts} pontos`,                    "accent-green")}
          ${_row("Bairros cobertos",        `${bairros} bairros`)}
          ${_row("Índice médio atual",      `${overallAvg} / 10`)}
          ${_row("Pontos de alto risco",    `${critCount} farmácias (índice ≥ 8)`,   "accent-red")}
        </div>

        <div class="settings-section">
          <div class="fleet-sub-title" style="margin-bottom:10px">HOSPITAIS MONITORADOS</div>
          ${_row("Total de unidades",    `${hosps.length} unidades`)}
          ${_row("Hospitais",            `${hosps.filter(h => h.tipo === "Hospital").length}`)}
          ${_row("UPAs",                 `${hosps.filter(h => h.tipo === "UPA").length}`)}
          ${_row("Leitos totais",        `${hosps.reduce((s, h) => s + h.leitos, 0)} leitos`)}
          ${_row("Com ocupação crítica", `${hiOcup} unidade(s)`,  hiOcup > 0 ? "accent-red" : "accent-green")}
        </div>

        <div class="settings-section">
          <div class="fleet-sub-title" style="margin-bottom:10px">MAPA 3D</div>
          ${_row("Provedor",      MAP_CONFIG.provider.toUpperCase(),      "accent-cyan")}
          ${_row("Estilo",       MAP_CONFIG.mapbox?.style ?? "—")}
          ${_row("Tecnologia",   "Mapbox GL JS v3 + deck.gl v8")}
          ${_row("Inclinação",   `${MAP_CONFIG.deckgl.pitch}°`)}
          ${_row("Centro",       "-10.9472, -37.0731",                    "si-mono")}
          ${_row("Zoom inicial", `${MAP_CONFIG.deckgl.zoom}`)}
        </div>

        <div class="settings-section">
          <div class="fleet-sub-title" style="margin-bottom:10px">METODOLOGIA</div>
          <p class="settings-desc">
            O <b style="color:var(--cyan)">índice de risco cardíaco</b> é calculado com base no volume
            de vendas de medicamentos anti-hipertensivos (losartana, enalapril, captopril, entre outros)
            por farmácia. Regiões com maior consumo indicam maior prevalência de hipertensão arterial —
            principal fator de risco para paradas cardíacas e AVC.<br><br>
            O índice varia de <b style="color:var(--green)">0 (sem risco detectado)</b> a
            <b style="color:var(--red)">10 (risco crítico)</b>, permitindo priorização
            geográfica das equipes do SAMU.
          </p>
          <div class="settings-scale">
            <div class="scale-row">
              <span class="scale-dot" style="background:var(--green)"></span>
              <span><b style="color:var(--green)">0 – 3</b>&nbsp; Baixo risco — rotina normal</span>
            </div>
            <div class="scale-row">
              <span class="scale-dot" style="background:var(--yellow)"></span>
              <span><b style="color:var(--yellow)">4 – 5</b>&nbsp; Risco moderado — monitoramento contínuo</span>
            </div>
            <div class="scale-row">
              <span class="scale-dot" style="background:var(--orange)"></span>
              <span><b style="color:var(--orange)">6 – 7</b>&nbsp; Alto risco — atenção elevada</span>
            </div>
            <div class="scale-row">
              <span class="scale-dot" style="background:var(--red)"></span>
              <span><b style="color:var(--red)">8 – 10</b> Risco crítico — patrulha preventiva imediata</span>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="fleet-sub-title" style="margin-bottom:10px">SISTEMA</div>
          ${_row("Versão",               "1.0.0")}
          ${_row("Última atualização",   "Março / 2026")}
          ${_row("Operador",             "Dr. L. Silva")}
          ${_row("Organização",          "SAMU / Sergipe")}
          ${_row("Especialidade",        "Coord. de Risco Cardíaco")}
        </div>

      </div>
    `;
  }

  function _row(label, value, cls = "") {
    return `
      <div class="settings-info-row">
        <span class="si-label">${label}:</span>
        <span class="si-val ${cls}">${value}</span>
      </div>`;
  }

  function _bindLogout() {
    const btn = document.getElementById("settingsLogoutBtn");
    if (btn && typeof Auth !== "undefined") {
      btn.addEventListener("click", () => Auth.logout());
    }
  }

  return { render, _bindLogout };
})();
