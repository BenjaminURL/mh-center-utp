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
  const studentSearch = document.getElementById('student-search');
  const btnClearStudentSearch = document.getElementById('btn-clear-student-search');
  const recordsCount = document.getElementById('records-count');

  const NOTAS_KEY = 'utp_psic_notas_vinculadas';
  const USUARIO_ACTIVO_KEY = 'usuarioActivo';
  const CITAS_KEY = 'utp_citas';

  let selectedStudentCedula = null;
  let selectedStudentName = null;
  let records = [];
  let filteredRecords = [];
  let notes = leerJson(NOTAS_KEY, []);

  const usuarioActivo = protegerAccesoPsicologo();
  if (!usuarioActivo) return;

  renderRecordsTable();

  if (studentSearch) {
    studentSearch.addEventListener('input', () => {
      aplicarFiltroEstudiantes();
    });

    studentSearch.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && studentSearch.value) {
        limpiarFiltroEstudiantes();
      }
    });
  }

  if (btnClearStudentSearch) {
    btnClearStudentSearch.addEventListener('click', limpiarFiltroEstudiantes);
  }

  function protegerAccesoPsicologo() {
    const usuario = leerJson(USUARIO_ACTIVO_KEY, null);

    if (!usuario || !['psicologo', 'directora'].includes(usuario.rol) || !usuario.cedula) {
      window.location.href = 'login.html';
      return null;
    }

    const backMenu = document.querySelector('.btn-back-menu');
    if (backMenu) {
      backMenu.href = usuario.rol === 'directora' ? 'directora.html' : 'psicologo.html';
    }

    return usuario;
  }

  /**
   * Devuelve únicamente los estudiantes con al menos una cita asignada al
   * psicólogo o directora que mantiene la sesión activa.
   */
  function obtenerRegistrosEstudiantes() {
    const citasGuardadas = leerJson(CITAS_KEY, []);

    if (!Array.isArray(citasGuardadas)) return [];

    const estudiantesAsignados = citasGuardadas
      .filter((cita) => cita && cita.estudianteCedula)
      .filter(esCitaDelProfesionalActivo)
      .map((cita) => ({
        cedula: cita.estudianteCedula,
        nombre: cita.estudianteNombre || 'Estudiante registrado'
      }));

    return unirPorCedula(estudiantesAsignados);
  }

  function esCitaDelProfesionalActivo(cita) {
    const cedulaCita = normalizarCedula(cita.psicologoCedula);
    const cedulaProfesional = normalizarCedula(usuarioActivo.cedula);

    if (cedulaCita && cedulaProfesional) {
      return cedulaCita === cedulaProfesional;
    }

    // Compatibilidad limitada con citas antiguas que solo guardaban el nombre.
    const nombreCita = normalizarTexto(cita.doc || cita.psicologoNombre);
    const nombreProfesional = normalizarTexto(usuarioActivo.nombre);

    return Boolean(
      nombreCita &&
      nombreProfesional &&
      (nombreCita.includes(nombreProfesional) || nombreProfesional.includes(nombreCita))
    );
  }

  function esNotaDelProfesionalActivo(nota) {
    return normalizarCedula(nota.psicologoCedula) === normalizarCedula(usuarioActivo.cedula);
  }

  function unirPorCedula(lista) {
    const mapa = new Map();

    lista.forEach((item) => {
      if (!item || !item.cedula) return;

      const clave = normalizarCedula(item.cedula);
      if (!clave) return;

      if (!mapa.has(clave)) {
        mapa.set(clave, {
          cedula: item.cedula,
          nombre: item.nombre || 'Estudiante registrado'
        });
      }
    });

    return Array.from(mapa.values()).sort((a, b) =>
      String(a.nombre).localeCompare(String(b.nombre), 'es', { sensitivity: 'base' })
    );
  }

  function renderRecordsTable() {
    records = obtenerRegistrosEstudiantes();
    selectedStudentCedula = null;
    selectedStudentName = null;

    mostrarPanel('panel-view-registers');
    mainTitle.textContent = 'Anotaciones privadas';
    actualizarEtiquetaConfidencial();

    if (contextMenu) contextMenu.style.display = 'none';

    aplicarFiltroEstudiantes();
  }

  function aplicarFiltroEstudiantes() {
    const termino = normalizarBusqueda(studentSearch ? studentSearch.value : '');

    filteredRecords = records.filter((registro) => {
      if (!termino) return true;

      const cedula = normalizarBusqueda(registro.cedula);
      const nombreCompleto = normalizarBusqueda(registro.nombre);
      const palabrasBuscadas = termino.split(/\s+/).filter(Boolean);

      return (
        cedula.includes(termino) ||
        nombreCompleto.includes(termino) ||
        palabrasBuscadas.every((palabra) => nombreCompleto.includes(palabra))
      );
    });

    if (btnClearStudentSearch) {
      btnClearStudentSearch.hidden = !termino;
    }

    actualizarContadorRegistros(filteredRecords.length, records.length);
    renderFilasEstudiantes(termino);
  }

  function renderFilasEstudiantes(termino) {
    if (records.length === 0) {
      tableBody.innerHTML = `
        <tr class="records-empty-state">
          <td colspan="2">
            No hay estudiantes con citas asignadas a este profesional.
          </td>
        </tr>`;
      return;
    }

    if (filteredRecords.length === 0) {
      tableBody.innerHTML = `
        <tr class="records-empty-state">
          <td colspan="2">
            No se encontraron estudiantes que coincidan con "${escapeHTML(termino)}".
          </td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = filteredRecords.map((registro) => `
      <tr data-cedula="${atributoHTML(registro.cedula)}" data-nombre="${atributoHTML(registro.nombre)}">
        <td style="font-weight:600; color:#111827;">${escapeHTML(registro.cedula)}</td>
        <td>${escapeHTML(registro.nombre)}</td>
      </tr>
    `).join('');

    attachRowClickListeners();
  }

  function actualizarContadorRegistros(cantidadVisible, cantidadTotal) {
    if (!recordsCount) return;

    if (cantidadTotal === 0) {
      recordsCount.textContent = '0 estudiantes';
      return;
    }

    const terminoActivo = Boolean(normalizarBusqueda(studentSearch ? studentSearch.value : ''));

    if (terminoActivo) {
      recordsCount.textContent = `${cantidadVisible} de ${cantidadTotal}`;
      return;
    }

    recordsCount.textContent = `${cantidadTotal} ${cantidadTotal === 1 ? 'estudiante' : 'estudiantes'}`;
  }

  function limpiarFiltroEstudiantes() {
    if (!studentSearch) return;

    studentSearch.value = '';
    aplicarFiltroEstudiantes();
    studentSearch.focus();
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

    // Impide guardar una nota si la relación estudiante-profesional ya no
    // existe en las citas almacenadas.
    const sigueAsignado = obtenerRegistrosEstudiantes().some(
      (registro) => normalizarCedula(registro.cedula) === normalizarCedula(selectedStudentCedula)
    );

    if (!sigueAsignado) {
      renderRecordsTable();
      return;
    }

    const text = textareaNote.value.trim();
    if (!text) {
      textareaNote.focus();
      return;
    }

    const newNote = {
      id: `N-${Date.now()}`,
      psicologoCedula: usuarioActivo.cedula,
      psicologoNombre: usuarioActivo.nombre || 'Profesional',
      cedulaEstudiante: selectedStudentCedula,
      nombreEstudiante: selectedStudentName,
      texto: text,
      fecha: new Date().toLocaleDateString('es-PA'),
      hora: new Date().toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' }),
      creadoEn: new Date().toISOString()
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
    const estudianteSeleccionado = normalizarCedula(selectedStudentCedula);

    const filteredNotes = notes.filter((nota) =>
      normalizarCedula(nota.cedulaEstudiante) === estudianteSeleccionado &&
      esNotaDelProfesionalActivo(nota)
    );

    if (filteredNotes.length === 0) {
      container.innerHTML = `
        <p style="font-size:13px; color:#9ca3af; font-style:italic; text-align:center; padding:20px;">
          Este profesional no ha guardado anotaciones para el estudiante.
        </p>`;
      return;
    }

    container.innerHTML = filteredNotes.map((nota) => `
      <div class="note-item">
        <div>
          <p>${escapeHTML(nota.texto)}</p>
          <span style="font-size:10px; color:#9ca3af; display:block; margin-top:4px;">
            Registrado el: ${escapeHTML(nota.fecha)}${nota.hora ? ` - ${escapeHTML(nota.hora)}` : ''}
          </span>
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
      const valor = JSON.parse(localStorage.getItem(clave));
      return valor ?? valorInicial;
    } catch (error) {
      return valorInicial;
    }
  }

  function guardarJson(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
  }

  function normalizarCedula(valor) {
    return String(valor || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function normalizarTexto(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function normalizarBusqueda(valor) {
    return normalizarTexto(valor)
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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
