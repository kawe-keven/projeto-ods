// ============================================================
//  sidebar.js — Renderiza e controla a sidebar de navegação
// ============================================================

const Sidebar = (() => {

  let _activeId = "map";

  function render() {
    const el = document.getElementById("sidebar");
    if (!el) return;

    // Lê dados do usuário autenticado (se disponível)
    const u = (typeof Auth !== "undefined") ? Auth.getUser() : null;
    const name     = u ? u.name     : "Dr. L. Silva";
    const role     = u ? u.role     : "Coord. de Risco Cardíaco";
    const org      = u ? u.org      : "SAMU / SE";
    const initials = u ? u.initials : "LS";

    el.innerHTML = `
      <div class="sidebar-profile">
        <div class="avatar">${initials}</div>
        <div class="profile-name">${name}</div>
        <div class="profile-role">${role}</div>
        <div class="profile-org">${org}</div>
      </div>

      <nav class="sidebar-nav" id="sidebarNav"></nav>

      <div class="sidebar-footer">
        <button class="status-dot online" id="sidebarLogoutBtn" title="Sair da conta">
          <span class="status-dot-icon">&#x23FB;</span>
        </button>
      </div>
    `;

    _renderNav();

    // Bind logout
    const logoutBtn = document.getElementById("sidebarLogoutBtn");
    if (logoutBtn && typeof Auth !== "undefined") {
      logoutBtn.addEventListener("click", () => Auth.logout());
    }
  }

  function _renderNav() {
    const nav = document.getElementById("sidebarNav");
    if (!nav) return;

    nav.innerHTML = APP_DATA.navItems.map(item => `
      <button class="nav-item${item.id === _activeId ? " active" : ""}"
              data-id="${item.id}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
      </button>
    `).join("");

    nav.querySelectorAll(".nav-item").forEach(btn => {
      btn.addEventListener("click", () => {
        _activeId = btn.dataset.id;
        _renderNav();
        if (window.Router) Router.navigate(_activeId);
      });
    });
  }

  function activateById(id) {
    _activeId = id;
    _renderNav();
    if (window.Router) Router.navigate(id);
  }

  return { render, activateById };
})();
