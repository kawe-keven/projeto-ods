// ============================================================
//  auth.js — Autenticação e gerenciamento de usuários
//  NOTA: armazenamento em localStorage é apenas para demo.
//        Em produção, substitua por chamadas à API com senhas
//        hasheadas no servidor.
// ============================================================

const Auth = (() => {

  const KEY_LOGGED = "samu_logged";
  const KEY_USER   = "samu_user";
  const USERS_KEY  = "samu_users_db";

  // ── Hierarquia de perfis (índice 0 = maior privilégio) ──────
  const ROLES = [
    { id: "admin",    label: "Administrador",    level: 3, badge: "badge-admin"    },
    { id: "coord",    label: "Coordenador",       level: 2, badge: "badge-coord"    },
    { id: "medico",   label: "Médico Regulador",  level: 1, badge: "badge-medico"   },
    { id: "operador", label: "Operador",           level: 0, badge: "badge-operador" },
  ];

  // ── Usuários padrão (seed inicial) ─────────────────────────
  const _SEED = [
    { id: 1, username: "admin",    password: "admin123", name: "Admin Sistema",   roleId: "admin",    org: "SAMU / SE", initials: "AD", active: true },
    { id: 2, username: "coord",    password: "samu2026", name: "Dr. L. Silva",    roleId: "coord",    org: "SAMU / SE", initials: "LS", active: true },
    { id: 3, username: "medico",   password: "med2026",  name: "Dra. C. Araujo",  roleId: "medico",   org: "SAMU / SE", initials: "CA", active: true },
    { id: 4, username: "operador", password: "op2026",   name: "Op. R. Santos",   roleId: "operador", org: "SAMU / SE", initials: "RS", active: true },
  ];

  // ── Persistência ────────────────────────────────────────────
  function _initDB() {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(_SEED));
    }
  }

  function _getDB() {
    _initDB();
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
      return _SEED.slice();
    }
  }

  function _saveDB(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // ── Perfis ──────────────────────────────────────────────────
  function getRoles() { return ROLES; }

  function getRoleById(id) {
    return ROLES.find(r => r.id === id) || ROLES[ROLES.length - 1];
  }

  // ── Sessão ──────────────────────────────────────────────────
  function login(username, password) {
    const users = _getDB();
    const found = users.find(u =>
      u.username === username.trim() && u.password === password && u.active
    );
    if (!found) return false;

    const role = getRoleById(found.roleId);
    sessionStorage.setItem(KEY_LOGGED, "true");
    sessionStorage.setItem(KEY_USER, JSON.stringify({
      id:        found.id,
      username:  found.username,
      name:      found.name,
      role:      role.label,
      roleId:    found.roleId,
      roleLevel: role.level,
      org:       found.org,
      initials:  found.initials,
    }));
    return true;
  }

  function logout() {
    sessionStorage.removeItem(KEY_LOGGED);
    sessionStorage.removeItem(KEY_USER);
    window.location.href = "login.html";
  }

  function isLogged() {
    return sessionStorage.getItem(KEY_LOGGED) === "true";
  }

  function guard() {
    if (!isLogged()) {
      window.location.replace("login.html");
      return false;
    }
    return true;
  }

  function getUser() {
    try {
      return JSON.parse(sessionStorage.getItem(KEY_USER)) || null;
    } catch {
      return null;
    }
  }

  function isAdmin() {
    const u = getUser();
    return u != null && (u.roleId === "admin" || u.role === "Administrador");
  }

  // ── CRUD de usuários (apenas admin) ─────────────────────────
  function getAllUsers() {
    return _getDB();
  }

  function createUser({ username, password, name, roleId, org, initials }) {
    const users = _getDB();
    if (users.find(u => u.username === username)) {
      return { ok: false, msg: "Nome de usuário já existe." };
    }
    const newId = Math.max(0, ...users.map(u => u.id)) + 1;
    const initls = initials ||
      name.split(" ").filter(Boolean).map(w => w[0]).join("").substring(0, 2).toUpperCase();
    users.push({
      id: newId, username, password, name,
      roleId, org: org || "SAMU / SE", initials: initls, active: true,
    });
    _saveDB(users);
    return { ok: true };
  }

  function updateUser(id, data) {
    const users = _getDB();
    const idx = users.findIndex(u => u.id === id);
    if (idx < 0) return { ok: false, msg: "Usuário não encontrado." };
    // Impede remover o último administrador ativo
    if (data.roleId && data.roleId !== "admin" && users[idx].roleId === "admin") {
      const adminCount = users.filter(u => u.roleId === "admin" && u.active).length;
      if (adminCount <= 1 && users[idx].active) {
        return { ok: false, msg: "Não é possível alterar o perfil do único administrador ativo." };
      }
    }
    if (data.active === false && users[idx].roleId === "admin") {
      const adminCount = users.filter(u => u.roleId === "admin" && u.active).length;
      if (adminCount <= 1) {
        return { ok: false, msg: "Não é possível desativar o único administrador ativo." };
      }
    }
    users[idx] = { ...users[idx], ...data };
    _saveDB(users);
    return { ok: true };
  }

  function deleteUser(id) {
    const users  = _getDB();
    const current = getUser();
    if (current && current.id === id) {
      return { ok: false, msg: "Não é possível excluir a sua própria conta." };
    }
    const target = users.find(u => u.id === id);
    if (!target) return { ok: false, msg: "Usuário não encontrado." };
    if (target.roleId === "admin") {
      const adminCount = users.filter(u => u.roleId === "admin" && u.active).length;
      if (adminCount <= 1) {
        return { ok: false, msg: "Não é possível excluir o único administrador ativo." };
      }
    }
    _saveDB(users.filter(u => u.id !== id));
    return { ok: true };
  }

  return { login, logout, isLogged, guard, getUser, isAdmin,
           getRoles, getRoleById, getAllUsers, createUser, updateUser, deleteUser };
})();
