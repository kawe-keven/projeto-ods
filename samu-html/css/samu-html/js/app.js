// ============================================================
//  app.js — Bootstrap + Router da aplicação
// ============================================================

var Router = (() => {
  const _pages = {
    hospitals:  { icon: "🏥", label: "HOSPITAIS — OCUPAÇÃO E DISPONIBILIDADE PARA INFARTOS" },
    zones:      { icon: "🔥", label: "ZONAS CRÍTICAS" },
    settings:   { icon: "⚙️",  label: "CONFIGURAÇÕES" },
    users:      { icon: "👥", label: "GERENCIAMENTO DE USUÁRIOS" },
  };

  function navigate(id) {
    // Hospitais → página dedicada
    if (id === "hospitals") {
      window.location.href = "hospitals.html";
      return;
    }

    const dashBody = document.querySelector(".dashboard-body");
    const pageView = document.getElementById("pageView");
    if (!dashBody || !pageView) return;

    if (id === "map") {
      dashBody.style.display = "";
      pageView.style.display = "none";
      pageView.innerHTML = "";
      return;
    }

    dashBody.style.display = "none";
    pageView.style.display = "";

    const meta = _pages[id] || { icon: "📄", label: id.toUpperCase() };
    const panelId = id === "hospitals" ? "hospPanel"
                  : id === "zones"     ? "zonesPanel"
                  : id === "settings"  ? "settingsPanel"
                  : id === "users"     ? "usersPanel"
                  : "genericPagePanel";

    pageView.innerHTML = `
      <div class="page-header">
        <button class="page-back-btn" id="pageBackBtn">← Voltar ao Mapa</button>
        <span class="page-title">${meta.icon} ${meta.label}</span>
      </div>
      <div class="page-panel" id="${panelId}"></div>
    `;

    document.getElementById("pageBackBtn")?.addEventListener("click", () => {
      Sidebar.activateById("map");
    });

    if (id === "hospitals")     HospitalsPanel.render();
    else if (id === "zones")    ZonesPanel.render();
    else if (id === "settings") { SettingsPanel.render(); SettingsPanel._bindLogout(); }
    else if (id === "users")    UsersPanel.render();
    else {
      const p = document.getElementById(panelId);
      if (p) p.innerHTML = `<div class="page-placeholder"><span class="page-placeholder-icon">${meta.icon}</span><span>${meta.label} — Em desenvolvimento</span></div>`;
    }
  }

  return { navigate };
})();

// ── Bootstrap ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  // Sidebar e header renderizam imediatamente (não dependem de dados do mapa)
  Sidebar.render();
  Header.render();

  // Busca dados reais (Overpass + CNES + IBGE) antes de renderizar o mapa
  await RealData.init();

  // Regera o header com as contagens corretas após os dados chegarem
  Header.render();

  // Renderiza o mapa com dados reais
  MapPanel.render();

  // Se vier de hospitals.html via ?nav=ID, navega automaticamente
  const urlNav = new URLSearchParams(window.location.search).get("nav");
  if (urlNav) {
    history.replaceState({}, "", window.location.pathname);
    Sidebar.activateById(urlNav);
  }
});
