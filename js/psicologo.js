document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('btn-logout');

  const usuarioActivo = leerJson('usuarioActivo', null);

  if (!usuarioActivo || usuarioActivo.rol !== 'psicologo') {
    window.location.href = 'login.html';
    return;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('usuarioActivo');
      window.location.href = 'login.html';
    });
  }

  function leerJson(clave, valorInicial) {
    try {
      return JSON.parse(localStorage.getItem(clave)) || valorInicial;
    } catch (error) {
      return valorInicial;
    }
  }
});
