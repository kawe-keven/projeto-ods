// ============================================================
//  hospitals.js — Painel de Hospitais
//  Ocupação de leitos + Disponibilidade para novos infartos
// ============================================================

const HospitalsPanel = (() => {

  // ── Helpers de cálculo ───────────────────────────────────

  function _availableCardiac(h) {
    return Math.round(h.leitosCardiaco * (1 - h.ocupacaoCardiaco / 100));
  }

  function _availableGeneral(h) {
    return Math.round(h.leitos * (1 - h.ocupacao / 100));
  }

  // status para novos infartos: considera leitos cardíacos disponíveis
  // e se a unidade possui hemodinâmica (essencial para IAM STEMI)
  function _infStatus(h) {
    const avail = _availableCardiac(h);
    if (avail === 0)         return { key: "critico",    label: "CRÍTICO",     clr: "var(--red)"    };
    if (avail <= 2)          return { key: "limitado",   label: "LIMITADO",    clr: "var(--orange)" };
    return                          { key: "disponivel", label: "DISPONÍVEL",  clr: "var(--green)"  };
  }

  function _barClr(pct) {
    if (pct >= 90) return "var(--red)";
    if (pct >= 75) return "var(--orange)";
    return "var(--green)";
  }

  // mini sparkline SVG com 7 barras
  function _sparkline(values, clr) {
    const max   = Math.max(...values, 1);
    const W     = 80, H = 28, barW = 9, gap = 2;
    const bars  = values.map((v, i) => {
      const bh = Math.max(3, Math.round((v / max) * H));
      const x  = i * (barW + gap);
      const y  = H - bh;
      return `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="2" fill="${clr}" opacity="${v === max ? '1' : '0.45'}"/>`;
    }).join("");
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
  }

  // ── Sub-componentes HTML ─────────────────────────────────

  function _availabilityCard(h) {
    const st    = _infStatus(h);
    const avail = _availableCardiac(h);
    const availG = _availableGeneral(h);

    return `
      <div class="hav-card">
        <div class="hav-header">
          <span class="hav-badge ${h.tipo === 'Hospital' ? 'hav-badge-h' : 'hav-badge-u'}">${h.tipo === 'Hospital' ? 'H' : 'U'}</span>
          <span class="hav-name">${h.label}</span>
        </div>
        <div class="hav-status" style="color:${st.clr}">
          <span class="hav-status-dot" style="background:${st.clr}"></span>
          ${st.label}
        </div>
        <div class="hav-meta">
          <span class="hav-avail-num" style="color:${st.clr}">${avail}</span>
          <span class="hav-avail-lbl">leito${avail !== 1 ? 's' : ''} cardíaco${avail !== 1 ? 's' : ''}</span>
        </div>
        ${h.temHemodinamica
          ? `<span class="hav-hemof hav-hemof-yes">🫀 Hemodinâmica${h.hemoDadoReal ? '<sup class="hav-real-sup"> CNES</sup>' : ''}</span>`
          : `<span class="hav-hemof hav-hemof-no">⚠️ Sem Hemo.</span>`}
        <div class="hav-general">${availG} leito${availG !== 1 ? 's' : ''} geral disp.</div>
        <div class="hav-src-row">
          <span class="hav-src-tag">${h.fonteLeitos ?? "CNES"}</span>
          <span class="hav-src-tag hav-src-occ">${h.fonteOcupacao ?? "Modelo"}</span>
        </div>
      </div>`;
  }

  function _hospitalCard(h) {
    const st      = _infStatus(h);
    const cardClr = _barClr(h.ocupacaoCardiaco);
    const genClr  = _barClr(h.ocupacao);
    const spClr   = h.ocupacaoCardiaco >= 90 ? "var(--red)"
                  : h.ocupacaoCardiaco >= 75 ? "var(--orange)"
                  : "var(--cyan)";
    const sumHoje = h.infarctosHoje;
    const sum7d   = h.infarctos7d.reduce((s, v) => s + v, 0);
    const med7d   = (sum7d / 7).toFixed(1);

    return `
      <div class="hdet-card">
        <!-- cabeçalho do card -->
        <div class="hdet-header">
          <span class="hdet-badge ${h.tipo === 'Hospital' ? 'hdet-badge-h' : 'hdet-badge-u'}">${h.tipo === 'Hospital' ? 'H' : 'U'}</span>
          <div class="hdet-title-wrap">
            <span class="hdet-name">${h.label}</span>
            <div class="hdet-chips">
              <span class="hdet-chip">${h.tipo}</span>
              ${h.temHemodinamica
                ? `<span class="hdet-chip hdet-chip-hemo">🫀 Hemodinâmica${h.hemoDadoReal ? '<sup class="chip-real"> CNES</sup>' : ''}</span>`
                : `<span class="hdet-chip hdet-chip-warn">Sem Hemodinâmica</span>`}
              <span class="hdet-chip hdet-chip-src" title="Fonte dos leitos">📋 ${h.fonteLeitos ?? 'CNES'}</span>
              <span class="hdet-chip hdet-chip-occ" title="Fonte da taxa de ocupação">📊 ${h.fonteOcupacao ?? 'Modelo'}</span>
            </div>
          </div>
          <div class="hdet-status-wrap">
            <span class="hdet-status-label" style="color:${st.clr}">${st.label}</span>
            <span class="hdet-resp">⏱ ${h.tempResposta} min</span>
          </div>
        </div>

        <!-- gráficos de barras duplos -->
        <div class="hdet-bars">
          <!-- ocupação geral -->
          <div class="hdet-bar-block">
            <div class="hdet-bar-label">
              <span>Ocupação Geral</span>
              <span style="color:${genClr};font-weight:700">${h.ocupacao}%</span>
            </div>
            <div class="hdet-bar-track">
              <div class="hdet-bar-fill" style="width:${h.ocupacao}%;background:${genClr}"></div>
            </div>
            <div class="hdet-bar-sub">${_availableGeneral(h)} / ${h.leitos} leitos disponíveis</div>
          </div>

          <!-- ocupação cardíaca -->
          <div class="hdet-bar-block">
            <div class="hdet-bar-label">
              <span>UTI Cardiológica</span>
              <span style="color:${cardClr};font-weight:700">${h.ocupacaoCardiaco}%</span>
            </div>
            <div class="hdet-bar-track">
              <div class="hdet-bar-fill" style="width:${h.ocupacaoCardiaco}%;background:${cardClr}"></div>
              <!-- marcador de alerta nos 90% -->
              <div class="hdet-bar-marker" style="left:90%"></div>
            </div>
            <div class="hdet-bar-sub">${_availableCardiac(h)} / ${h.leitosCardiaco} leitos cardíacos disponíveis</div>
          </div>
        </div>

        <!-- rodapé do card: stats + sparkline -->
        <div class="hdet-footer">
          <div class="hdet-foot-stats">
            <div class="hdet-foot-stat">
              <span class="hdet-foot-val" style="color:${h.infarctosHoje > 0 ? 'var(--orange)' : 'var(--green)'}">${sumHoje}</span>
              <span class="hdet-foot-lbl">IAM hoje</span>
            </div>
            <div class="hdet-foot-divider"></div>
            <div class="hdet-foot-stat">
              <span class="hdet-foot-val" style="color:var(--cyan)">${med7d}</span>
              <span class="hdet-foot-lbl">média / dia</span>
            </div>
            <div class="hdet-foot-divider"></div>
            <div class="hdet-foot-stat">
              <span class="hdet-foot-val" style="color:var(--t2)">${sum7d}</span>
              <span class="hdet-foot-lbl">total 7 dias</span>
            </div>
          </div>
          <div class="hdet-sparkline">
            <span class="hdet-spark-label">IAM — últimos 7 dias</span>
            ${_sparkline(h.infarctos7d, spClr)}
            <div class="hdet-spark-days">
              ${['D-6','D-5','D-4','D-3','D-2','D-1','Hoje'].map(d => `<span>${d}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── Render principal ─────────────────────────────────────

  function _fmtAgo(date) {
    if (!date) return "—";
    const s = Math.round((Date.now() - date.getTime()) / 1000);
    if (s < 60)  return `${s}s atrás`;
    if (s < 3600) return `${Math.floor(s / 60)}m atrás`;
    return `${Math.floor(s / 3600)}h atrás`;
  }

  function render() {
    const el = document.getElementById("hospPanel");
    if (!el) return;

    const hosps = APP_DATA.hospitals;

    // totais para o stats row
    const totalLeitos      = hosps.reduce((s, h) => s + h.leitos,          0);
    const totalDisp        = hosps.reduce((s, h) => s + _availableGeneral(h), 0);
    const totalCard        = hosps.reduce((s, h) => s + h.leitosCardiaco,  0);
    const totalCardDisp    = hosps.reduce((s, h) => s + _availableCardiac(h), 0);
    const comHemo          = hosps.filter(h => h.temHemodinamica).length;
    const ufDisponiveis    = hosps.filter(h => _infStatus(h).key === "disponivel").length;
    const infarctosHoje    = hosps.reduce((s, h) => s + h.infarctosHoje,   0);
    const lastAt           = typeof RealData !== "undefined" ? RealData.lastOcupacaoAt() : null;

    el.innerHTML = `
      <!-- ── Barra de controle de dados ── -->
      <div class="hosp-data-bar">
        <div class="hdb-sources">
          <span class="hdb-src-chip hdb-src-cnes">📋 Leitos: CNES/DATASUS</span>
          <span class="hdb-src-chip hdb-src-model">📊 Ocupação: SES-SE · CFM 2024</span>
          <span class="hdb-src-chip hdb-src-hemo" id="hemoSrcChip">🫀 Hemo: CNES Serviços</span>
        </div>
        <div class="hdb-right">
          <span class="hdb-timestamp" id="hospTimestamp">
            Atualizado: ${lastAt ? lastAt.toLocaleTimeString("pt-BR") : "—"}
          </span>
          <button class="hdb-refresh-btn" id="btnRefreshOcup" title="Recalcular ocupação com horário atual">
            ↻ Atualizar
          </button>
        </div>
      </div>

      <!-- ── Stats rápidas ── -->
      <div class="hosp-stats-row">
        <div class="hosp-stat">
          <span class="hs-val" style="color:var(--cyan)">${totalLeitos}</span>
          <span class="hs-lbl">Total de Leitos</span>
        </div>
        <div class="hosp-stat">
          <span class="hs-val" style="color:var(--green)">${totalDisp}</span>
          <span class="hs-lbl">Leitos Disponíveis</span>
        </div>
        <div class="hosp-stat">
          <span class="hs-val" style="color:var(--t1)">${totalCard}</span>
          <span class="hs-lbl">Leitos Cardíacos</span>
        </div>
        <div class="hosp-stat">
          <span class="hs-val" style="color:${totalCardDisp > 5 ? 'var(--green)' : totalCardDisp > 0 ? 'var(--orange)' : 'var(--red)'}">${totalCardDisp}</span>
          <span class="hs-lbl">Cardíacos Livres</span>
        </div>
        <div class="hosp-stat">
          <span class="hs-val" style="color:var(--cyan)">${comHemo}</span>
          <span class="hs-lbl">Com Hemodinâmica</span>
        </div>
        <div class="hosp-stat">
          <span class="hs-val" style="color:${infarctosHoje > 5 ? 'var(--red)' : 'var(--orange)'}">${infarctosHoje}</span>
          <span class="hs-lbl">IAM Hoje</span>
        </div>
      </div>

      <div class="hosp-scroll-wrap">

        <!-- ── Disponibilidade para infartos ── -->
        <div class="fleet-sub-title" style="margin:6px 0 8px">
          DISPONIBILIDADE PARA NOVOS CASOS DE INFARTO — ${ufDisponiveis} UNIDADE${ufDisponiveis !== 1 ? 'S' : ''} RECEPTORAS
        </div>

        <div class="hav-grid">
          ${hosps.map(h => _availabilityCard(h)).join("")}
        </div>

        <!-- ── Ocupação detalhada ── -->
        <div class="fleet-sub-title" style="margin:16px 0 8px">
          OCUPAÇÃO DETALHADA POR UNIDADE
        </div>

        <div class="hdet-list">
          ${hosps.map(h => _hospitalCard(h)).join("")}
        </div>

      </div>
    `;

    _bindEvents();
  }

  // ── Auto-refresh e botão ────────────────────────────────────

  let _refreshTimer = null;

  function _bindEvents() {
    const btn = document.getElementById("btnRefreshOcup");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "↻ Atualizando…";
      await _doRefresh();
      btn.disabled = false;
      btn.textContent = "↻ Atualizar";
    });

    // Auto-refresh a cada 5 minutos
    if (_refreshTimer) clearInterval(_refreshTimer);
    _refreshTimer = setInterval(() => _doRefresh(), 5 * 60 * 1000);
  }

  async function _doRefresh() {
    if (typeof RealData !== "undefined") {
      await RealData.refreshOcupacao();
    }
    render();
  }

  // Expõe refresh manual (para uso externo)
  async function refresh() { await _doRefresh(); }

  return { render, refresh };
})();
