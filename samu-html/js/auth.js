// ============================================================
//  auth.js — Autenticação simples via sessionStorage
// ============================================================

const Auth = (() => {

  const KEY_LOGGED = "samu_logged";
  const KEY_USER   = "samu_user";
  const KEY_ROLE   = "samu_role";

  // Credenciais demo (simuladas — substitua por chamada real à API)
  const _USERS = [
    { user: "coord",  pass: "samu2026", name: "Dr. L. Silva",   role: "Coord. de Risco Cardíaco", org: "SAMU / SE", initials: "LS" },
    { user: "admin",  pass: "admin123", name: "Admin Sistema",   role: "Administrador",            org: "SAMU / SE", initials: "AD" },
    { user: "medico", pass: "med2026",  name: "Dra. C. Araujo",  role: "Médica Reguladora",        org: "SAMU / SE", initials: "CA" },
  ];

  function login(user, pass) {
    const found = _USERS.find(u => u.user === user.trim() && u.pass === pass);
    if (!found) return false;

    sessionStorage.setItem(KEY_LOGGED,  "true");
    sessionStorage.setItem(KEY_USER, JSON.stringify({
      name:     found.name,
      role:     found.role,
      org:      found.org,
      initials: found.initials,
    }));
    return true;
  }

  function logout() {
    sessionStorage.removeItem(KEY_LOGGED);
    sessionStorage.removeItem(KEY_USER);
    sessionStorage.removeItem(KEY_ROLE);
    window.location.href = "login.html";
  }

  function isLogged() {
    return sessionStorage.getItem(KEY_LOGGED) === "true";
  }

  // Redireciona para login se não autenticado. Chame no topo de cada página protegida.
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

  return { login, logout, isLogged, guard, getUser };
})();
