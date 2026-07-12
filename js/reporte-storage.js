(() => {
  const REPORTES_KEY = 'reportesDiarios';
  const USUARIO_ACTIVO_KEY = 'usuarioActivo';

  const usuarioActivo = leerJson(USUARIO_ACTIVO_KEY, null);
  if (!usuarioActivo || !['psicologo', 'directora'].includes(usuarioActivo.rol)) {
    window.location.href = 'login.html';
    return;
  }

  const panelUrl = usuarioActivo.rol === 'directora' ? 'directora.html' : 'psicologo.html';
  const nombreInput = document.getElementById('psychologistName');
  const backLink = document.querySelector('.back-link');
  const confirmSendBtn = document.getElementById('confirmSendBtn');
  const closeSuccessBtn = document.getElementById('closeSuccessBtn');

  if (nombreInput) {
    nombreInput.value = usuarioActivo.nombre || 'Colaborador';
  }

  if (backLink) {
    backLink.href = panelUrl;
  }

  if (confirmSendBtn) {
    confirmSendBtn.addEventListener('click', guardarReporte);
  }

  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = panelUrl;
    }, true);
  }

  function guardarReporte() {
    const actividades = Array.from(document.querySelectorAll('.activity-row')).map(row => ({
      tipo: row.querySelector('.activity-type')?.value.trim() || '',
      descripcion: row.querySelector('.activity-description')?.value.trim() || '',
      duracion: row.querySelector('.activity-duration')?.value.trim() || '',
      observacion: row.querySelector('.activity-observation')?.value.trim() || ''
    }));

    const hoy = new Date();
    const fechaISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const fechaTexto = document.getElementById('reportDate')?.textContent || fechaISO;

    const reportes = leerJson(REPORTES_KEY, []);
    const indiceExistente = reportes.findIndex(reporte =>
      normalizarCedula(reporte.psicologoCedula) === normalizarCedula(usuarioActivo.cedula)
      && reporte.fechaISO === fechaISO
    );

    const reporte = {
      id: indiceExistente >= 0 ? reportes[indiceExistente].id : Date.now(),
      fechaISO,
      fechaTexto,
      psicologoCedula: usuarioActivo.cedula,
      psicologoNombre: usuarioActivo.nombre || 'Colaborador',
      correo: usuarioActivo.correo || '',
      rol: usuarioActivo.rol,
      actividades,
      observacionesGenerales: document.getElementById('generalObservations')?.value.trim() || '',
      creadoEn: new Date().toISOString()
    };

    if (indiceExistente >= 0) {
      reportes[indiceExistente] = reporte;
    } else {
      reportes.push(reporte);
    }

    localStorage.setItem(REPORTES_KEY, JSON.stringify(reportes));
  }

  function normalizarCedula(valor) {
    return String(valor || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function leerJson(clave, valorInicial) {
    try {
      const valor = JSON.parse(localStorage.getItem(clave));
      return valor ?? valorInicial;
    } catch (error) {
      return valorInicial;
    }
  }
})();
