(() => {
  function crearModal() {
    let overlay = document.getElementById('appSuccessOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'appSuccessOverlay';
    overlay.className = 'app-success-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
      <section
        class="app-success-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appSuccessTitle"
        aria-describedby="appSuccessMessage"
      >
        <div class="app-success-icon" aria-hidden="true">✓</div>
        <h2 class="app-success-title" id="appSuccessTitle">¡Operación exitosa!</h2>
        <p class="app-success-message" id="appSuccessMessage"></p>
        <div class="app-success-details" id="appSuccessDetails" hidden></div>
        <button class="app-success-button" id="appSuccessButton" type="button">
          Aceptar
        </button>
      </section>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  function cerrarModal(overlay) {
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('app-modal-open');
  }

  window.mostrarModalExito = ({
    titulo = '¡Operación exitosa!',
    mensaje = 'La acción se realizó correctamente.',
    detalles = [],
    textoBoton = 'Aceptar',
    alConfirmar = null
  } = {}) => {
    const overlay = crearModal();
    const title = document.getElementById('appSuccessTitle');
    const message = document.getElementById('appSuccessMessage');
    const details = document.getElementById('appSuccessDetails');
    const button = document.getElementById('appSuccessButton');

    title.textContent = titulo;
    message.textContent = mensaje;
    button.textContent = textoBoton;

    details.replaceChildren();
    const filas = Array.isArray(detalles) ? detalles : [];

    filas.forEach(({ etiqueta, valor }) => {
      if (valor === undefined || valor === null || String(valor).trim() === '') return;

      const row = document.createElement('div');
      row.className = 'app-success-detail-row';

      const label = document.createElement('span');
      label.className = 'app-success-detail-label';
      label.textContent = etiqueta || '';

      const value = document.createElement('span');
      value.className = 'app-success-detail-value';
      value.textContent = String(valor);

      row.append(label, value);
      details.appendChild(row);
    });

    details.hidden = details.childElementCount === 0;

    button.onclick = () => {
      cerrarModal(overlay);
      if (typeof alConfirmar === 'function') alConfirmar();
    };

    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('app-modal-open');

    window.setTimeout(() => button.focus(), 0);
  };
})();
