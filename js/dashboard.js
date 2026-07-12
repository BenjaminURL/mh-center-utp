document.addEventListener('DOMContentLoaded', () => {
    const requestBtn = document.getElementById('btn-request');
    const viewBtn = document.getElementById('btn-view');
    const notificationBtn = document.getElementById('notification-btn');
    const profileAvatar = document.getElementById('profile-avatar');
    const logoutBtn = document.getElementById('btn-logout');

    const usuarioActivo = leerJson('usuarioActivo', null);

    if (!usuarioActivo || usuarioActivo.rol !== 'estudiante') {
        window.location.href = 'login.html';
        return;
    }

    requestBtn.addEventListener('click', () => {
        localStorage.removeItem('utp_cita_reagendar_id');
        console.log('Abriendo formulario de solicitud de cita...');
    });

    viewBtn.addEventListener('click', () => {
        console.log('Cargando historial de citas del estudiante...');
    });

    notificationBtn.addEventListener('click', () => {
        console.log('Desplegando panel de notificaciones...');
    });

    profileAvatar.addEventListener('click', () => {
        console.log('Abriendo menú de perfil de usuario...');
    });

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
