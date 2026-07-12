// ─────────────────────────────────────────────────────────────────────────────
// calendario-disponibilidad.js
// Guarda la disponibilidad por psicólogo.
// Cada psicólogo usa su propia cédula como identificador, por lo que los
// horarios configurados por un psicólogo no se mezclan con los de otro.
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const LS_KEY = "utp_disponibilidad_psicologos";
  const LS_OLD_KEY = "utp_disponibilidad";
  const LS_USUARIO_ACTIVO_KEY = "usuarioActivo";

  const slots = Array.from(document.querySelectorAll(".slot"));
  const saveButton = document.getElementById("saveAvailability");
  const successModal = document.getElementById("successModal");
  const closeModal = document.getElementById("closeModal");
  const prevWeekBtn = document.getElementById("prevWeek");
  const nextWeekBtn = document.getElementById("nextWeek");
  const weekLabel = document.getElementById("weekLabel");

  const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const usuarioActivo = validarSesionPsicologo();
  if (!usuarioActivo) return;

  let currentMonday = getMondayOf(new Date());
  let slotMappings = crearMapeoSlots();

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
    return String(valor || "").trim().toLowerCase();
  }

  function validarSesionPsicologo() {
    const usuario = leerJson(LS_USUARIO_ACTIVO_KEY, null);

    if (!usuario || !["psicologo", "directora"].includes(usuario.rol) || !usuario.cedula) {
      window.location.href = "login.html";
      return null;
    }

    return usuario;
  }

  function getMondayOf(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatDayMonth(date) {
    return `${date.getDate()} de ${monthNames[date.getMonth()]}`;
  }

  function normalizarHora(texto) {
    const limpio = String(texto || "").trim().toUpperCase();
    const match = limpio.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (!match) return limpio;
    return `${match[1].padStart(2, "0")}:${match[2]} ${match[3]}`;
  }

  function crearMapeoSlots() {
    const grid = document.querySelector(".schedule-grid");
    if (!grid) return [];

    const children = Array.from(grid.children);
    const bodyCells = children.slice(6); // 1 esquina vacía + 5 encabezados de días
    const mappings = [];

    for (let rowStart = 0; rowStart < bodyCells.length; rowStart += 6) {
      const timeCell = bodyCells[rowStart];
      const timeStr = normalizarHora(timeCell ? timeCell.textContent : "");

      for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const cell = bodyCells[rowStart + 1 + dayOffset];
        if (cell && cell.classList.contains("slot")) {
          mappings.push({ slot: cell, dayOffset, timeStr });
        }
      }
    }

    return mappings;
  }

  function loadAll() {
    const data = leerJson(LS_KEY, {});
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  }

  function saveAll(data) {
    guardarJson(LS_KEY, data);
  }

  function getPsychologistKey() {
    return normalizar(usuarioActivo.cedula);
  }

  function getPsychologistName() {
    return usuarioActivo.nombre || "Psicólogo";
  }

  function getDisponibilidadActual() {
    const data = loadAll();
    const key = getPsychologistKey();

    if (data[key] && data[key].disponibilidad) {
      return data[key].disponibilidad;
    }

    // Compatibilidad con versiones anteriores que guardaban una disponibilidad global.
    // Si el psicólogo activo todavía no tiene calendario propio, se toma esa información
    // una sola vez y se convierte a calendario individual.
    const disponibilidadAnterior = leerJson(LS_OLD_KEY, {});
    if (key === '345' && disponibilidadAnterior && Object.keys(disponibilidadAnterior).length > 0) {
      data[key] = {
        cedula: usuarioActivo.cedula,
        nombre: getPsychologistName(),
        correo: usuarioActivo.correo || "",
        disponibilidad: disponibilidadAnterior
      };
      saveAll(data);
      return disponibilidadAnterior;
    }

    return {};
  }

  function saveDisponibilidadActual(disponibilidad) {
    const data = loadAll();
    const key = getPsychologistKey();

    data[key] = {
      cedula: usuarioActivo.cedula,
      nombre: getPsychologistName(),
      correo: usuarioActivo.correo || "",
      disponibilidad
    };

    saveAll(data);
  }

  function slotToDateAndTime(slotElement) {
    const mapping = slotMappings.find(item => item.slot === slotElement);
    if (!mapping) return null;

    const date = new Date(currentMonday);
    date.setDate(currentMonday.getDate() + mapping.dayOffset);

    return {
      dateKey: toDateKey(date),
      timeStr: mapping.timeStr
    };
  }

  function loadWeekSelections() {
    const disponibilidad = getDisponibilidadActual();

    slots.forEach(slot => {
      const mapped = slotToDateAndTime(slot);
      if (!mapped) return;

      const active = !!(disponibilidad[mapped.dateKey] && disponibilidad[mapped.dateKey][mapped.timeStr]);
      slot.classList.toggle("selected", active);
    });
  }

  function saveWeekSelections() {
    const disponibilidad = getDisponibilidadActual();

    slots.forEach(slot => {
      const mapped = slotToDateAndTime(slot);
      if (!mapped) return;

      if (!disponibilidad[mapped.dateKey]) disponibilidad[mapped.dateKey] = {};

      if (slot.classList.contains("selected")) {
        disponibilidad[mapped.dateKey][mapped.timeStr] = true;
      } else {
        delete disponibilidad[mapped.dateKey][mapped.timeStr];
        if (Object.keys(disponibilidad[mapped.dateKey]).length === 0) {
          delete disponibilidad[mapped.dateKey];
        }
      }
    });

    saveDisponibilidadActual(disponibilidad);
  }

  function updateWeekView() {
    const friday = new Date(currentMonday);
    friday.setDate(currentMonday.getDate() + 4);

    const sameMonth = currentMonday.getMonth() === friday.getMonth();
    const sameYear = currentMonday.getFullYear() === friday.getFullYear();

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

  const cancelButton = document.querySelector('a.btn-secondary[href="psicologo.html"]');
  if (cancelButton) {
    cancelButton.href = usuarioActivo.rol === "directora" ? "directora.html" : "psicologo.html";
  }

  saveButton.addEventListener("click", () => {
    saveWeekSelections();
    window.location.href = usuarioActivo.rol === "directora" ? "directora.html" : "psicologo.html";
  });

  closeModal.addEventListener("click", () => successModal.classList.remove("show"));
  successModal.addEventListener("click", e => {
    if (e.target === successModal) successModal.classList.remove("show");
  });

  updateWeekView();
});
