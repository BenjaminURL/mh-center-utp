document.addEventListener('DOMContentLoaded', () => {
  /* ── CLAVES DE PERSISTENCIA ── */
  const LS_CITAS_KEY = 'utp_citas';
  const LS_USUARIO_ACTIVO_KEY = 'usuarioActivo';
  const LS_CITA_REAGENDAR_KEY = 'utp_cita_reagendar_id';

  const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MESES_FULL = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  let filterActivo = 'todas';
  let deleteId = null;

  const usuarioActivo = validarSesionEstudiante();
  if (!usuarioActivo) return;

  let todasLasCitas = cargarTodasLasCitas();
  let citas = obtenerCitasDelUsuario();

  // Elementos Cacheables del DOM
  const listEl = document.getElementById('cita-list');
  const ovDelEl = document.getElementById('ov-del');
  const toastEl = document.getElementById('toast');

  /* ── INICIALIZACIÓN DE COMPONENTES ── */
  render();
  configurarEventosFijos();

  /* ── UTILIDADES DE SESIÓN ── */
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

  function validarSesionEstudiante() {
    const usuario = leerJson(LS_USUARIO_ACTIVO_KEY, null);

    if (!usuario || usuario.rol !== 'estudiante' || !usuario.cedula) {
      window.location.href = 'login.html';
      return null;
    }

    return usuario;
  }

  /* ── PERSISTENCIA LOCAL STORAGE ── */
  function cargarTodasLasCitas() {
    const guardadas = leerJson(LS_CITAS_KEY, []);
    return Array.isArray(guardadas) ? guardadas : [];
  }

  function obtenerCitasDelUsuario() {
    return todasLasCitas.filter(c => normalizar(c.estudianteCedula) === normalizar(usuarioActivo.cedula));
  }

  function guardarTodasLasCitas() {
    guardarJson(LS_CITAS_KEY, todasLasCitas);
    citas = obtenerCitasDelUsuario();
  }

  /* ── RENDERING DE LA LISTA DE CITAS ── */
  function render() {
    const filtered = filterActivo === 'todas'
      ? citas
      : filterActivo === 'atendida'
        ? citas.filter(c => c.estado === 'atendida' || c.estado === 'completada')
        : citas.filter(c => c.estado === filterActivo);

    if (!filtered.length) {
      listEl.innerHTML = `
        <div class="empty">
          <div class="icon">📭</div>
          <h3>No hay citas aquí</h3>
          <p>No tienes citas registradas con el estado seleccionado.</p>
        </div>`;
      return;
    }

    listEl.innerHTML = filtered.map((c, i) => `
      <div class="cita-card" style="animation-delay:${i * 0.05}s" data-id="${c.id}">
        <div class="cita-date-block">
          <span class="day">${c.dia}</span>
          <span class="mon">${c.mes}</span>
        </div>
        <div class="cita-info">
          <div class="cita-doc">${escapeHTML(c.doc)}</div>
          <div class="cita-meta">
            <span> ${escapeHTML(c.hora)}</span>
            <span> ${MESES_FULL[c.mesNum]} ${c.año}</span>
            <span> ${escapeHTML(c.motivo || '').slice(0,38)}${(c.motivo || '').length > 38 ? '…' : ''}</span>
          </div>
        </div>
        <div class="cita-right">
          ${badgeHtml(c.estado)}
          <div class="cita-actions" data-stop-propagation="true">
            ${c.estado === 'agendada' || c.estado === 'pendiente'
              ? `<button class="btn-icon btn-action-resched" title="Reagendar" data-id="${c.id}">📆</button>
                 <button class="btn-icon del btn-action-del" title="Cancelar cita" data-id="${c.id}">🗑</button>`
              : ''}
          </div>
        </div>
      </div>
    `).join('');

    configurarEventosDinamicos();
  }

  function badgeHtml(estado) {
    const map = {
      agendada:  ['badge-active','✓ Agendada'],
      pendiente: ['badge-pending','⏳ Pendiente'],
      atendida:  ['badge-done','✔ Atendida'],
      completada:['badge-done','✔ Completada'],
      cancelada: ['badge-cancel','✕ Cancelada'],
    };
    const [cls, lbl] = map[estado] || ['badge-done', estado];
    return `<span class="badge ${cls}">${lbl}</span>`;
  }

  /* ── CONTROL DE FILTROS ── */
  document.querySelectorAll('#filters-container .filter-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('#filters-container .filter-tab').forEach(t => t.classList.remove('on'));
      this.classList.add('on');
      filterActivo = this.getAttribute('data-filter');
      render();
    });
  });
  /* ── MANEJADORES DE DIÁLOGOS Y VENTANAS FLOTANTES ── */
  function openDelModal(id) {
    deleteId = id;
    ovDelEl.classList.add('on');
  }
  function closeDelModal() { ovDelEl.classList.remove('on'); deleteId = null; }

  function confirmDelete() {
    if (!deleteId) return;

    const c = todasLasCitas.find(x => (
      x.id === deleteId && normalizar(x.estudianteCedula) === normalizar(usuarioActivo.cedula)
    ));

    if (c) {
      c.estado = 'cancelada';
      c.nota = 'Cancelada por el estudiante.';
    }

    guardarTodasLasCitas();
    closeDelModal();
    render();
    showToast('✓ Cita cancelada correctamente');
  }

  function openReschedule(id) {
    const c = citas.find(x => x.id === id);
    if (!c) return;

    // Se guarda el ID de la cita activa que se va a mover.
    // En utp_agendar.js no se creará una cita duplicada: se actualizará esta misma cita.
    localStorage.setItem(LS_CITA_REAGENDAR_KEY, String(id));

    showToast(`Redirigiendo para reagendar cita con ${c.doc}…`);
    setTimeout(() => {
      window.location.href = 'utp_agendar.html';
    }, 800);
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
  }

  /* ── LISTENERS FIJOS Y DINÁMICOS ── */
  function configurarEventosFijos() {
    document.getElementById('btn-back-dashboard').addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
    document.getElementById('btn-cancel-del').addEventListener('click', closeDelModal);
    document.getElementById('btn-confirm-del').addEventListener('click', confirmDelete);

    ovDelEl.addEventListener('click', e => { if (e.target === e.currentTarget) closeDelModal(); });
  }

  function configurarEventosDinamicos() {

    document.querySelectorAll('[data-stop-propagation="true"]').forEach(elem => {
      elem.addEventListener('click', e => e.stopPropagation());
    });
    document.querySelectorAll('.btn-action-resched').forEach(btn => {
      btn.addEventListener('click', function() { openReschedule(this.getAttribute('data-id')); });
    });
    document.querySelectorAll('.btn-action-del').forEach(btn => {
      btn.addEventListener('click', function() { openDelModal(this.getAttribute('data-id')); });
    });
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
