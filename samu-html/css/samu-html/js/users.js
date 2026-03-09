// ============================================================
//  users.js — Painel de Gerenciamento de Usuários (admin only)
// ============================================================

const UsersPanel = (() => {

  // ── Render principal ──────────────────────────────────────
  function render() {
    const el = document.getElementById("usersPanel");
    if (!el) return;

    if (!Auth.isAdmin()) {
      el.innerHTML = `
        <div class="users-restricted">
          <div class="users-restricted-icon">🔒</div>
          <div class="users-restricted-text">Acesso restrito — apenas Administradores</div>
        </div>`;
      return;
    }

    el.innerHTML = `
      <div class="users-wrap">

        <!-- Header da seção com botão -->
        <div class="users-header">
          <div class="users-title">👤 Gerenciamento de Usuários</div>
          <button class="users-add-btn" id="usersAddBtn">
            <span>＋</span><span>Novo Usuário</span>
          </button>
        </div>

        <!-- Legenda de hierarquia -->
        <div class="users-roles-legend">
          <div class="users-roles-legend-title">Hierarquia de Perfis</div>
          <div class="roles-legend-list" id="rolesLegend"></div>
        </div>

        <!-- Tabela de usuários -->
        <div class="users-table-wrap">
          <table class="users-table">
            <thead>
              <tr>
                <th></th>
                <th>Usuário</th>
                <th>Nome</th>
                <th>Perfil</th>
                <th>Organização</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="usersTableBody"></tbody>
          </table>
        </div>

      </div>

      <!-- Modal Criar / Editar -->
      <div class="users-modal-overlay hidden" id="usersModalOverlay">
        <div class="users-modal">
          <div class="users-modal-title" id="usersModalTitle">Novo Usuário</div>
          <div class="users-modal-form" id="usersModalForm"></div>
          <div class="um-error" id="usersModalError"></div>
          <div class="users-modal-actions">
            <button class="um-btn cancel" id="usersModalCancel">Cancelar</button>
            <button class="um-btn primary" id="usersModalSave">Salvar</button>
          </div>
        </div>
      </div>
    `;

    _renderRolesLegend();
    _renderTable();
    _bindAddBtn();
    _bindModalCancel();
    _bindOverlayClose();
  }

  // ── Renderiza legenda de perfis ───────────────────────────
  function _renderRolesLegend() {
    const el = document.getElementById("rolesLegend");
    if (!el) return;
    const roles = Auth.getRoles().slice().reverse(); // exibe do menor para o maior
    const descs = {
      "operador": "Visualização básica — mapa e consultas",
      "medico":   "Visualização + painel clínico e hospitalar",
      "coord":    "Visualização completa + configurações operacionais",
      "admin":    "Acesso total — gerencia usuários, perfis e sistema",
    };
    el.innerHTML = roles.map((r, i) => `
      <div class="roles-legend-row">
        <span class="roles-legend-level">N${r.level}</span>
        <span class="role-badge ${r.badge}">${r.label}</span>
        <span class="roles-legend-desc">${descs[r.id] || ""}</span>
      </div>
    `).join("");
  }

  // ── Renderiza tabela ──────────────────────────────────────
  function _renderTable() {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;
    const users = Auth.getAllUsers();
    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--t3);padding:24px">Nenhum usuário cadastrado.</td></tr>`;
      return;
    }
    tbody.innerHTML = users.map(u => {
      const role = Auth.getRoleById(u.roleId);
      const activeClass = u.active ? "active" : "inactive";
      const activeLabel = u.active ? "Ativo" : "Inativo";
      const toggleLabel = u.active ? "Desativar" : "Ativar";
      return `
        <tr data-uid="${u.id}">
          <td><div class="users-avatar">${u.initials}</div></td>
          <td style="font-family:'JetBrains Mono',monospace;font-size:12px">${_esc(u.username)}</td>
          <td>${_esc(u.name)}</td>
          <td><span class="role-badge ${role.badge}">${role.label}</span></td>
          <td style="color:var(--t2);font-size:12px">${_esc(u.org)}</td>
          <td><span class="user-status ${activeClass}">${activeLabel}</span></td>
          <td>
            <div class="users-actions">
              <button class="users-action-btn edit" data-action="edit" data-uid="${u.id}">Editar</button>
              <button class="users-action-btn toggle" data-action="toggle" data-uid="${u.id}">${toggleLabel}</button>
              <button class="users-action-btn del" data-action="delete" data-uid="${u.id}">Excluir</button>
            </div>
          </td>
        </tr>`;
    }).join("");

    tbody.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const uid = parseInt(btn.dataset.uid, 10);
        const action = btn.dataset.action;
        if (action === "edit")   _openEditModal(uid);
        if (action === "toggle") _toggleUser(uid);
        if (action === "delete") _deleteUser(uid);
      });
    });
  }

  // ── Botão "Novo Usuário" ──────────────────────────────────
  function _bindAddBtn() {
    const btn = document.getElementById("usersAddBtn");
    if (btn) btn.addEventListener("click", () => _openCreateModal());
  }

  // ── Modal: fechar ─────────────────────────────────────────
  function _bindModalCancel() {
    const btn = document.getElementById("usersModalCancel");
    if (btn) btn.addEventListener("click", _closeModal);
  }

  function _bindOverlayClose() {
    const overlay = document.getElementById("usersModalOverlay");
    if (overlay) {
      overlay.addEventListener("click", e => {
        if (e.target === overlay) _closeModal();
      });
    }
  }

  function _openModal() {
    const overlay = document.getElementById("usersModalOverlay");
    if (overlay) overlay.classList.remove("hidden");
  }

  function _closeModal() {
    const overlay = document.getElementById("usersModalOverlay");
    if (overlay) overlay.classList.add("hidden");
    const err = document.getElementById("usersModalError");
    if (err) { err.textContent = ""; err.classList.remove("visible"); }
  }

  // ── Modal: Criar usuário ──────────────────────────────────
  function _openCreateModal() {
    document.getElementById("usersModalTitle").textContent = "Novo Usuário";
    _buildForm({});
    document.getElementById("usersModalSave").onclick = _submitCreate;
    _openModal();
  }

  function _submitCreate() {
    const data = _readForm();
    if (!data) return;
    if (!data.password) {
      _showError("A senha é obrigatória para novos usuários.");
      return;
    }
    const result = Auth.createUser(data);
    if (!result.ok) { _showError(result.msg); return; }
    _closeModal();
    _renderTable();
  }

  // ── Modal: Editar usuário ─────────────────────────────────
  function _openEditModal(id) {
    const users = Auth.getAllUsers();
    const user  = users.find(u => u.id === id);
    if (!user) return;
    document.getElementById("usersModalTitle").textContent = "Editar Usuário";
    _buildForm(user, true);
    document.getElementById("usersModalSave").onclick = () => _submitEdit(id);
    _openModal();
  }

  function _submitEdit(id) {
    const data = _readForm();
    if (!data) return;
    // Senha em branco → não altera
    if (!data.password) delete data.password;
    const result = Auth.updateUser(id, data);
    if (!result.ok) { _showError(result.msg); return; }
    _closeModal();
    _renderTable();
  }

  // ── Toggle ativo/inativo ──────────────────────────────────
  function _toggleUser(id) {
    const users = Auth.getAllUsers();
    const user  = users.find(u => u.id === id);
    if (!user) return;
    const result = Auth.updateUser(id, { active: !user.active });
    if (!result.ok) { alert(result.msg); return; }
    _renderTable();
  }

  // ── Excluir usuário ───────────────────────────────────────
  function _deleteUser(id) {
    const users = Auth.getAllUsers();
    const user  = users.find(u => u.id === id);
    if (!user) return;
    const confirmed = confirm(`Excluir o usuário "${user.name}" (${user.username})?\nEsta ação não pode ser desfeita.`);
    if (!confirmed) return;
    const result = Auth.deleteUser(id);
    if (!result.ok) { alert(result.msg); return; }
    _renderTable();
  }

  // ── Formulário modal (HTML) ───────────────────────────────
  function _buildForm(user, isEdit = false) {
    const roles   = Auth.getRoles();
    const formEl  = document.getElementById("usersModalForm");
    const passPlaceholder = isEdit ? "Deixe em branco para não alterar" : "Mínimo 6 caracteres";
    formEl.innerHTML = `
      <div class="um-field">
        <label class="um-label" for="umUsername">Usuário (login)</label>
        <input class="um-input" id="umUsername" type="text" autocomplete="off"
               placeholder="ex: joao.silva" value="${_esc(user.username || '')}" />
      </div>
      <div class="um-field">
        <label class="um-label" for="umName">Nome completo</label>
        <input class="um-input" id="umName" type="text" autocomplete="off"
               placeholder="ex: Dr. João Silva" value="${_esc(user.name || '')}" />
      </div>
      <div class="um-field">
        <label class="um-label" for="umPassword">Senha</label>
        <input class="um-input" id="umPassword" type="password" autocomplete="new-password"
               placeholder="${passPlaceholder}" />
      </div>
      <div class="um-field">
        <label class="um-label" for="umRole">Perfil / Hierarquia</label>
        <select class="um-select" id="umRole">
          ${roles.map(r => `
            <option value="${r.id}" ${(user.roleId === r.id) ? "selected" : ""}>
              N${r.level} — ${r.label}
            </option>`).join("")}
        </select>
      </div>
      <div class="um-field">
        <label class="um-label" for="umOrg">Organização</label>
        <input class="um-input" id="umOrg" type="text" autocomplete="off"
               placeholder="ex: SAMU / SE" value="${_esc(user.org || 'SAMU / SE')}" />
      </div>
    `;
    const err = document.getElementById("usersModalError");
    if (err) { err.textContent = ""; err.classList.remove("visible"); }
  }

  function _readForm() {
    const username = document.getElementById("umUsername")?.value.trim();
    const name     = document.getElementById("umName")?.value.trim();
    const password = document.getElementById("umPassword")?.value;
    const roleId   = document.getElementById("umRole")?.value;
    const org      = document.getElementById("umOrg")?.value.trim() || "SAMU / SE";

    if (!username) { _showError("Informe o nome de usuário."); return null; }
    if (!name)     { _showError("Informe o nome completo."); return null; }
    if (!roleId)   { _showError("Selecione um perfil."); return null; }
    if (password && password.length < 6) {
      _showError("A senha deve ter pelo menos 6 caracteres."); return null;
    }

    const initials = name.split(" ").filter(Boolean)
      .map(w => w[0]).join("").substring(0, 2).toUpperCase();

    return { username, name, password, roleId, org, initials };
  }

  function _showError(msg) {
    const el = document.getElementById("usersModalError");
    if (el) { el.textContent = "⚠️ " + msg; el.classList.add("visible"); }
  }

  // ── Utilitário anti-XSS ──────────────────────────────────
  function _esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  return { render };
})();
