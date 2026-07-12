document.addEventListener('DOMContentLoaded', () => {
  const USUARIOS_KEY = 'usuariosRegistrados';
  const USUARIO_ACTIVO_KEY = 'usuarioActivo';

  const form = document.getElementById('form-colaborador');
  const errorBox = document.getElementById('form-error');
  const successBox = document.getElementById('form-success');

  const usuarioActivo = leerJson(USUARIO_ACTIVO_KEY, null);
  if (!usuarioActivo || usuarioActivo.rol !== 'directora') {
    window.location.href = 'login.html';
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    limpiarMensajes();

    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const cedula = document.getElementById('cedula').value.trim();
    const correo = document.getElementById('correo').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();

    if (!nombre || !apellido || !cedula || !correo || !password) {
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

    const usuariosRegistrados = leerJson(USUARIOS_KEY, []);
    const cedulasReservadas = ['8-111-111', '8-222-222', '8-333-333'];
    const correosReservados = [
      'estudiante@utp.ac.pa',
      'psicologo@utp.ac.pa',
      'directora@utp.ac.pa'
    ];

    const cedulaExiste = cedulasReservadas.some(item => normalizarCedula(item) === normalizarCedula(cedula))
      || usuariosRegistrados.some(usuario => normalizarCedula(usuario.cedula) === normalizarCedula(cedula));

    if (cedulaExiste) {
      mostrarError('Ya existe un usuario registrado con esa cédula.');
      return;
    }

    const correoExiste = correosReservados.includes(correo)
      || usuariosRegistrados.some(usuario => String(usuario.correo || '').toLowerCase() === correo);

    if (correoExiste) {
      mostrarError('Ya existe un usuario registrado con ese correo.');
      return;
    }

    const nuevoPsicologo = {
      id: Date.now(),
      nombre: `${nombre} ${apellido}`,
      nombres: nombre,
      apellido,
      cedula,
      correo,
      password,
      rol: 'psicologo',
      creadoPor: usuarioActivo.cedula,
      creadoEn: new Date().toISOString()
    };

    usuariosRegistrados.push(nuevoPsicologo);
    localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuariosRegistrados));

    form.reset();
    successBox.textContent = `Colaborador registrado. Cédula: ${cedula} | Contraseña: ${password}`;
  });

  function normalizarCedula(valor) {
    return String(valor || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function correoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  }

  function mostrarError(mensaje) {
    errorBox.textContent = mensaje;
    successBox.textContent = '';
  }

  function limpiarMensajes() {
    errorBox.textContent = '';
    successBox.textContent = '';
  }

  function leerJson(clave, valorInicial) {
    try {
      const valor = JSON.parse(localStorage.getItem(clave));
      return Array.isArray(valor) || (valor && typeof valor === 'object') ? valor : valorInicial;
    } catch (error) {
      return valorInicial;
    }
  }
});
