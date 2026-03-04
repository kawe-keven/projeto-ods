// ============================================================
//  zones.js — Painel de Zonas Críticas de Risco Cardíaco
//  Ranking de bairros por índice de venda de anti-hipertensivos
// ============================================================

const ZonesPanel = (() => {

  function render() {
    const el = document.getElementById("zonesPanel");
    if (!el) return;

    // ── Agrupa farmácias por bairro e calcula métricas ─────
    const byBairro = {};
    APP_DATA.pharmacyPoints.forEach(p => {
      if (!byBairro[p.bairro]) byBairro[p.bairro] = [];
      byBairro[p.bairro].push(p.weight);
    });

    const zones = Object.entries(byBairro).map(([bairro, ws]) => {
      const avg = ws.reduce((s, v) => s + v, 0) / ws.length;
      return {
        bairro,
        avg,
        max:   Math.max(...ws),
        count: ws.length,
        level: _level(avg),
      };
    }).sort((a, b) => b.avg - a.avg);

    const totalPts   = APP_DATA.pharmacyPoints.length;
    const overallAvg = APP_DATA.pharmacyPoints.reduce((s, p) => s + p.weight, 0) / totalPts;

    const critZones = zones.filter(z => z.avg >= 8);
    const highZones = zones.filter(z => z.avg >= 6 && z.avg < 8);
    const medZones  = zones.filter(z => z.avg >= 4 && z.avg < 6);
    const lowZones  = zones.filter(z => z.avg < 4);

    el.innerHTML = `
      <div class="zones-stats-row">
        <div class="zones-stat">
          <span class="zs-val" style="color:var(--red)">${critZones.length}</span>
          <span class="zs-lbl">Críticas</span>
        </div>
        <div class="zones-stat">
          <span class="zs-val" style="color:var(--orange)">${highZones.length}</span>
          <span class="zs-lbl">Alto Risco</span>
        </div>
        <div class="zones-stat">
          <span class="zs-val" style="color:var(--yellow)">${medZones.length}</span>
          <span class="zs-lbl">Médio Risco</span>
        </div>
        <div class="zones-stat">
          <span class="zs-val" style="color:var(--green)">${lowZones.length}</span>
          <span class="zs-lbl">Baixo Risco</span>
        </div>
        <div class="zones-stat">
          <span class="zs-val accent-cyan">${overallAvg.toFixed(1)}</span>
          <span class="zs-lbl">Índice Médio</span>
        </div>
      </div>

      <div class="zones-scroll-wrap">
        <div class="fleet-sub-title" style="margin:4px 0 8px">
          RANKING DE RISCO CARDÍACO — ${zones.length} ZONAS MONITORADAS / ${totalPts} FARMÁCIAS
        </div>

        <div class="zones-list">
          ${zones.map((z, i) => _rowHtml(z, i + 1)).join("")}
        </div>

        <div class="fleet-sub-title" style="margin:14px 0 8px">RECOMENDAÇÕES OPERACIONAIS</div>
        ${_recsHtml(critZones, highZones)}
      </div>
    `;
  }

  // ── Helpers ──────────────────────────────────────────────
  function _level(avg) {
    if (avg >= 8) return "critical";
    if (avg >= 6) return "high";
    if (avg >= 4) return "medium";
    return "low";
  }

  function _levelColor(level) {
    return level === "critical" ? "var(--red)"
         : level === "high"     ? "var(--orange)"
         : level === "medium"   ? "var(--yellow)"
         :                        "var(--green)";
  }

  function _levelLabel(level) {
    return level === "critical" ? "CRÍTICO"
         : level === "high"     ? "ALTO"
         : level === "medium"   ? "MÉDIO"
         :                        "BAIXO";
  }

  function _levelAction(level) {
    return level === "critical" ? "Patrulha preventiva imediata"
         : level === "high"     ? "Atenção elevada recomendada"
         : level === "medium"   ? "Monitoramento contínuo"
         :                        "Rotina normal";
  }

  function _rowHtml(z, rank) {
    const clr  = _levelColor(z.level);
    const pct  = (z.avg / 10) * 100;
    const rkClr = rank <= 3 ? clr : "var(--t3)";
    return `
      <div class="zone-row">
        <span class="zone-rank" style="color:${rkClr}">#${rank}</span>
        <div class="zone-info">
          <span class="zone-name">${z.bairro}</span>
          <span class="zone-action">${_levelAction(z.level)}</span>
        </div>
        <div class="zone-bar-wrap">
          <div class="zone-bar-fill" style="width:${pct.toFixed(0)}%;background:${clr};box-shadow:0 0 6px ${clr}80"></div>
        </div>
        <div class="zone-metrics">
          <span class="zone-avg" style="color:${clr}">${z.avg.toFixed(1)}</span>
          <span class="zone-badge-lv" style="color:${clr};border-color:${clr}40">${_levelLabel(z.level)}</span>
          <span class="zone-pts">${z.count}pt</span>
        </div>
      </div>`;
  }

  function _recsHtml(critical, high) {
    if (!critical.length && !high.length) {
      return `<div class="rec-empty">Nenhuma zona de risco elevado identificada.</div>`;
    }

    const items = [
      ...critical.map(z => ({
        icon: "🔴", priority: "URGENTE", clr: "var(--red)",
        text: `Reforçar cobertura em <b>${z.bairro}</b> — índice ${z.avg.toFixed(1)}/10 (${z.count} farmácias monitoradas)`,
      })),
      ...high.map(z => ({
        icon: "🟠", priority: "ATENÇÃO", clr: "var(--orange)",
        text: `Monitorar <b>${z.bairro}</b> — índice ${z.avg.toFixed(1)}/10 (${z.count} farmácias monitoradas)`,
      })),
    ];

    return `
      <div class="rec-list">
        ${items.map(it => `
          <div class="rec-row">
            <span class="rec-icon">${it.icon}</span>
            <div class="rec-content">
              <span class="rec-priority" style="color:${it.clr}">${it.priority}</span>
              <span class="rec-text">${it.text}</span>
            </div>
          </div>`).join("")}
      </div>`;
  }

  return { render };
})();
