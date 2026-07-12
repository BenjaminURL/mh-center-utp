document.addEventListener('DOMContentLoaded', () => {
  const LS_CITAS_KEY = 'utp_citas';
  const LS_USUARIO_ACTIVO_KEY = 'usuarioActivo';

  const MESES_FULL = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  let filterActivo = 'disponibles';
  let todasLasCitas = cargarCitas();

  const usuarioActivo = validarSesionPsicologo();
  if (!usuarioActivo) return;

  let citas = obtenerCitasDelPsicologo();

  const listEl = document.getElementById('cita-list');
  const toastEl = document.getElementById('toast');

  document.getElementById('btn-back-panel').addEventListener('click', () => {
    window.location.href = 'psicologo.html';
  });

  document.querySelectorAll('#filters-container .filter-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('#filters-container .filter-tab').forEach(t => t.classList.remove('on'));
      this.classList.add('on');
      filterActivo = this.getAttribute('data-filter');
      render();
    });
  });

  render();

  function leerJson(clave, valorInicial) {
    try { return JSON.parse(localStorage.getItem(clave)) || valorInicial; }
    catch { return valorInicial; }
  }

  function guardarJson(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
  }

  function normalizar(valor) {
    return String(valor || '').trim().toLowerCase();
  }

  function validarSesionPsicologo() {
    const usuario = leerJson(LS_USUARIO_ACTIVO_KEY, null);

    if (!usuario || usuario.rol !== 'psicologo' || !usuario.cedula) {
      window.location.href = 'login.html';
      return null;
    }

    return usuario;
  }

  function cargarCitas() {
    const guardadas = leerJson(LS_CITAS_KEY, []);
    return Array.isArray(guardadas) ? guardadas : [];
  }

  function esCitaDelPsicologoActivo(cita) {
    const cedulaCita = normalizar(cita.psicologoCedula);
    const cedulaPsicologo = normalizar(usuarioActivo.cedula);

    if (cedulaCita && cedulaPsicologo) {
      return cedulaCita === cedulaPsicologo;
    }

    // Compatibilidad con citas anteriores que solo guardaban el texto del psicólogo.
    const doc = normalizar(cita.doc);
    const nombre = normalizar(usuarioActivo.nombre);
    return !!doc && !!nombre && doc.includes(nombre);
  }

  function obtenerCitasDelPsicologo() {
    return todasLasCitas.filter(esCitaDelPsicologoActivo);
  }

  function guardarCitas() {
    guardarJson(LS_CITAS_KEY, todasLasCitas);
    citas = obtenerCitasDelPsicologo();
  }

  function estadoNormalizado(cita) {
    return normalizar(cita.estado);
  }

  function esDisponible(cita) {
    const estado = estadoNormalizado(cita);
    return estado === 'agendada' || estado === 'pendiente';
  }

  function esAtendida(cita) {
    const estado = estadoNormalizado(cita);
    return estado === 'atendida' || estado === 'completada';
  }

  function ordenarPorFecha(a, b) {
    const fechaA = new Date(Number(a.año) || 0, (Number(a.mesNum) || 1) - 1, Number(a.dia) || 1);
    const fechaB = new Date(Number(b.año) || 0, (Number(b.mesNum) || 1) - 1, Number(b.dia) || 1);
    return fechaA - fechaB || String(a.hora || '').localeCompare(String(b.hora || ''));
  }

  function citasFiltradas() {
    const copia = [...citas].sort(ordenarPorFecha);

    if (filterActivo === 'todas') return copia;
    if (filterActivo === 'disponibles') return copia.filter(esDisponible);
    if (filterActivo === 'atendida') return copia.filter(esAtendida);
    if (filterActivo === 'cancelada') return copia.filter(c => estadoNormalizado(c) === 'cancelada');

    return copia;
  }

  function render() {
    actualizarResumen();
    const visibles = citasFiltradas();

    if (!visibles.length) {
      listEl.innerHTML = `
        <div class="empty">
          <div class="icon">📭</div>
          <h3>No hay citas para mostrar</h3>
          <p>No existen citas asignadas a este psicólogo con el estado seleccionado.</p>
        </div>`;
      return;
    }

    listEl.innerHTML = visibles.map((c, i) => `
      <div class="cita-card manage-card" style="animation-delay:${i * 0.05}s" data-id="${escapeHTML(c.id)}">
        <div class="cita-date-block">
          <span class="day">${escapeHTML(c.dia)}</span>
          <span class="mon">${escapeHTML(c.mes)}</span>
        </div>

        <div class="cita-info">
          <div class="cita-doc">${escapeHTML(c.estudianteNombre || 'Estudiante sin identificar')}</div>
          <div class="cita-meta">
            <span> ${escapeHTML(c.estudianteCedula || 'Sin cédula')}</span>
            <span> ${escapeHTML(c.estudianteCorreo || 'Sin correo')}</span>
            <span> ${escapeHTML(c.doc || 'Psicólogo no asignado')}</span>
            <span> ${escapeHTML(MESES_FULL[c.mesNum] || c.mes)} ${escapeHTML(c.año)}</span>
            <span> ${escapeHTML(c.hora)}</span>
          </div>
          <p class="manage-note">${escapeHTML(c.motivo || 'Sesión de orientación psicológica.')}</p>
          ${c.nota ? `<p class="manage-system-note">${escapeHTML(c.nota)}</p>` : ''}
        </div>

        <div class="cita-right manage-right">
          ${badgeHtml(c.estado)}
          ${esDisponible(c) ? `
            <div class="manage-actions">
              <button class="btn-manage btn-attend" data-id="${escapeHTML(c.id)}">Atendido</button>
              <button class="btn-manage btn-cancel" data-id="${escapeHTML(c.id)}">Cancelar</button>
            </div>` : ''}
        </div>
      </div>
    `).join('');

    configurarAcciones();
  }

  function actualizarResumen() {
    document.getElementById('count-disponibles').textContent = citas.filter(esDisponible).length;
    document.getElementById('count-atendidas').textContent = citas.filter(esAtendida).length;
    document.getElementById('count-canceladas').textContent = citas.filter(c => estadoNormalizado(c) === 'cancelada').length;
  }

  function badgeHtml(estado) {
    const map = {
      agendada: ['badge-active', '✓ Disponible'],
      pendiente: ['badge-pending', '⏳ Pendiente'],
      atendida: ['badge-done', '✔ Atendida'],
      completada: ['badge-done', '✔ Completada'],
      cancelada: ['badge-cancel', '✕ Cancelada']
    };

    const clave = normalizar(estado);
    const [cls, lbl] = map[clave] || ['badge-done', estado || 'Sin estado'];
    return `<span class="badge ${cls}">${escapeHTML(lbl)}</span>`;
  }

  function configurarAcciones() {
    document.querySelectorAll('.btn-attend').forEach(btn => {
      btn.addEventListener('click', () => cambiarEstado(btn.getAttribute('data-id'), 'atendida'));
    });

    document.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', () => cambiarEstado(btn.getAttribute('data-id'), 'cancelada'));
    });
  }

  function cambiarEstado(id, nuevoEstado) {
    const cita = todasLasCitas.find(c => String(c.id) === String(id) && esCitaDelPsicologoActivo(c));
    if (!cita || !esDisponible(cita)) return;

    if (nuevoEstado === 'atendida') {
      cita.estado = 'atendida';
      cita.nota = 'Atendida por el psicólogo.';
      cita.fechaActualizacion = new Date().toISOString();
      showToast('✓ Cita marcada como atendida');
    }

    if (nuevoEstado === 'cancelada') {
      cita.estado = 'cancelada';
      cita.nota = 'Cancelada por el psicólogo.';
      cita.fechaActualizacion = new Date().toISOString();
      showToast('✓ Cita cancelada por el psicólogo');
    }

    guardarCitas();
    render();
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
  }

  function escapeHTML(str) {
    return String(str || '').replace(/[&<>'"]/g, t => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[t] || t));
  }
});
