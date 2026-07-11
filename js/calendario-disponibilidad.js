// ─────────────────────────────────────────────────────────────────────────────
// calendario-disponibilidad.js
// Guarda la disponibilidad del psicólogo en localStorage bajo la clave
// "utp_disponibilidad" con formato:
//   { "YYYY-MM-DD": { "08:00 AM": true, "09:00 AM": true, ... }, ... }
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = "utp_disponibilidad";

// Horas en el mismo orden en que aparecen las filas del grid
// (excluyendo las filas "blocked" que son divs, no buttons)
const TIME_LABELS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  // 12:00 PM → blocked (no slot buttons)
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  // 05:00 PM y 06:00 PM tienen mezcla de slots/blocked según columna
  "05:00 PM",
  // 06:00 PM → fully blocked
];

const slots       = document.querySelectorAll(".slot");
const saveButton  = document.getElementById("saveAvailability");
const successModal = document.getElementById("successModal");
const closeModal  = document.getElementById("closeModal");
const prevWeekBtn = document.getElementById("prevWeek");
const nextWeekBtn = document.getElementById("nextWeek");
const weekLabel   = document.getElementById("weekLabel");

const monthNames = ["enero","febrero","marzo","abril","mayo","junio",
                    "julio","agosto","septiembre","octubre","noviembre","diciembre"];
const dayNames   = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

// Cuántas columnas (días) tiene el grid  → 5 (Lun-Vie)
const COLS = 5;

// ── Helpers de fecha ─────────────────────────────────────────────────────────
function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Devuelve "YYYY-MM-DD" para una fecha dada */
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDayMonth(date) {
  return `${date.getDate()} de ${monthNames[date.getMonth()]}`;
}

// ── Estado ───────────────────────────────────────────────────────────────────
let currentMonday = getMondayOf(new Date());

// Carga global desde localStorage
function loadAll() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
  catch { return {}; }
}

// Guarda el objeto completo
function saveAll(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

// ── Mapea cada slot button al día (col) y hora (row) que le corresponde ──────
// Los slots están en orden de lectura del grid:
//   row 0: Lun[0] Mar[1] Mié[2] Jue[3] Vie[4]  → 8:00 AM
//   row 1: Lun[5] ...                             → 9:00 AM  etc.
function slotToDateAndTime(slotIndex) {
  const col     = slotIndex % COLS;           // 0=Lun … 4=Vie
  const row     = Math.floor(slotIndex / COLS); // fila de tiempo
  const timeStr = TIME_LABELS[row];

  const date = new Date(currentMonday);
  date.setDate(currentMonday.getDate() + col);

  return { dateKey: toDateKey(date), timeStr };
}

// ── Cargar selecciones de la semana actual desde localStorage ────────────────
function loadWeekSelections() {
  const data = loadAll();
  slots.forEach((slot, i) => {
    const { dateKey, timeStr } = slotToDateAndTime(i);
    const active = !!(data[dateKey] && data[dateKey][timeStr]);
    slot.classList.toggle("selected", active);
  });
}

// ── Guardar selecciones de la semana actual en localStorage ──────────────────
function saveWeekSelections() {
  const data = loadAll();

  slots.forEach((slot, i) => {
    const { dateKey, timeStr } = slotToDateAndTime(i);
    if (!data[dateKey]) data[dateKey] = {};

    if (slot.classList.contains("selected")) {
      data[dateKey][timeStr] = true;
    } else {
      delete data[dateKey][timeStr];
      // Limpiar objeto vacío
      if (Object.keys(data[dateKey]).length === 0) delete data[dateKey];
    }
  });

  saveAll(data);
}

// ── Actualizar cabeceras de la vista semanal ─────────────────────────────────
function updateWeekView() {
  const friday = new Date(currentMonday);
  friday.setDate(currentMonday.getDate() + 4);

  const sameMonth = currentMonday.getMonth() === friday.getMonth();
  const sameYear  = currentMonday.getFullYear() === friday.getFullYear();

  weekLabel.textContent = (sameMonth && sameYear)
    ? `Semana del ${currentMonday.getDate()} al ${friday.getDate()} de ${monthNames[currentMonday.getMonth()]} de ${currentMonday.getFullYear()}`
    : `Semana del ${formatDayMonth(currentMonday)} de ${currentMonday.getFullYear()} al ${formatDayMonth(friday)} de ${friday.getFullYear()}`;

  for (let i = 0; i < 5; i++) {
    const d = new Date(currentMonday);
    d.setDate(currentMonday.getDate() + i);
    document.getElementById(`dayName${i}`).textContent = dayNames[d.getDay()];
    document.getElementById(`dayDate${i}`).textContent = formatDayMonth(d);
  }

  loadWeekSelections();
}

// ── Listeners ────────────────────────────────────────────────────────────────
slots.forEach(slot => {
  slot.addEventListener("click", () => slot.classList.toggle("selected"));
});

prevWeekBtn.addEventListener("click", () => {
  saveWeekSelections();
  currentMonday.setDate(currentMonday.getDate() - 7);
  updateWeekView();
});

nextWeekBtn.addEventListener("click", () => {
  saveWeekSelections();
  currentMonday.setDate(currentMonday.getDate() + 7);
  updateWeekView();
});

saveButton.addEventListener("click", () => {
  saveWeekSelections();
  successModal.classList.add("show");
});

closeModal.addEventListener("click", () => successModal.classList.remove("show"));
successModal.addEventListener("click", e => {
  if (e.target === successModal) successModal.classList.remove("show");
});

// ── Inicio ───────────────────────────────────────────────────────────────────
updateWeekView();
