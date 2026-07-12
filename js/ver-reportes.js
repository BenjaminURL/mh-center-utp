document.addEventListener('DOMContentLoaded', () => {
  const REPORTES_KEY = 'reportesDiarios';
  const USUARIO_ACTIVO_KEY = 'usuarioActivo';

  const reportsList = document.getElementById('reports-list');
  const emptyState = document.getElementById('empty-reports');
  const reportCount = document.getElementById('report-count');
  const filterName = document.getElementById('filter-name');
  const filterDate = document.getElementById('filter-date');
  const clearFilters = document.getElementById('clear-filters');

  const usuarioActivo = leerJson(USUARIO_ACTIVO_KEY, null);
  if (!usuarioActivo || usuarioActivo.rol !== 'directora') {
    window.location.href = 'login.html';
    return;
  }

  filterName.addEventListener('input', render);
  filterDate.addEventListener('change', render);
  clearFilters.addEventListener('click', () => {
    filterName.value = '';
    filterDate.value = '';
    render();
  });

  render();

  function render() {
    const texto = normalizar(filterName.value);
    const fecha = filterDate.value;

    const reportes = leerJson(REPORTES_KEY, [])
      .filter(reporte => {
        const coincideTexto = !texto || normalizar([
          reporte.psicologoNombre,
          reporte.psicologoCedula,
          reporte.correo
        ].join(' ')).includes(texto);

        const coincideFecha = !fecha || reporte.fechaISO === fecha;
        return coincideTexto && coincideFecha;
      })
      .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));

    reportCount.textContent = `${reportes.length} ${reportes.length === 1 ? 'reporte' : 'reportes'}`;
    emptyState.style.display = reportes.length ? 'none' : 'block';
    reportsList.innerHTML = reportes.map(crearTarjetaReporte).join('');
  }

  function crearTarjetaReporte(reporte) {
    const actividades = Array.isArray(reporte.actividades) ? reporte.actividades : [];
    const filas = actividades.map((actividad, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapar(actividad.tipo)}</td>
        <td>${escapar(actividad.descripcion)}</td>
        <td>${escapar(actividad.duracion)}</td>
        <td>${escapar(actividad.observacion)}</td>
      </tr>
    `).join('');

    return `
      <article class="report-item">
        <header class="report-item-header">
          <div>
            <h2>${escapar(reporte.psicologoNombre || 'Colaborador')}</h2>
            <p>${escapar(reporte.psicologoCedula || '')} · ${escapar(reporte.correo || 'Sin correo')}</p>
          </div>
          <span class="report-date-badge">${escapar(reporte.fechaTexto || reporte.fechaISO || '')}</span>
        </header>

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
          <p>${escapar(reporte.observacionesGenerales || 'Sin observaciones.')}</p>
        </div>
      </article>
    `;
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

  function leerJson(clave, valorInicial) {
    try {
      const valor = JSON.parse(localStorage.getItem(clave));
      return Array.isArray(valor) ? valor : valorInicial;
    } catch (error) {
      return valorInicial;
    }
  }
});
