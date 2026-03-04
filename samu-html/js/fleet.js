// ============================================================
//  fleet.js  Painel de Ambulâncias — Lista + Cadastro
// ============================================================

const FleetPanel = (() => {

  let _activeTab = "list"; // "list" | "add"

  // ── Render principal ────────────────────────────────────────
  function render() {
    const el = document.getElementById("fleetPanel");
    if (!el) return;

    el.innerHTML = `
      <div class="fleet-tabs">
        <button class="fleet-tab${_activeTab === "list" ? " active" : ""}" data-tab="list">
          🚑 Cadastradas (${APP_DATA.ambulances.length})
        </button>
        <button class="fleet-tab${_activeTab === "add" ? " active" : ""}" data-tab="add">
          ＋ Nova Ambulância
        </button>
      </div>

      <div class="fleet-tab-body" id="fleetTabBody"></div>
    `;

    el.querySelectorAll(".fleet-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        _activeTab = btn.dataset.tab;
        render();
      });
    });

    if (_activeTab === "list") _renderList();
    else                       _renderForm();
  }

  // ── Aba 1: lista de ambulâncias ──────────────────────────────
  function _renderList() {
    const body = document.getElementById("fleetTabBody");
    if (!body) return;

    const ambs  = APP_DATA.ambulances;
    const avail = ambs.filter(a => a.status === "available").length;
    const busy  = ambs.filter(a => a.status === "busy").length;
    const maint = ambs.filter(a => a.status === "maintenance").length;

    body.innerHTML = `
      <div class="fleet-top">
        <div class="fleet-sub-title">STATUS DA FROTA (TOTAL: ${ambs.length})</div>
        <div class="fleet-chart-row">
          <div id="donutChart"></div>
          <div class="fleet-legend">
            ${legendItem("green",  "Disponível: " + avail)}
            ${legendItem("red",    "Em Serviço: " + busy)}
            ${legendItem("yellow", "Manutenção: " + maint)}
          </div>
        </div>
      </div>

      <div class="fleet-table-wrap">
        <div class="fleet-sub-title">POSICIONAMENTO POR ZONA DE RISCO</div>
        <table class="inc-table">
          <thead>
            <tr><th>ID</th><th>Status</th><th>Zona</th><th>Cobertura</th><th></th></tr>
          </thead>
          <tbody>
            ${ambs.map((a, i) => `
              <tr>
                <td class="amb-id">${a.id}</td>
                <td><span class="badge ${a.status}">${_statusLabel(a.status)}</span></td>
                <td>${a.zona}</td>
                <td class="cov-cell">${a.cobertura}</td>
                <td><button class="amb-del-btn" data-idx="${i}" title="Remover">✕</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const donutEl = document.getElementById("donutChart");
    if (donutEl) {
      donutEl.appendChild(Charts.donut({ available: avail, busy, maintenance: maint }));
    }

    body.querySelectorAll(".amb-del-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        APP_DATA.ambulances.splice(idx, 1);
        render();
      });
    });
  }

  // ── Aba 2: formulário de cadastro ────────────────────────────
  function _renderForm() {
    const body = document.getElementById("fleetTabBody");
    if (!body) return;

    // Gera próximo ID automático
    const nextNum = APP_DATA.ambulances.length + 1;
    const nextId  = "A-" + String(nextNum).padStart(2, "0");

    body.innerHTML = `
      <div class="amb-form-wrap">
        <div class="fleet-sub-title" style="margin-bottom:8px">CADASTRAR NOVA AMBULÂNCIA</div>

        <div class="amb-form-grid">

          <label class="amb-form-label">
            ID
            <input class="amb-input" id="af-id" type="text"
              value="${nextId}" placeholder="Ex: A-09" />
          </label>

          <label class="amb-form-label">
            Nome / Rótulo
            <input class="amb-input" id="af-label" type="text"
              value="SAMU ${nextId}" placeholder="Ex: SAMU A-09" />
          </label>

          <label class="amb-form-label">
            Status
            <select class="amb-input" id="af-status">
              <option value="available">Disponível</option>
              <option value="busy">Em Serviço</option>
              <option value="maintenance">Manutenção</option>
            </select>
          </label>

          <label class="amb-form-label">
            Zona de Risco
            <input class="amb-input" id="af-zona" type="text"
              placeholder="Ex: Centro" />
          </label>

          <label class="amb-form-label" style="grid-column:span 2">
            Cobertura
            <input class="amb-input" id="af-cob" type="text"
              placeholder="Ex: Centro / Siq. Campos" />
          </label>

          <label class="amb-form-label">
            Latitude
            <input class="amb-input" id="af-lat" type="number" step="0.0001"
              placeholder="-10.9300" />
          </label>

          <label class="amb-form-label">
            Longitude
            <input class="amb-input" id="af-lng" type="number" step="0.0001"
              placeholder="-37.0700" />
          </label>

        </div>

        <div id="amb-form-msg" class="amb-form-msg"></div>

        <div class="amb-form-actions">
          <button class="amb-btn-cancel" id="af-cancel">Cancelar</button>
          <button class="amb-btn-save"   id="af-save">✔ Cadastrar</button>
        </div>
      </div>
    `;

    document.getElementById("af-cancel")?.addEventListener("click", () => {
      _activeTab = "list";
      render();
    });

    document.getElementById("af-save")?.addEventListener("click", () => {
      _submitForm();
    });
  }

  function _submitForm() {
    const id     = document.getElementById("af-id")?.value.trim();
    const label  = document.getElementById("af-label")?.value.trim();
    const status = document.getElementById("af-status")?.value;
    const zona   = document.getElementById("af-zona")?.value.trim();
    const cob    = document.getElementById("af-cob")?.value.trim();
    const lat    = parseFloat(document.getElementById("af-lat")?.value);
    const lng    = parseFloat(document.getElementById("af-lng")?.value);
    const msg    = document.getElementById("amb-form-msg");

    const errors = [];
    if (!id)                     errors.push("ID obrigatório");
    if (APP_DATA.ambulances.some(a => a.id === id)) errors.push(`ID "${id}" já existe`);
    if (!zona)                   errors.push("Zona obrigatória");
    if (isNaN(lat))              errors.push("Latitude inválida");
    if (isNaN(lng))              errors.push("Longitude inválida");

    if (errors.length) {
      if (msg) { msg.textContent = errors.join(" • "); msg.className = "amb-form-msg error"; }
      return;
    }

    APP_DATA.ambulances.push({
      id, label: label || `SAMU ${id}`, lat, lng, status,
      zona, cobertura: cob || zona,
    });

    if (msg) { msg.textContent = `Ambulância ${id} cadastrada com sucesso!`; msg.className = "amb-form-msg success"; }
    setTimeout(() => { _activeTab = "list"; render(); }, 900);
  }

  // ── Helpers ──────────────────────────────────────────────────
  function _statusLabel(s) {
    return s === "available" ? "Disponível" : s === "busy" ? "Em Serviço" : "Manutenção";
  }

  function legendItem(color, label) {
    return `<div class="legend-item"><span class="legend-dot ${color}"></span><span>${label}</span></div>`;
  }

  return { render };
})();
