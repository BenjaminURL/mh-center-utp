document.addEventListener('DOMContentLoaded', () => {
  const usuarioActivo = leerJson('usuarioActivo', null);
  const logoutBtn = document.getElementById('btn-logout');

  if (!usuarioActivo || usuarioActivo.rol !== 'directora') {
    window.location.href = 'login.html';
    return;
  }

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('usuarioActivo');
    window.location.href = 'login.html';
  });

  function leerJson(clave, valorInicial) {
    try {
      return JSON.parse(localStorage.getItem(clave)) || valorInicial;
    } catch (error) {
      return valorInicial;
    }
  }
});
