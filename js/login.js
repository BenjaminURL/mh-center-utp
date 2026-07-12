document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('form-login');
  const inputCedula = document.getElementById('login-cedula');
  const inputPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const loginSuccess = document.getElementById('login-success');
  const credentialOptions = document.querySelectorAll('.credential-option');

  const USUARIO_ACTIVO_KEY = 'usuarioActivo';
  const USUARIOS_REGISTRADOS_KEY = 'usuariosRegistrados';
  const REGISTRO_EXITOSO_KEY = 'registroEstudianteExitoso';

  const usuariosBase = [
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
    },
    {
      cedula: '8-333-333',
      password: '1234',
      nombre: 'Directora de Orientación Psicológica',
      correo: 'directora@utp.ac.pa',
      rol: 'directora',
      redirect: 'directora.html'
    }
  ];

  mostrarRegistroExitoso();

  credentialOptions.forEach(option => {
    option.addEventListener('click', () => {
      inputCedula.value = option.dataset.cedula || '';
      inputPassword.value = option.dataset.password || '';
      limpiarMensajes();
      inputPassword.focus();
    });
  });

  inputCedula.addEventListener('input', limpiarMensajes);
  inputPassword.addEventListener('input', limpiarMensajes);

  formLogin.addEventListener('submit', event => {
    event.preventDefault();

    const cedulaIngresada = normalizarCedula(inputCedula.value);
    const passwordIngresado = inputPassword.value.trim();

    if (!cedulaIngresada || !passwordIngresado) {
      mostrarError('Ingrese la cédula y la contraseña.');
      return;
    }

    const usuarioEncontrado = obtenerTodosLosUsuarios().find(usuario =>
      normalizarCedula(usuario.cedula) === cedulaIngresada
      && String(usuario.password) === passwordIngresado
    );

    if (!usuarioEncontrado) {
      mostrarError('Cédula o contraseña incorrecta. Verifique las credenciales.');
      inputPassword.value = '';
      inputPassword.focus();
      return;
    }

    localStorage.setItem(USUARIO_ACTIVO_KEY, JSON.stringify({
      cedula: usuarioEncontrado.cedula,
      nombre: usuarioEncontrado.nombre,
      correo: usuarioEncontrado.correo,
      rol: usuarioEncontrado.rol
    }));

    window.location.href = usuarioEncontrado.redirect;
  });

  function obtenerTodosLosUsuarios() {
    const registrados = leerJson(USUARIOS_REGISTRADOS_KEY, [])
      .filter(usuario =>
        usuario
        && ['estudiante', 'psicologo'].includes(usuario.rol)
        && usuario.cedula
        && usuario.password
      )
      .map(usuario => ({
        ...usuario,
        redirect: usuario.rol === 'estudiante'
          ? 'dashboard.html'
          : 'psicologo.html'
      }));

    const mapa = new Map();

    [...usuariosBase, ...registrados].forEach(usuario => {
      mapa.set(normalizarCedula(usuario.cedula), usuario);
    });

    return Array.from(mapa.values());
  }

  function mostrarRegistroExitoso() {
    try {
      const registro = JSON.parse(sessionStorage.getItem(REGISTRO_EXITOSO_KEY));

      if (!registro || !registro.cedula) return;

      inputCedula.value = registro.cedula;
      loginSuccess.textContent = 'Estudiante registrado correctamente. Ingrese su contraseña para acceder.';
      sessionStorage.removeItem(REGISTRO_EXITOSO_KEY);
      inputPassword.focus();
    } catch (error) {
      sessionStorage.removeItem(REGISTRO_EXITOSO_KEY);
    }
  }

  function normalizarCedula(valor) {
    return String(valor || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function mostrarError(mensaje) {
    loginError.textContent = mensaje;
    loginSuccess.textContent = '';
  }

  function limpiarMensajes() {
    loginError.textContent = '';
    loginSuccess.textContent = '';
  }

  function leerJson(clave, valorInicial) {
    try {
      const valor = JSON.parse(localStorage.getItem(clave));
      return Array.isArray(valor) ? valor : valorInicial;
    } catch (error) {
      return valorInicial;
    }
  }
});
