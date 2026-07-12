document.addEventListener('DOMContentLoaded', () => {
  const panels = document.querySelectorAll('.sub-panel');
  const mainTitle = document.getElementById('main-panel-title');
  const panelTag = document.getElementById('panel-tag');
  const contextMenu = document.getElementById('custom-context-menu');
  const tableBody = document.getElementById('table-body-registers');
  const btnCreateNote = document.getElementById('ctx-create-note');
  const btnViewNotes = document.getElementById('ctx-view-notes');
  const btnSaveNote = document.getElementById('btn-save-context-note');
  const btnBackFromCreate = document.getElementById('btn-back-from-create');
  const btnBackFromView = document.getElementById('btn-back-from-view');
  const textareaNote = document.getElementById('textarea-context-note');

  const REGISTROS_KEY = 'utp_psic_registros';
  const NOTAS_KEY = 'utp_psic_notas_vinculadas';
  const USUARIOS_KEY = 'usuariosRegistrados';
  const USUARIO_ACTIVO_KEY = 'usuarioActivo';
  const CITAS_KEY = 'utp_citas';

  const REGISTROS_PREDETERMINADOS = new Set([
    '8-954-1234',
    '3-745-8965',
    '9-762-4321'
  ]);

  let selectedStudentCedula = null;
  let selectedStudentName = null;

  let records = [];
  let notes = leerJson(NOTAS_KEY, []);

  protegerAccesoPsicologo();
  renderRecordsTable();

  function protegerAccesoPsicologo() {
    const usuarioActivo = leerJson(USUARIO_ACTIVO_KEY, null);
    if (!usuarioActivo || usuarioActivo.rol !== 'psicologo') {
      window.location.href = 'login.html';
    }
  }

  function obtenerRegistrosEstudiantes() {
    const registrosGuardados = leerJson(REGISTROS_KEY, []);
    const usuariosRegistrados = leerJson(USUARIOS_KEY, []);
    const citasGuardadas = leerJson(CITAS_KEY, []);

    const estudiantesDesdeUsuarios = usuariosRegistrados
      .filter((usuario) => usuario && usuario.rol === 'estudiante' && usuario.cedula)
      .map((usuario) => ({
        cedula: usuario.cedula,
        nombre: usuario.nombre || 'Estudiante registrado'
      }));

    const estudiantesDesdeCitas = citasGuardadas
      .filter((cita) => cita && cita.estudianteCedula)
      .map((cita) => ({
        cedula: cita.estudianteCedula,
        nombre: cita.estudianteNombre || 'Estudiante registrado'
      }));

    const registrosLimpios = registrosGuardados
      .filter((registro) => registro && registro.cedula)
      .filter((registro) => !REGISTROS_PREDETERMINADOS.has(String(registro.cedula).trim()))
      .map((registro) => ({
        cedula: registro.cedula,
        nombre: registro.nombre || 'Estudiante registrado'
      }));

    const registros = unirPorCedula([...registrosLimpios, ...estudiantesDesdeUsuarios, ...estudiantesDesdeCitas]);

    guardarJson(REGISTROS_KEY, registros);
    return registros;
  }

  function unirPorCedula(lista) {
    const mapa = new Map();

    lista.forEach((item) => {
      if (!item || !item.cedula) return;
      const clave = normalizar(item.cedula);

      if (!mapa.has(clave)) {
        mapa.set(clave, {
          cedula: item.cedula,
          nombre: item.nombre || 'Estudiante registrado'
        });
      }
    });

    return Array.from(mapa.values());
  }

  function renderRecordsTable() {
    records = obtenerRegistrosEstudiantes();
    selectedStudentCedula = null;
    selectedStudentName = null;

    mostrarPanel('panel-view-registers');
    mainTitle.textContent = 'Anotaciones privadas';
    actualizarEtiquetaConfidencial();

    if (contextMenu) contextMenu.style.display = 'none';

    if (records.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:24px; color:#9ca3af; font-style:italic;">No hay estudiantes registrados.</td></tr>`;
      return;
    }

    tableBody.innerHTML = records.map((registro) => `
      <tr data-cedula="${atributoHTML(registro.cedula)}" data-nombre="${atributoHTML(registro.nombre)}">
        <td style="font-weight:600; color:#111827;">${escapeHTML(registro.cedula)}</td>
        <td>${escapeHTML(registro.nombre)}</td>
      </tr>
    `).join('');

    attachRowClickListeners();
  }

  function attachRowClickListeners() {
    const rows = tableBody.querySelectorAll('tr[data-cedula]');

    rows.forEach((row) => {
      row.addEventListener('click', (event) => {
        event.stopPropagation();

        rows.forEach((item) => item.classList.remove('context-selected'));
        row.classList.add('context-selected');

        selectedStudentCedula = row.getAttribute('data-cedula');
        selectedStudentName = row.getAttribute('data-nombre');

        abrirMenuContextual(event);
      });
    });
  }

  function abrirMenuContextual(event) {
    const anchoMenu = 220;
    const margen = 16;
    const left = Math.min(event.pageX, window.scrollX + window.innerWidth - anchoMenu - margen);

    contextMenu.style.top = `${event.pageY}px`;
    contextMenu.style.left = `${left}px`;
    contextMenu.style.display = 'block';
  }

  document.addEventListener('click', (event) => {
    if (contextMenu && !contextMenu.contains(event.target)) {
      contextMenu.style.display = 'none';
    }
  });

  btnCreateNote.addEventListener('click', () => {
    if (!validarEstudianteSeleccionado()) return;

    contextMenu.style.display = 'none';
    document.getElementById('create-note-title').textContent = `Nueva Anotación Privada para: ${selectedStudentName}`;
    textareaNote.value = '';
    mainTitle.textContent = 'Crear anotación privada';
    actualizarEtiquetaConfidencial();
    mostrarPanel('panel-create-context-note');
    textareaNote.focus();
  });

  btnViewNotes.addEventListener('click', () => {
    if (!validarEstudianteSeleccionado()) return;

    contextMenu.style.display = 'none';
    openViewNotesPanel();
  });

  btnSaveNote.addEventListener('click', () => {
    if (!validarEstudianteSeleccionado()) return;

    const text = textareaNote.value.trim();
    if (!text) {
      textareaNote.focus();
      return;
    }

    const newNote = {
      cedulaEstudiante: selectedStudentCedula,
      nombreEstudiante: selectedStudentName,
      texto: text,
      fecha: new Date().toLocaleDateString('es-PA'),
      hora: new Date().toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })
    };

    notes.unshift(newNote);
    guardarJson(NOTAS_KEY, notes);
    textareaNote.value = '';

    openViewNotesPanel();
  });

  if (btnBackFromCreate) {
    btnBackFromCreate.addEventListener('click', () => {
      textareaNote.value = '';
      renderRecordsTable();
    });
  }

  if (btnBackFromView) {
    btnBackFromView.addEventListener('click', () => {
      renderRecordsTable();
    });
  }

  function openViewNotesPanel() {
    document.getElementById('view-notes-title').textContent = `Historial Confidencial de: ${selectedStudentName}`;
    mainTitle.textContent = 'Ver anotaciones privadas';
    actualizarEtiquetaConfidencial();
    mostrarPanel('panel-view-context-notes');
    renderContextNotesList();
  }

  function renderContextNotesList() {
    const container = document.getElementById('context-notes-list');
    const filteredNotes = notes.filter((nota) => nota.cedulaEstudiante === selectedStudentCedula);

    if (filteredNotes.length === 0) {
      container.innerHTML = `<p style="font-size:13px; color:#9ca3af; font-style:italic; text-align:center; padding:20px;">No existen anotaciones guardadas para este estudiante.</p>`;
      return;
    }

    container.innerHTML = filteredNotes.map((nota) => `
      <div class="note-item">
        <div>
          <p>${escapeHTML(nota.texto)}</p>
          <span style="font-size:10px; color:#9ca3af; display:block; margin-top:4px;">Registrado el: ${escapeHTML(nota.fecha)}${nota.hora ? ` - ${escapeHTML(nota.hora)}` : ''}</span>
        </div>
      </div>
    `).join('');
  }

  function mostrarPanel(panelId) {
    panels.forEach((panel) => panel.classList.remove('active'));
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) targetPanel.classList.add('active');
  }

  function validarEstudianteSeleccionado() {
    return Boolean(selectedStudentCedula && selectedStudentName);
  }

  function actualizarEtiquetaConfidencial() {
    panelTag.style.background = '#fef2f2';
    panelTag.style.color = '#ef4444';
    panelTag.innerHTML = `
      <svg viewBox="0 0 24 24" class="lock-icon" style="stroke: #ef4444; fill: none;">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      Expediente confidencial
    `;
  }

  function leerJson(clave, valorInicial) {
    try {
      return JSON.parse(localStorage.getItem(clave)) || valorInicial;
    } catch (error) {
      return valorInicial;
    }
  }

  function guardarJson(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
  }

  function normalizar(valor) {
    return String(valor || '').trim().toLowerCase();
  }

  function escapeHTML(valor) {
    return String(valor || '').replace(/[&<>'"]/g, (caracter) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[caracter] || caracter));
  }

  function atributoHTML(valor) {
    return escapeHTML(valor).replace(/`/g, '&#96;');
  }
});
