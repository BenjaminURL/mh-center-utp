// ─────────────────────────────────────────────────────────────────────────────
// utp_agendar.js
// Lee la disponibilidad guardada por el psicólogo desde localStorage
// (clave "utp_disponibilidad") y:
//   · Muestra en NEGRITAS los días que tienen al menos un slot disponible.
//   · Muestra solo las horas disponibles para el día seleccionado.
//   · Los días sin disponibilidad no son seleccionables.
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  const LS_DISP_KEY = "utp_disponibilidad";

  /* ── Psicólogos ── */
  const PSICS = ['Cui Hernandez', 'Samir Horna', 'Aramys Cedeño', 'Jorge Lasso'];

  const MONTHS_EN = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
  const MONTHS_ABR = ['','Ene','Feb','Mar','Abr','May','Jun',
                      'Jul','Ago','Sep','Oct','Nov','Dic'];

  let psicIdx = 0;
  const today = new Date();
  let year  = today.getFullYear();
  let month = today.getMonth();
  let selectedDay  = null;
  let selectedSlot = null;

  /* ── DOM ── */
  const psicNameEl      = document.getElementById('psic-name');
  const monthLabelEl    = document.getElementById('month-label');
  const calBodyEl       = document.getElementById('cal-body');
  const slotsSectionEl  = document.getElementById('slots-section');
  const slotsGridEl     = document.getElementById('slots-grid');
  const btnContinuarEl  = document.getElementById('btn-continuar');
  const confirmOverlayEl = document.getElementById('confirm-overlay');

  /* ── Leer disponibilidad desde localStorage ── */
  function getDisponibilidad() {
    try { return JSON.parse(localStorage.getItem(LS_DISP_KEY)) || {}; }
    catch { return {}; }
  }

  /** Devuelve "YYYY-MM-DD" para año/mes(0-based)/día */
  function toDateKey(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  /** Slots disponibles para una fecha concreta (array de strings de hora) */
  function getSlotsForDay(y, m, d) {
    const disp = getDisponibilidad();
    const key  = toDateKey(y, m, d);
    const dayData = disp[key];
    if (!dayData) return [];
    return Object.keys(dayData).filter(h => dayData[h]);
  }

  /* ── Render calendario ── */
  function renderCal() {
    psicNameEl.textContent  = PSICS[psicIdx];
    monthLabelEl.textContent = `${MONTHS_EN[month]} ${year}`;

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';

    // Celdas vacías antes del primer día
    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-cell empty"></div>`;
    }

    // Días del mes
    for (let d = 1; d <= daysInMonth; d++) {
      const slots       = getSlotsForDay(year, month, d);
      const hasSlots    = slots.length > 0;
      const isSel       = selectedDay === d;
      const isPast      = new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      let cls = 'cal-cell day';
      if (hasSlots)  cls += ' bold-day';        // negrita: tiene disponibilidad
      if (isSel)     cls += ' selected';
      if (isPast || !hasSlots) cls += ' no-disponible'; // no clicable

      html += `<div class="${cls}" data-day="${d}">
        <div class="day-num">${d}</div>
        ${hasSlots ? `<div class="slot-dot"></div>` : ''}
      </div>`;
    }

    calBodyEl.innerHTML = html;

    // Listeners solo a días con disponibilidad y no pasados
    document.querySelectorAll('.cal-cell.day.bold-day:not(.no-disponible)').forEach(cell => {
      cell.addEventListener('click', () => {
        const d = parseInt(cell.getAttribute('data-day'));
        selectDay(d);
      });
    });
  }

  function selectDay(d) {
    selectedDay  = d;
    selectedSlot = null;
    btnContinuarEl.classList.remove('show');
    renderCal();
    renderSlots();
    slotsSectionEl.style.display = 'block';
  }

  /* ── Render slots de hora ── */
  function renderSlots() {
    const available = getSlotsForDay(year, month, selectedDay);

    if (available.length === 0) {
      slotsGridEl.innerHTML = `<p style="color:var(--gray-500); font-size:13px; grid-column:1/-1;">
        No hay horarios disponibles para este día.</p>`;
      return;
    }

    // Horas ya reservadas por otros estudiantes
    const citasExistentes = JSON.parse(localStorage.getItem('utp_citas') || '[]');
    const bookedForDay = citasExistentes
      .filter(c => c.dia === selectedDay && c.mesNum === (month + 1) && c.año === year
                   && c.doc === 'Dr. ' + PSICS[psicIdx]
                   && c.estado !== 'cancelada')
      .map(c => c.hora);

    slotsGridEl.innerHTML = available.map(s => {
      const booked = bookedForDay.includes(s);
      const sel    = selectedSlot === s;
      let cls = 'slot';
      if (booked) cls += ' booked';
      if (sel)    cls += ' selected';
      // Negritas en la hora disponible
      return `<div class="${cls}" data-slot="${s}" data-booked="${booked}">
        <span class="slot-time" style="font-weight:700">${s}</span>
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

  function pickSlot(s) {
    selectedSlot = s;
    renderSlots();
    btnContinuarEl.classList.add('show');
  }

  function navMonth(dir) {
    month += dir;
    if (month > 11) { month = 0; year++; }
    if (month < 0)  { month = 11; year--; }
    selectedDay  = null;
    selectedSlot = null;
    slotsSectionEl.style.display = 'none';
    btnContinuarEl.classList.remove('show');
    renderCal();
  }

  /* ── Navegación ── */
  document.getElementById('btn-prev-psic').addEventListener('click', () => {
    psicIdx = (psicIdx - 1 + PSICS.length) % PSICS.length;
    selectedDay = null; selectedSlot = null;
    slotsSectionEl.style.display = 'none';
    btnContinuarEl.classList.remove('show');
    renderCal();
  });
  document.getElementById('btn-next-psic').addEventListener('click', () => {
    psicIdx = (psicIdx + 1) % PSICS.length;
    selectedDay = null; selectedSlot = null;
    slotsSectionEl.style.display = 'none';
    btnContinuarEl.classList.remove('show');
    renderCal();
  });
  document.getElementById('btn-prev-month').addEventListener('click', () => navMonth(-1));
  document.getElementById('btn-next-month').addEventListener('click', () => navMonth(1));

  /* ── Confirmar cita ── */
  btnContinuarEl.addEventListener('click', () => {
    if (!selectedDay || !selectedSlot) return;

    const dayNames2 = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const date = new Date(year, month, selectedDay);

    const nuevaCita = {
      id:      'C-' + Date.now(),
      doc:     'Dr. ' + PSICS[psicIdx],
      dia:     selectedDay,
      mes:     MONTHS_ABR[month + 1],
      mesNum:  month + 1,
      año:     year,
      hora:    selectedSlot,
      estado:  'agendada',
      motivo:  'Sesión de orientación psicológica.',
      nota:    ''
    };

    const existentes = JSON.parse(localStorage.getItem('utp_citas') || '[]');
    existentes.push(nuevaCita);
    localStorage.setItem('utp_citas', JSON.stringify(existentes));

    document.getElementById('conf-doc').textContent   = nuevaCita.doc;
    document.getElementById('conf-pac').textContent   = 'Usuario';
    document.getElementById('conf-fecha').textContent =
      `${dayNames2[date.getDay()]}, ${MONTHS_EN[month]} ${selectedDay}, ${year}`;
    document.getElementById('conf-hora').textContent  = selectedSlot;
    confirmOverlayEl.classList.add('show');
  });

  document.getElementById('btn-menu-go').addEventListener('click', () => {
    confirmOverlayEl.classList.remove('show');
    selectedDay = null; selectedSlot = null;
    slotsSectionEl.style.display = 'none';
    btnContinuarEl.classList.remove('show');
    renderCal();
    window.location.href = 'dashboard.html';
  });

  /* ── Inicio ── */
  renderCal();
});
