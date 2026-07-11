document.addEventListener('DOMContentLoaded', () => {
  /* ── DATA COMPARTIDA ── */
  const citasDemo = [
    { id:'C-001', doc:'Dr. Samir Horna', dia:24, mes:'Abr', mesNum:4, año:2026, hora:'11:00 AM', estado:'agendada', motivo:'Ansiedad académica.', nota:'' },
    { id:'C-002', doc:'Dra. Aramys Cedeño', dia:15, mes:'Abr', mesNum:4, año:2026, hora:'09:00 AM', estado:'completada', motivo:'Seguimiento mensual.', nota:'Completada con éxito.' },
  ];

  const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MESES_FULL = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  let filterActivo = 'todas';
  let selectedId = null;
  let deleteId = null;
  let citas = cargarCitas();

  // Elementos Cacheables del DOM
  const listEl = document.getElementById('cita-list');
  const ovDetailEl = document.getElementById('ov-detail');
  const ovDelEl = document.getElementById('ov-del');
  const toastEl = document.getElementById('toast');

  /* ── INICIALIZACIÓN DE COMPONENTES ── */
  render();
  configurarEventosFijos();

  /* ── PERSISTENCIA LOCAL STORAGE ── */
  function cargarCitas() {
    const guardadas = localStorage.getItem('utp_citas');
    return guardadas ? JSON.parse(guardadas) : citasDemo;
  }

  function guardarCitas() {
    localStorage.setItem('utp_citas', JSON.stringify(citas));
  }

  /* ── RENDERING DE LA LISTA DE CITAS ── */
  function render() {
    const filtered = filterActivo === 'todas' ? citas : citas.filter(c => c.estado === filterActivo);

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
          <div class="cita-doc">${c.doc}</div>
          <div class="cita-meta">
            <span>🕐 ${c.hora}</span>
            <span>📅 ${MESES_FULL[c.mesNum]} ${c.año}</span>
            <span>📝 ${c.motivo.slice(0,38)}${c.motivo.length > 38 ? '…' : ''}</span>
          </div>
        </div>
        <div class="cita-right">
          ${badgeHtml(c.estado)}
          <div class="cita-actions" data-stop-propagation="true">
            <button class="btn-icon btn-action-view" title="Ver detalle" data-id="${c.id}">👁</button>
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
      completada:['badge-done','✔ Completada'],
      cancelada: ['badge-cancel','✕ Cancelada'],
    };
    const [cls, lbl] = map[estado] || ['badge-done', estado];
    return `<span class="badge ${cls}">${lbl}</span>`;
  }

  /* ── CONTROL DE ASIGNACIÓN DE FILTROS ── */
  document.querySelectorAll('#filters-container .filter-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('#filters-container .filter-tab').forEach(t => t.classList.remove('on'));
      this.classList.add('on');
      filterActivo = this.getAttribute('data-filter');
      render();
    });
  });

  /* ── MANEJADORES DE DIÁLOGOS Y VENTANAS FLOTANTES ── */
  function openDetail(id) {
    const c = citas.find(x => x.id === id);
    if (!c) return;
    selectedId = id;

    document.getElementById('det-id').textContent = `ID: ${c.id}`;
    document.getElementById('det-doc').textContent = c.doc;
    document.getElementById('det-fecha').textContent = `${diaNombre(c.dia, c.mesNum, c.año)}, ${c.dia} de ${MESES_FULL[c.mesNum]} de ${c.año}`;
    document.getElementById('det-hora').textContent = c.hora;
    document.getElementById('det-psic').textContent = c.doc;
    document.getElementById('det-estado').innerHTML = badgeHtml(c.estado);
    document.getElementById('det-motivo').textContent = c.motivo;

    const noteRow = document.getElementById('det-note-row');
    if (c.nota) {
      noteRow.style.display = 'flex';
      document.getElementById('det-note').textContent = c.nota;
    } else {
      noteRow.style.display = 'none';
    }

    const actEl = document.getElementById('det-actions');
    if (c.estado === 'agendada' || c.estado === 'pendiente') {
      actEl.innerHTML = `
        <button class="btn-full btn-primary-full" id="modal-act-resched">📆 Reagendar cita</button>
        <button class="btn-full btn-danger-full" id="modal-act-del">🗑 Cancelar cita</button>
        <button class="btn-full btn-outline-full id-close-det-btn">Cerrar</button>`;
      
      // Adjuntar eventos internos del modal
      document.getElementById('modal-act-resched').addEventListener('click', () => { openReschedule(c.id); closeDetail(); });
      document.getElementById('modal-act-del').addEventListener('click', () => { closeDetail(); openDelModal(c.id); });
      document.querySelector('.id-close-det-btn').addEventListener('click', closeDetail);
    } else {
      actEl.innerHTML = `<button class="btn-full btn-outline-full id-close-det-btn">Cerrar</button>`;
      document.querySelector('.id-close-det-btn').addEventListener('click', closeDetail);
    }

    ovDetailEl.classList.add('on');
  }

  function closeDetail() { ovDetailEl.classList.remove('on'); }

  function openDelModal(id) {
    deleteId = id;
    ovDelEl.classList.add('on');
  }
  function closeDelModal() { ovDelEl.classList.remove('on'); deleteId = null; }

  function confirmDelete() {
    if (!deleteId) return;
    const c = citas.find(x => x.id === deleteId);
    if (c) {
      c.estado = 'cancelada';
      c.nota = 'Cancelada por el estudiante.';
    }
    guardarCitas();
    closeDelModal();
    render();
    showToast('✓ Cita cancelada correctamente');
  }

  function openReschedule(id) {
    const c = citas.find(x => x.id === id);
    if (!c) return;
    showToast(`📆 Redirigiendo para reagendar cita con ${c.doc}…`);
    setTimeout(() => {
      window.location.href = 'utp_agendar.html';
    }, 1500);
  }

  function diaNombre(d, m, y) {
    return DIAS_SEMANA[new Date(y, m - 1, d).getDay()];
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
  }

  /* ── LISTENERS ASINCRÓNICOS Y DINÁMICOS ── */
  function configurarEventosFijos() {
    document.getElementById('btn-back-dashboard').addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
    document.getElementById('btn-close-detail').addEventListener('click', closeDetail);
    document.getElementById('btn-cancel-del').addEventListener('click', closeDelModal);
    document.getElementById('btn-confirm-del').addEventListener('click', confirmDelete);

    // Cerrar interactuando con las capas externas opacas (out-click)
    ovDetailEl.addEventListener('click', e => { if (e.target === e.currentTarget) closeDetail(); });
    ovDelEl.addEventListener('click', e => { if (e.target === e.currentTarget) closeDelModal(); });
  }

  function configurarEventosDinamicos() {
    // Al pulsar la tarjeta completa
    document.querySelectorAll('.cita-card').forEach(card => {
      card.addEventListener('click', function() {
        openDetail(this.getAttribute('data-id'));
      });
    });

    // Detener propagaciones de burbuja en contenedores de acciones
    document.querySelectorAll('[data-stop-propagation="true"]').forEach(elem => {
      elem.addEventListener('click', e => e.stopPropagation());
    });

    // Botones internos de la lista
    document.querySelectorAll('.btn-action-view').forEach(btn => {
      btn.addEventListener('click', function() { openDetail(this.getAttribute('data-id')); });
    });
    document.querySelectorAll('.btn-action-resched').forEach(btn => {
      btn.addEventListener('click', function() { openReschedule(this.getAttribute('data-id')); });
    });
    document.querySelectorAll('.btn-action-del').forEach(btn => {
      btn.addEventListener('click', function() { openDelModal(this.getAttribute('data-id')); });
    });
  }
});