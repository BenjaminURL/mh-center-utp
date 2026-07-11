const reportDate = document.getElementById("reportDate");
const modalDate = document.getElementById("modalDate");

const addActivityBtn = document.getElementById("addActivityBtn");
const activitiesBody = document.getElementById("activitiesBody");
const emptyActivities = document.getElementById("emptyActivities");

const saveReportBtn = document.getElementById("saveReportBtn");
const confirmModal = document.getElementById("confirmModal");
const successModal = document.getElementById("successModal");

const cancelSendBtn = document.getElementById("cancelSendBtn");
const confirmSendBtn = document.getElementById("confirmSendBtn");
const closeSuccessBtn = document.getElementById("closeSuccessBtn");

const infoAlert = document.getElementById("infoAlert");
const errorAlert = document.getElementById("errorAlert");
const errorMessage = document.getElementById("errorMessage");

const generalObservations = document.getElementById("generalObservations");
const generalError = document.getElementById("generalError");

let activityCounter = 0;

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function setCurrentDate() {
  const today = new Date();
  const formattedDate = formatDate(today);

  reportDate.textContent = formattedDate;
  modalDate.textContent = formattedDate;
}

function updateEmptyState() {
  const rows = activitiesBody.querySelectorAll(".activity-row");

  if (rows.length === 0) {
    emptyActivities.classList.remove("hide");
  } else {
    emptyActivities.classList.add("hide");
  }

  updateActivityNumbers();
}

function updateActivityNumbers() {
  const rows = activitiesBody.querySelectorAll(".activity-row");

  rows.forEach((row, index) => {
    row.querySelector(".activity-number").textContent = index + 1;
  });
}

function createTrashIcon() {
  return `
    <svg viewBox="0 0 24 24">
      <path d="M3 6h18"></path>
      <path d="M8 6V4h8v2"></path>
      <path d="M19 6l-1 14H6L5 6"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
    </svg>
  `;
}

function addActivityRow() {
  activityCounter++;

  const row = document.createElement("div");
  row.className = "activity-row";

  row.innerHTML = `
    <span class="activity-number">${activityCounter}</span>

    <select class="activity-select activity-type">
      <option value="">Seleccionar</option>
      <option value="Asesoría individual">Asesoría individual</option>
      <option value="Taller">Taller</option>
      <option value="Charla">Charla</option>
      <option value="Redacción de informes">Redacción de informes</option>
      <option value="Revisión de materiales educativos">Revisión de materiales educativos</option>
    </select>

    <textarea
      class="activity-input activity-description"
      rows="2"
      placeholder="Escribe la descripción..."
    ></textarea>

    <select class="activity-select activity-duration">
      <option value="">Seleccionar</option>
      <option value="30 min">30 min</option>
      <option value="45 min">45 min</option>
      <option value="1 hora">1 hora</option>
      <option value="1.5 hora">1.5 hora</option>
      <option value="2 horas">2 horas</option>
    </select>

    <textarea
      class="activity-input activity-observation"
      rows="2"
      placeholder="Escribe una observación..."
    ></textarea>

    <button class="delete-activity" type="button" aria-label="Eliminar actividad">
      ${createTrashIcon()}
    </button>
  `;

  row.querySelector(".delete-activity").addEventListener("click", () => {
    row.remove();
    updateEmptyState();
  });

  activitiesBody.appendChild(row);
  updateEmptyState();
  clearErrors();
}

function clearErrors() {
  errorAlert.classList.remove("show");
  infoAlert.classList.remove("hide");
  generalObservations.classList.remove("error");
  generalError.classList.remove("show");

  const fields = document.querySelectorAll(".activity-select, .activity-input");
  fields.forEach((field) => {
    field.classList.remove("error");
  });
}

function showError(message) {
  errorMessage.textContent = message;
  errorAlert.classList.add("show");
  infoAlert.classList.add("hide");
}

function validateReport() {
  clearErrors();

  const rows = activitiesBody.querySelectorAll(".activity-row");
  const observationsAreEmpty = !generalObservations.value.trim();

  let hasError = false;
  let hasInvalidActivity = false;

  if (rows.length === 0) {
    showError("Debes agregar al menos una actividad.");

    if (observationsAreEmpty) {
      generalObservations.classList.add("error");
      generalError.classList.add("show");
    }

    return false;
  }

  rows.forEach((row) => {
    const type = row.querySelector(".activity-type");
    const description = row.querySelector(".activity-description");
    const duration = row.querySelector(".activity-duration");
    const observation = row.querySelector(".activity-observation");

    if (!type.value.trim()) {
      type.classList.add("error");
      hasInvalidActivity = true;
      hasError = true;
    }

    if (!description.value.trim()) {
      description.classList.add("error");
      hasInvalidActivity = true;
      hasError = true;
    }

    if (!duration.value.trim()) {
      duration.classList.add("error");
      hasInvalidActivity = true;
      hasError = true;
    }

    if (!observation.value.trim()) {
      observation.classList.add("error");
      hasInvalidActivity = true;
      hasError = true;
    }
  });

  if (observationsAreEmpty) {
    generalObservations.classList.add("error");
    generalError.classList.add("show");
    hasError = true;
  }

  if (hasInvalidActivity) {
    showError("Completa todos los campos de cada actividad.");
    return false;
  }

  if (observationsAreEmpty) {
    showError("El campo de observaciones generales es obligatorio.");
    return false;
  }

  if (hasError) {
    return false;
  }

  return true;
}

addActivityBtn.addEventListener("click", addActivityRow);

saveReportBtn.addEventListener("click", () => {
  const isValid = validateReport();

  if (isValid) {
    confirmModal.classList.add("show");
  }
});

cancelSendBtn.addEventListener("click", () => {
  confirmModal.classList.remove("show");
});

confirmSendBtn.addEventListener("click", () => {
  confirmModal.classList.remove("show");
  successModal.classList.add("show");
});

closeSuccessBtn.addEventListener("click", () => {
  window.location.href = "psicologo.html";
});

confirmModal.addEventListener("click", (event) => {
  if (event.target === confirmModal) {
    confirmModal.classList.remove("show");
  }
});

successModal.addEventListener("click", (event) => {
  if (event.target === successModal) {
    successModal.classList.remove("show");
  }
});

setCurrentDate();
updateEmptyState();