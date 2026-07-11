document.addEventListener('DOMContentLoaded', () => {
  // Selectores de Panel y Menú Lateral
  const tabNewBtn = document.getElementById('tab-new-reg-btn');
  const tabViewBtn = document.getElementById('tab-view-reg-btn');
  const panels = document.querySelectorAll('.sub-panel');
  const mainTitle = document.getElementById('main-panel-title');
  const panelTag = document.getElementById('panel-tag');

  // Selectores Contextuales (Menú Flotante)
  const contextMenu = document.getElementById('custom-context-menu');
  const tableBody = document.getElementById('table-body-registers');
  
  // Variables de Estado de Selección
  let selectedStudentCedula = null;
  let selectedStudentName = null;

  // Cargar Base de Datos desde LocalStorage
  let records = JSON.parse(localStorage.getItem('utp_psic_registros')) || [];
  let notes = JSON.parse(localStorage.getItem('utp_psic_notas_vinculadas')) || [];

  // DATOS DE PRUEBA: Para asegurar que haya estudiantes al iniciar
  if (records.length === 0) {
    records = [
      { cedula: "8-954-1234", nombre: "Juan Pérez", facultad: "FISC", motivo: "Estrés académico por exámenes parciales" },
      { cedula: "3-745-8965", nombre: "Maria Dixon", facultad: "FIE", motivo: "Orientación vocacional y cambio de carrera" },
      { cedula: "9-762-4321", nombre: "Carlos Rodríguez", facultad: "FIC", motivo: "Ansiedad generalizada y manejo del tiempo" }
    ];
    localStorage.setItem('utp_psic_registros', JSON.stringify(records));
  }

  // Renderizado inicial
  renderRecordsTable();

  // Navegación del Menú Lateral
  tabNewBtn.addEventListener('click', () => {
    resetMenuContextStyles();
    switchActivePanel('panel-new-register', tabNewBtn);
  });

  tabViewBtn.addEventListener('click', () => {
    resetMenuContextStyles();
    switchActivePanel('panel-view-registers', tabViewBtn);
    renderRecordsTable(); 
  });

  function switchActivePanel(panelId, activeBtn) {
    [tabNewBtn, tabViewBtn].forEach(b => b.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));

    if (activeBtn) activeBtn.classList.add('active');
    
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) targetPanel.classList.add('active');
  }

  function resetMenuContextStyles() {
    mainTitle.textContent = "Registros";
    panelTag.style.background = "#e0f2fe";
    panelTag.style.color = "#0369a1";
    panelTag.innerHTML = `<svg viewBox="0 0 24 24" class="lock-icon" style="stroke: #0369a1;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg> Expedientes Clínicos`;
  }

  // Guardar Nuevo Registro
  document.getElementById('form-registro').addEventListener('submit', (e) => {
    e.preventDefault();
    const item = {
      cedula: document.getElementById('reg-cedula').value.trim(),
      nombre: document.getElementById('reg-nombre').value.trim(),
      facultad: document.getElementById('reg-facultad').value,
      motivo: document.getElementById('reg-motivo').value.trim()
    };
    records.unshift(item);
    localStorage.setItem('utp_psic_registros', JSON.stringify(records));
    e.target.reset();
    
    switchActivePanel('panel-view-registers', tabViewBtn);
    renderRecordsTable();
  });

  // Pintar Tabla en el HTML
  function renderRecordsTable() {
    if (records.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:24px; color:#9ca3af; font-style:italic;">No hay estudiantes registrados.</td></tr>`;
      return;
    }
    tableBody.innerHTML = records.map(r => `
      <tr data-cedula="${r.cedula}" data-nombre="${r.nombre}">
        <td style="font-weight:600; color:#111827;">${escapeHTML(r.cedula)}</td>
        <td>${escapeHTML(r.nombre)}</td>
        <td><span style="background:#f3f4f6; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold; color:#374151;">${r.facultad}</span></td>
        <td>${escapeHTML(r.motivo)}</td>
      </tr>
    `).join('');
    
    // Vincula el click normal
    attachRowClickListeners();
  }

  // CAMBIO CLAVE: DETECTAR CLIC IZQUIERDO NORMAL
  function attachRowClickListeners() {
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
      row.addEventListener('click', (e) => {
        if (!row.getAttribute('data-cedula')) return;
        
        // Evitamos que el clic cierre el menú inmediatamente
        e.stopPropagation(); 
        
        // Quitar selección visual vieja y añadirla a la fila tocada
        rows.forEach(r => r.classList.remove('context-selected'));
        row.classList.add('context-selected');
        
        selectedStudentCedula = row.getAttribute('data-cedula');
        selectedStudentName = row.getAttribute('data-nombre');

        // Posicionar el menú donde se hizo el clic izquierdo
        contextMenu.style.top = `${e.pageY}px`;
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.display = 'block';
      });
    });
  }

  // Cerrar el menú si haces clic en cualquier otro lado de la pantalla
  document.addEventListener('click', (e) => {
    if (contextMenu && !contextMenu.contains(e.target)) {
      contextMenu.style.display = 'none';
    }
  });

  // MENÚ: CREAR ANOTACIÓN
  document.getElementById('ctx-create-note').addEventListener('click', () => {
    contextMenu.style.display = 'none';
    document.getElementById('create-note-title').textContent = `Nueva Anotación Privada para: ${selectedStudentName}`;
    
    mainTitle.textContent = "Anotaciones";
    panelTag.style.background = "#fef2f2";
    panelTag.style.color = "#ef4444";
    panelTag.innerHTML = `⚠️ Expediente Confidencial`;

    switchActivePanel('panel-create-context-note', null);
  });

  // GUARDAR ANOTACIÓN
  document.getElementById('btn-save-context-note').addEventListener('click', () => {
    const textarea = document.getElementById('textarea-context-note');
    const text = textarea.value.trim();
    if(!text) return;

    const newNote = {
      cedulaEstudiante: selectedStudentCedula,
      texto: text,
      fecha: new Date().toLocaleDateString()
    };

    notes.unshift(newNote);
    localStorage.setItem('utp_psic_notas_vinculadas', JSON.stringify(notes));
    textarea.value = '';
    
    openViewNotesPanel();
  });

  // MENÚ: VER ANOTACIONES
  document.getElementById('ctx-view-notes').addEventListener('click', () => {
    contextMenu.style.display = 'none';
    openViewNotesPanel();
  });

  function openViewNotesPanel() {
    document.getElementById('view-notes-title').textContent = `Historial Confidencial de: ${selectedStudentName}`;
    
    mainTitle.textContent = "Anotaciones";
    panelTag.style.background = "#fef2f2";
    panelTag.style.color = "#ef4444";

    switchActivePanel('panel-view-context-notes', null);
    renderContextNotesList();
  }

  function renderContextNotesList() {
    const container = document.getElementById('context-notes-list');
    const filteredNotes = notes.filter(n => n.cedulaEstudiante === selectedStudentCedula);

    if (filteredNotes.length === 0) {
      container.innerHTML = `<p style="font-size:13px; color:#9ca3af; font-style:italic; text-align:center; padding:20px;">No existen anotaciones guardadas para este estudiante.</p>`;
      return;
    }

    container.innerHTML = filteredNotes.map(n => `
      <div class="note-item">
        <div>
          <p>${escapeHTML(n.texto)}</p>
          <span style="font-size:10px; color:#9ca3af; display:block; margin-top:4px;">Registrado el: ${n.fecha}</span>
        </div>
      </div>
    `).join('');
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
  }
});