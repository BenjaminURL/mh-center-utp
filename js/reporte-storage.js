(() => {
  const REPORTES_KEY = 'reportesDiarios';
  const USUARIO_ACTIVO_KEY = 'usuarioActivo';

  const usuarioActivo = leerObjeto(USUARIO_ACTIVO_KEY);

  if (!usuarioActivo || !['psicologo', 'directora'].includes(usuarioActivo.rol)) {
    window.location.href = 'login.html';
    return;
  }

  const panelUrl = usuarioActivo.rol === 'directora'
    ? 'directora.html'
    : 'psicologo.html';

  const nombreInput = document.getElementById('psychologistName');
  const backLink = document.querySelector('.back-link');
  const confirmSendBtn = document.getElementById('confirmSendBtn');
  const closeSuccessBtn = document.getElementById('closeSuccessBtn');
  const infoAlert = document.getElementById('infoAlert');

  if (nombreInput) {
    nombreInput.value = usuarioActivo.nombre || nombreRol(usuarioActivo.rol);
  }

  if (backLink) {
    backLink.href = panelUrl;
  }

  actualizarAvisoDelDia();

  /*
   * Se ejecuta en fase de captura para guardar el reporte antes de que
   * reporte-diario.js cierre el modal de confirmación y muestre el éxito.
   */
  if (confirmSendBtn) {
    confirmSendBtn.addEventListener('click', guardarReporte, true);
  }

  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = panelUrl;
    }, true);
  }

  function guardarReporte() {
    /* Evita guardar dos veces por doble clic sobre el botón Enviar. */
    if (confirmSendBtn.dataset.reporteGuardado === 'true') {
      return;
    }

    const actividades = Array.from(
      document.querySelectorAll('.activity-row')
    ).map((row) => ({
      tipo: row.querySelector('.activity-type')?.value.trim() || '',
      descripcion: row.querySelector('.activity-description')?.value.trim() || '',
      duracion: row.querySelector('.activity-duration')?.value.trim() || '',
      observacion: row.querySelector('.activity-observation')?.value.trim() || ''
    }));

    const observacionesGenerales = document
      .getElementById('generalObservations')
      ?.value.trim() || '';

    /*
     * El botón Enviar solo aparece después de validar el formulario, pero se
     * conserva esta verificación para impedir reportes vacíos si el HTML cambia.
     */
    if (!actividades.length || actividades.some(actividad =>
      !actividad.tipo
      || !actividad.descripcion
      || !actividad.duracion
      || !actividad.observacion
    ) || !observacionesGenerales) {
      return;
    }

    const ahora = new Date();
    const fechaISO = fechaLocalISO(ahora);
    const fechaTexto = document.getElementById('reportDate')?.textContent || formatearFecha(ahora);
    const reportes = leerLista(REPORTES_KEY);

    const reporte = {
      id: crearIdReporte(usuarioActivo.cedula),
      fechaISO,
      fechaTexto,
      psicologoCedula: usuarioActivo.cedula || '',
      psicologoNombre: usuarioActivo.nombre || nombreRol(usuarioActivo.rol),
      correo: usuarioActivo.correo || '',
      rol: usuarioActivo.rol,
      actividades,
      observacionesGenerales,
      creadoEn: ahora.toISOString(),
      enviadoEn: ahora.toISOString()
    };

    /* Cada envío se conserva como un reporte independiente. */
    reportes.push(reporte);
    localStorage.setItem(REPORTES_KEY, JSON.stringify(reportes));

    confirmSendBtn.dataset.reporteGuardado = 'true';
  }

  function actualizarAvisoDelDia() {
    if (!infoAlert) return;

    const hoy = fechaLocalISO(new Date());
    const cantidad = leerLista(REPORTES_KEY).filter(reporte =>
      normalizarCedula(reporte.psicologoCedula) === normalizarCedula(usuarioActivo.cedula)
      && reporte.fechaISO === hoy
    ).length;

    if (!cantidad) return;

    const titulo = infoAlert.querySelector('strong');
    const texto = infoAlert.querySelector('p');

    if (titulo) {
      titulo.textContent = cantidad === 1
        ? 'Ya enviaste 1 reporte hoy.'
        : `Ya enviaste ${cantidad} reportes hoy.`;
    }

    if (texto) {
      texto.textContent = 'Puedes registrar otro reporte; cada envío quedará guardado por separado.';
    }
  }

  function crearIdReporte(cedula) {
    const parteCedula = normalizarCedula(cedula) || 'colaborador';
    const aleatorio = Math.random().toString(36).slice(2, 8);
    return `${parteCedula}-${Date.now()}-${aleatorio}`;
  }

  function fechaLocalISO(fecha) {
    return [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0')
    ].join('-');
  }

  function formatearFecha(fecha) {
    return [
      String(fecha.getDate()).padStart(2, '0'),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      fecha.getFullYear()
    ].join('/');
  }

  function nombreRol(rol) {
    return rol === 'directora'
      ? 'Directora de Orientación Psicológica'
      : 'Psicólogo(a)';
  }

  function normalizarCedula(valor) {
    return String(valor || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function leerLista(clave) {
    try {
      const valor = JSON.parse(localStorage.getItem(clave));
      return Array.isArray(valor) ? valor : [];
    } catch (error) {
      return [];
    }
  }

  function leerObjeto(clave) {
    try {
      const valor = JSON.parse(localStorage.getItem(clave));
      return valor && typeof valor === 'object' && !Array.isArray(valor)
        ? valor
        : null;
    } catch (error) {
      return null;
    }
  }
})();
