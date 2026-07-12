// ─────────────────────────────────────────────────────────────────────────────
// utp_agendar.js
// Muestra al estudiante los psicólogos creados en el registro y lee la
// disponibilidad individual de cada psicólogo.
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const LS_DISP_KEY = 'utp_disponibilidad_psicologos';
  const LS_OLD_DISP_KEY = 'utp_disponibilidad';
  const LS_CITAS_KEY = 'utp_citas';
  const LS_USUARIO_ACTIVO_KEY = 'usuarioActivo';
  const LS_USUARIOS_REGISTRADOS_KEY = 'usuariosRegistrados';
  const LS_CITA_REAGENDAR_KEY = 'utp_cita_reagendar_id';

  const PSICOLOGOS_BASE = [
    { cedula: '345', nombre: 'Cui Hernandez', correo: '' }
  ];

  const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const MONTHS_ABR = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  let psicologos = obtenerPsicologos();
  let psicIdx = 0;
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();
  let selectedDay = null;
  let selectedSlot = null;

  const psicNameEl = document.getElementById('psic-name');
  const monthLabelEl = document.getElementById('month-label');
  const calBodyEl = document.getElementById('cal-body');
  const slotsSectionEl = document.getElementById('slots-section');
  const slotsGridEl = document.getElementById('slots-grid');
  const btnContinuarEl = document.getElementById('btn-continuar');
  const confirmOverlayEl = document.getElementById('confirm-overlay');

  const usuarioActivo = validarSesionEstudiante();
  if (!usuarioActivo) return;

  let citaReagendarId = localStorage.getItem(LS_CITA_REAGENDAR_KEY);
  limpiarReagendaInvalida();

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

  function obtenerPsicologos() {
    const registrados = leerJson(LS_USUARIOS_REGISTRADOS_KEY, [])
      .filter(usuario => usuario && usuario.rol === 'psicologo')
      .map(usuario => ({
        cedula: usuario.cedula,
        nombre: usuario.nombre || 'Psicólogo registrado',
        correo: usuario.correo || ''
      }));

    const mapa = new Map();
    [...PSICOLOGOS_BASE, ...registrados].forEach(psicologo => {
      if (!psicologo.cedula) return;
      mapa.set(normalizar(psicologo.cedula), psicologo);
    });

    return Array.from(mapa.values());
  }

  function psicologoActual() {
    psicologos = obtenerPsicologos();

    if (psicIdx >= psicologos.length) psicIdx = 0;
    if (psicIdx < 0) psicIdx = psicologos.length - 1;

    return psicologos[psicIdx] || { cedula: '', nombre: 'Sin psicólogos registrados', correo: '' };
  }

  function nombrePsicologo(psicologo) {
    return psicologo.nombre || 'Psicólogo';
  }

  function textoPsicologo(psicologo) {
    return `Psic. ${nombrePsicologo(psicologo)}`;
  }

  function leerDisponibilidades() {
    const data = leerJson(LS_DISP_KEY, {});
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  }

  function getDisponibilidadPsicologo(psicologo) {
    const data = leerDisponibilidades();
    const key = normalizar(psicologo.cedula);

    if (data[key] && data[key].disponibilidad) {
      return data[key].disponibilidad;
    }

    // Compatibilidad con el calendario global anterior para el psicólogo base.
    if (key === '345') {
      return leerJson(LS_OLD_DISP_KEY, {});
    }

    return {};
  }

  function toDateKey(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function getSlotsForDay(y, m, d) {
    const psicologo = psicologoActual();
    const disp = getDisponibilidadPsicologo(psicologo);
    const key = toDateKey(y, m, d);
    const dayData = disp[key];

    if (!dayData) return [];
    return Object.keys(dayData).filter(hora => dayData[hora]);
  }

  function esCitaDelPsicologo(cita, psicologo) {
    const cedulaCita = normalizar(cita.psicologoCedula);
    const cedulaPsicologo = normalizar(psicologo.cedula);

    if (cedulaCita && cedulaPsicologo) {
      return cedulaCita === cedulaPsicologo;
    }

    const doc = normalizar(cita.doc);
    const nombre = normalizar(nombrePsicologo(psicologo));
    return !!doc && !!nombre && doc.includes(nombre);
  }

  function esEstadoReservado(estado) {
    const estadoNormalizado = normalizar(estado);
    return estadoNormalizado === 'agendada' || estadoNormalizado === 'pendiente';
  }

  function esCitaDelEstudianteActivo(cita) {
    return normalizar(cita.estudianteCedula) === normalizar(usuarioActivo.cedula);
  }

  function indiceCitaReagendar(citas) {
    if (!citaReagendarId) return -1;

    return citas.findIndex(cita =>
      String(cita.id) === String(citaReagendarId)
      && esCitaDelEstudianteActivo(cita)
      && esEstadoReservado(cita.estado)
    );
  }

  function limpiarReagendaInvalida() {
    if (!citaReagendarId) return;

    const citas = leerJson(LS_CITAS_KEY, []);
    if (indiceCitaReagendar(citas) === -1) {
      localStorage.removeItem(LS_CITA_REAGENDAR_KEY);
      citaReagendarId = null;
    }
  }

  function renderCal() {
    const psicologo = psicologoActual();
    psicNameEl.textContent = nombrePsicologo(psicologo);
    monthLabelEl.textContent = `${MONTHS_EN[month]} ${year}`;

    if (!psicologos.length) {
      calBodyEl.innerHTML = `<div class="cal-cell empty" style="grid-column:1/-1; padding:20px;">No hay psicólogos registrados.</div>`;
      slotsSectionEl.style.display = 'none';
      btnContinuarEl.classList.remove('show');
      return;
    }

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let html = '';

    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-cell empty"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const slots = getSlotsForDay(year, month, d);
      const hasSlots = slots.length > 0;
      const isSel = selectedDay === d;
      const isPast = new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      let cls = 'cal-cell day';
      if (hasSlots) cls += ' bold-day';
      if (isSel) cls += ' selected';
      if (isPast || !hasSlots) cls += ' no-disponible';

      html += `<div class="${cls}" data-day="${d}">
        <div class="day-num">${d}</div>
        ${hasSlots ? `<div class="slot-dot"></div>` : ''}
      </div>`;
    }

    calBodyEl.innerHTML = html;

    document.querySelectorAll('.cal-cell.day.bold-day:not(.no-disponible)').forEach(cell => {
      cell.addEventListener('click', () => {
        const d = parseInt(cell.getAttribute('data-day'), 10);
        selectDay(d);
      });
    });
  }

  function selectDay(d) {
    selectedDay = d;
    selectedSlot = null;
    btnContinuarEl.classList.remove('show');
    renderCal();
    renderSlots();
    slotsSectionEl.style.display = 'block';
  }

  function renderSlots() {
    const psicologo = psicologoActual();
    const available = getSlotsForDay(year, month, selectedDay);

    if (available.length === 0) {
      slotsGridEl.innerHTML = `<p style="color:var(--gray-500); font-size:13px; grid-column:1/-1;">
        No hay horarios disponibles para este día.</p>`;
      return;
    }

    const citasExistentes = leerJson(LS_CITAS_KEY, []);
    const bookedForDay = citasExistentes
      .filter(cita => Number(cita.dia) === Number(selectedDay)
        && Number(cita.mesNum) === Number(month + 1)
        && Number(cita.año) === Number(year)
        && esCitaDelPsicologo(cita, psicologo)
        && String(cita.id) !== String(citaReagendarId || '')
        && esEstadoReservado(cita.estado))
      .map(cita => cita.hora);

    slotsGridEl.innerHTML = available.map(hora => {
      const booked = bookedForDay.includes(hora);
      const sel = selectedSlot === hora;
      let cls = 'slot';
      if (booked) cls += ' booked';
      if (sel) cls += ' selected';

      return `<div class="${cls}" data-slot="${hora}" data-booked="${booked}">
        <span class="slot-time" style="font-weight:700">${hora}</span>
        ${booked ? '<span class="slot-label">Reservado</span>' : ''}
      </div>`;
    }).join('');

    document.querySelectorAll('.slot').forEach(slotCard => {
      slotCard.addEventListener('click', () => {
        if (slotCard.getAttribute('data-booked') === 'true') return;
        pickSlot(slotCard.getAttribute('data-slot'));
      });
    });
  }

  function pickSlot(hora) {
    selectedSlot = hora;
    renderSlots();
    btnContinuarEl.classList.add('show');
  }

  function navMonth(dir) {
    month += dir;
    if (month > 11) { month = 0; year++; }
    if (month < 0) { month = 11; year--; }
    selectedDay = null;
    selectedSlot = null;
    slotsSectionEl.style.display = 'none';
    btnContinuarEl.classList.remove('show');
    renderCal();
  }

  const backLinkEl = document.querySelector('.back');
  if (backLinkEl) {
    backLinkEl.addEventListener('click', () => {
      localStorage.removeItem(LS_CITA_REAGENDAR_KEY);
    });
  }

  document.getElementById('btn-prev-psic').addEventListener('click', () => {
    psicIdx = (psicIdx - 1 + psicologos.length) % psicologos.length;
    selectedDay = null;
    selectedSlot = null;
    slotsSectionEl.style.display = 'none';
    btnContinuarEl.classList.remove('show');
    renderCal();
  });

  document.getElementById('btn-next-psic').addEventListener('click', () => {
    psicIdx = (psicIdx + 1) % psicologos.length;
    selectedDay = null;
    selectedSlot = null;
    slotsSectionEl.style.display = 'none';
    btnContinuarEl.classList.remove('show');
    renderCal();
  });

  document.getElementById('btn-prev-month').addEventListener('click', () => navMonth(-1));
  document.getElementById('btn-next-month').addEventListener('click', () => navMonth(1));

  btnContinuarEl.addEventListener('click', () => {
    if (!selectedDay || !selectedSlot) return;

    const psicologo = psicologoActual();
    const dayNames2 = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(year, month, selectedDay);

    const nuevaCita = {
      id: 'C-' + Date.now(),
      doc: textoPsicologo(psicologo),
      psicologoCedula: psicologo.cedula,
      psicologoNombre: nombrePsicologo(psicologo),
      dia: selectedDay,
      mes: MONTHS_ABR[month + 1],
      mesNum: month + 1,
      año: year,
      hora: selectedSlot,
      estado: 'agendada',
      motivo: 'Sesión de orientación psicológica.',
      nota: '',
      estudianteCedula: normalizar(usuarioActivo.cedula),
      estudianteNombre: usuarioActivo.nombre || 'Estudiante',
      estudianteCorreo: usuarioActivo.correo || ''
    };

    const existentes = leerJson(LS_CITAS_KEY, []);
    const ocupadoPorOtraCita = existentes.some(cita => Number(cita.dia) === Number(selectedDay)
      && Number(cita.mesNum) === Number(month + 1)
      && Number(cita.año) === Number(year)
      && String(cita.id) !== String(citaReagendarId || '')
      && esCitaDelPsicologo(cita, psicologo)
      && esEstadoReservado(cita.estado)
      && cita.hora === selectedSlot);

    if (ocupadoPorOtraCita) {
      alert('Ese horario acaba de ser ocupado. Selecciona otro horario disponible.');
      renderSlots();
      return;
    }

    const indiceReagendar = indiceCitaReagendar(existentes);

    if (indiceReagendar >= 0) {
      const citaAnterior = existentes[indiceReagendar];
      existentes[indiceReagendar] = {
        ...citaAnterior,
        ...nuevaCita,
        id: citaAnterior.id,
        nota: 'Reagendada por el estudiante.',
        fechaActualizacion: new Date().toISOString()
      };
      localStorage.removeItem(LS_CITA_REAGENDAR_KEY);
      citaReagendarId = null;
    } else {
      existentes.push({
        ...nuevaCita,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      });
    }

    guardarJson(LS_CITAS_KEY, existentes);

    document.getElementById('conf-doc').textContent = nuevaCita.doc;
    document.getElementById('conf-pac').textContent = nuevaCita.estudianteNombre;
    document.getElementById('conf-fecha').textContent =
      `${dayNames2[date.getDay()]}, ${MONTHS_EN[month]} ${selectedDay}, ${year}`;
    document.getElementById('conf-hora').textContent = selectedSlot;
    confirmOverlayEl.classList.add('show');
  });

  document.getElementById('btn-menu-go').addEventListener('click', () => {
    confirmOverlayEl.classList.remove('show');
    selectedDay = null;
    selectedSlot = null;
    slotsSectionEl.style.display = 'none';
    btnContinuarEl.classList.remove('show');
    renderCal();
    window.location.href = 'dashboard.html';
  });

  renderCal();
});
