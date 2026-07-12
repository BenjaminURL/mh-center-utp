document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const inputCedula = document.getElementById('login-cedula');
    const inputPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const credentialOptions = document.querySelectorAll('.credential-option');

    const USUARIO_ACTIVO_KEY = 'usuarioActivo';

    // Credenciales fijas para la demostración del prototipo.
    const usuarios = [
        {
            cedula: '8-111-111',
            password: '1234',
            nombre: 'Estudiante de prueba',
            correo: 'estudiante@utp.ac.pa',
            rol: 'estudiante',
            redirect: 'dashboard.html'
        },
        {
            cedula: '8-222-222',
            password: '1234',
            nombre: 'Psicólogo de prueba',
            correo: 'psicologo@utp.ac.pa',
            rol: 'psicologo',
            redirect: 'psicologo.html'
        }
    ];

    const normalizarCedula = (valor) => (valor || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    const mostrarError = (mensaje) => {
        loginError.textContent = mensaje;
    };

    const limpiarError = () => {
        loginError.textContent = '';
    };

    const guardarUsuarioActivo = (usuario) => {
        localStorage.setItem(USUARIO_ACTIVO_KEY, JSON.stringify({
            cedula: usuario.cedula,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol
        }));
    };

    credentialOptions.forEach((option) => {
        option.addEventListener('click', () => {
            inputCedula.value = option.dataset.cedula || '';
            inputPassword.value = option.dataset.password || '';
            limpiarError();
            inputPassword.focus();
        });
    });

    inputCedula.addEventListener('input', limpiarError);
    inputPassword.addEventListener('input', limpiarError);

    formLogin.addEventListener('submit', (event) => {
        event.preventDefault();

        const cedulaIngresada = normalizarCedula(inputCedula.value);
        const passwordIngresado = inputPassword.value.trim();

        if (!cedulaIngresada || !passwordIngresado) {
            mostrarError('Ingrese la cédula y la contraseña.');
            return;
        }

        const usuarioEncontrado = usuarios.find((usuario) => (
            normalizarCedula(usuario.cedula) === cedulaIngresada
            && usuario.password === passwordIngresado
        ));

        if (!usuarioEncontrado) {
            mostrarError('Cédula o contraseña incorrecta. Verifique las credenciales.');
            inputPassword.value = '';
            inputPassword.focus();
            return;
        }

        guardarUsuarioActivo(usuarioEncontrado);
        window.location.href = usuarioEncontrado.redirect;
    });
});
