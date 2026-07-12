document.addEventListener('DOMContentLoaded', () => {
  const USUARIOS_KEY = 'usuariosRegistrados';
  const REGISTRO_EXITOSO_KEY = 'registroEstudianteExitoso';

  const form = document.getElementById('form-registro-estudiante');
  const errorBox = document.getElementById('registro-error');

  form.addEventListener('submit', event => {
    event.preventDefault();
    errorBox.textContent = '';

    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const cedula = document.getElementById('cedula').value.trim();
    const correo = document.getElementById('correo').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();
    const confirmarPassword = document.getElementById('confirmar-password').value.trim();

    if (!nombre || !apellido || !cedula || !correo || !password || !confirmarPassword) {
      mostrarError('Complete todos los campos obligatorios.');
      return;
    }

    if (!correoValido(correo)) {
      mostrarError('Ingrese un correo electrónico válido.');
      return;
    }

    if (password.length < 4) {
      mostrarError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (password !== confirmarPassword) {
      mostrarError('Las contraseñas no coinciden.');
      return;
    }

    const usuariosRegistrados = leerJson(USUARIOS_KEY, []);
    const cedulasReservadas = ['8-111-111', '8-222-222', '8-333-333'];
    const correosReservados = [
      'estudiante@utp.ac.pa',
      'psicologo@utp.ac.pa',
      'directora@utp.ac.pa'
    ];

    const cedulaExiste = cedulasReservadas.some(item =>
      normalizarCedula(item) === normalizarCedula(cedula)
    ) || usuariosRegistrados.some(usuario =>
      normalizarCedula(usuario.cedula) === normalizarCedula(cedula)
    );

    if (cedulaExiste) {
      mostrarError('Ya existe un usuario registrado con esa cédula.');
      return;
    }

    const correoExiste = correosReservados.includes(correo)
      || usuariosRegistrados.some(usuario =>
        String(usuario.correo || '').trim().toLowerCase() === correo
      );

    if (correoExiste) {
      mostrarError('Ya existe un usuario registrado con ese correo.');
      return;
    }

    const nuevoEstudiante = {
      id: Date.now(),
      nombre: `${nombre} ${apellido}`,
      nombres: nombre,
      apellido,
      cedula,
      correo,
      password,
      rol: 'estudiante',
      creadoEn: new Date().toISOString()
    };

    usuariosRegistrados.push(nuevoEstudiante);
    localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuariosRegistrados));

    sessionStorage.setItem(REGISTRO_EXITOSO_KEY, JSON.stringify({ cedula }));
    window.location.href = 'login.html';
  });

  function mostrarError(mensaje) {
    errorBox.textContent = mensaje;
  }

  function normalizarCedula(valor) {
    return String(valor || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function correoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
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
