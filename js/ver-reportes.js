document.addEventListener('DOMContentLoaded', () => {
  const REPORTES_KEY = 'reportesDiarios';
  const USUARIO_ACTIVO_KEY = 'usuarioActivo';

  const reportsList = document.getElementById('reports-list');
  const emptyState = document.getElementById('empty-reports');
  const reportCount = document.getElementById('report-count');
  const filterName = document.getElementById('filter-name');
  const filterDate = document.getElementById('filter-date');
  const clearFilters = document.getElementById('clear-filters');

  const usuarioActivo = leerObjeto(USUARIO_ACTIVO_KEY);

  if (!usuarioActivo || usuarioActivo.rol !== 'directora') {
    window.location.href = 'login.html';
    return;
  }

  filterName?.addEventListener('input', render);
  filterDate?.addEventListener('change', render);
  clearFilters?.addEventListener('click', () => {
    filterName.value = '';
    filterDate.value = '';
    render();
  });

  /* Refresca la lista si otro formulario modifica los reportes en otra pestaña. */
  window.addEventListener('storage', (event) => {
    if (event.key === REPORTES_KEY) render();
  });

  render();

  function render() {
    const texto = normalizar(filterName?.value);
    const fecha = filterDate?.value || '';

    const reportes = leerLista(REPORTES_KEY)
      .filter(esReporteProfesional)
      .filter((reporte) => {
        const datosProfesional = [
          reporte.psicologoNombre,
          reporte.psicologoCedula,
          reporte.correo,
          etiquetaRol(reporte.rol)
        ].join(' ');

        const coincideTexto = !texto || normalizar(datosProfesional).includes(texto);
        const coincideFecha = !fecha || reporte.fechaISO === fecha;

        return coincideTexto && coincideFecha;
      })
      .sort((a, b) => fechaOrden(b) - fechaOrden(a));

    reportCount.textContent = `${reportes.length} ${reportes.length === 1 ? 'reporte' : 'reportes'}`;
    emptyState.style.display = reportes.length ? 'none' : 'block';
    reportsList.innerHTML = reportes.map(crearTarjetaReporte).join('');
  }

  function esReporteProfesional(reporte) {
    return reporte
      && ['psicologo', 'directora'].includes(reporte.rol)
      && Array.isArray(reporte.actividades);
  }

  function crearTarjetaReporte(reporte) {
    const actividades = reporte.actividades;
    const filas = actividades.map((actividad, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapar(actividad.tipo || 'Sin especificar')}</td>
        <td>${escapar(actividad.descripcion || 'Sin descripción')}</td>
        <td>${escapar(actividad.duracion || 'Sin duración')}</td>
        <td>${escapar(actividad.observacion || 'Sin observación')}</td>
      </tr>
    `).join('');

    const fechaEnvio = reporte.enviadoEn || reporte.creadoEn;
    const fechaReporte = reporte.fechaTexto || formatearFechaISO(reporte.fechaISO) || 'Fecha no disponible';

    return `
      <article class="report-item">
        <header class="report-item-header">
          <div class="report-author">
            <div class="report-author-line">
              <h2>${escapar(reporte.psicologoNombre || 'Colaborador')}</h2>
              <span class="report-role-badge ${reporte.rol === 'directora' ? 'is-director' : ''}">
                ${escapar(etiquetaRol(reporte.rol))}
              </span>
            </div>
            <p>
              ${escapar(reporte.psicologoCedula || 'Sin cédula')}
              ·
              ${escapar(reporte.correo || 'Sin correo')}
            </p>
          </div>

          <div class="report-date-group">
            <span class="report-date-badge">${escapar(fechaReporte)}</span>
            <small>${escapar(formatearFechaHora(fechaEnvio))}</small>
          </div>
        </header>

        <div class="report-summary">
          <span><strong>${actividades.length}</strong> ${actividades.length === 1 ? 'actividad' : 'actividades'}</span>
          <span>Reporte ID: ${escapar(String(reporte.id || 'sin-id'))}</span>
        </div>

        <div class="report-table-wrap">
          <table class="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Actividad</th>
                <th>Descripción</th>
                <th>Duración</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>

        <div class="general-note">
          <strong>Observaciones generales</strong>
          <p>${escapar(reporte.observacionesGenerales || 'Sin observaciones generales.')}</p>
        </div>
      </article>
    `;
  }

  function etiquetaRol(rol) {
    return rol === 'directora' ? 'Directora' : 'Psicólogo(a)';
  }

  function fechaOrden(reporte) {
    const fecha = reporte.enviadoEn || reporte.creadoEn || reporte.fechaISO;
    const valor = new Date(fecha).getTime();
    return Number.isFinite(valor) ? valor : 0;
  }

  function formatearFechaHora(valor) {
    if (!valor) return 'Hora de envío no disponible';

    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return 'Hora de envío no disponible';

    return `Enviado: ${new Intl.DateTimeFormat('es-PA', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(fecha)}`;
  }

  function formatearFechaISO(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))) return '';
    const [anio, mes, dia] = valor.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  function normalizar(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function escapar(valor) {
    return String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
});
