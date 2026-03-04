// ============================================================
//  performance.js — Painel de Hospitais e Zonas de Risco
// ============================================================

const PerfPanel = (() => {

  function render() {
    const el = document.getElementById("perfPanel");
    if (!el) return;

    const hosps      = APP_DATA.hospitals;
    const critZones  = APP_DATA.pharmacyPoints.filter(p => p.weight >= 8);
    const highZones  = APP_DATA.pharmacyPoints.filter(p => p.weight >= 6 && p.weight < 8);

    el.innerHTML = `
      <div class="hosp-stats-row">
        <div class="hosp-stat">
          <span class="hs-val accent-red">${critZones.length}</span>
          <span class="hs-lbl">Zonas Críticas</span>
        </div>
        <div class="hosp-stat">
          <span class="hs-val accent-orange">${highZones.length}</span>
          <span class="hs-lbl">Zonas Altas</span>
        </div>
        <div class="hosp-stat">
          <span class="hs-val accent-cyan">${hosps.length}</span>
          <span class="hs-lbl">Unidades</span>
        </div>
      </div>

      <div class="fleet-sub-title" style="margin:4px 0">UNIDADES DE SAÚDE — OCUPAÇÃO</div>

      <div class="perf-scroll-wrap">
        <div class="hosp-list">
          ${hosps.map(h => {
            const pct    = h.ocupacao;
            const barClr = pct >= 85 ? "var(--red)" : pct >= 70 ? "var(--orange)" : "var(--green)";
            const badge  = h.tipo === "Hospital" ? "hosp-badge-h" : "hosp-badge-u";
            return `
            <div class="hosp-row">
              <span class="hosp-badge ${badge}">${h.tipo === "Hospital" ? "H" : "U"}</span>
              <span class="hosp-name">${h.label}</span>
              <div class="hosp-bar-wrap">
                <div class="hosp-bar" style="width:${pct}%;background:${barClr}"></div>
              </div>
              <span class="hosp-pct" style="color:${barClr}">${pct}%</span>
              <span class="hosp-leitos">${h.leitos}lt</span>
            </div>`;
          }).join("")}
        </div>

        <div class="fleet-sub-title" style="margin:10px 0 5px">ÍNDICE DE RISCO CARDÍACO POR ZONA</div>
        <div id="riskBarWrap"></div>
      </div>
    `;

    _renderRiskBars(el);
  }

  function _renderRiskBars(el) {
    // Agrupa pontos por bairro e calcula média
    const byBairro = {};
    APP_DATA.pharmacyPoints.forEach(p => {
      if (!byBairro[p.bairro]) byBairro[p.bairro] = [];
      byBairro[p.bairro].push(p.weight);
    });
    const zones = Object.entries(byBairro)
      .map(([b, ws]) => ({ bairro: b, avg: ws.reduce((s,v)=>s+v,0)/ws.length }))
      .sort((a, b) => b.avg - a.avg);

    const wrap = el.querySelector("#riskBarWrap");
    if (!wrap) return;

    wrap.innerHTML = zones.map(z => {
      const pct  = (z.avg / 10) * 100;
      const clr  = z.avg >= 8 ? "var(--red)" : z.avg >= 6 ? "var(--orange)" : z.avg >= 4 ? "var(--yellow)" : "var(--green)";
      return `
        <div class="risk-bar-row">
          <span class="risk-bairro">${z.bairro}</span>
          <div class="risk-bar-track">
            <div class="risk-bar-fill" style="width:${pct.toFixed(0)}%;background:${clr}"></div>
          </div>
          <span class="risk-val" style="color:${clr}">${z.avg.toFixed(1)}</span>
        </div>`;
    }).join("");
  }

  return { render };
})();
