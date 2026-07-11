document.addEventListener('DOMContentLoaded', () => {
    const requestBtn = document.getElementById('btn-request');
    const viewBtn = document.getElementById('btn-view');
    const notificationBtn = document.getElementById('notification-btn');
    const profileAvatar = document.getElementById('profile-avatar');

    requestBtn.addEventListener('click', () => {
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
});