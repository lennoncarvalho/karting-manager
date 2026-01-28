/**
 * Modal Component
 * Bootstrap modal wrapper for consistent modal usage
 */

/**
 * Create and show a Bootstrap modal
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string|HTMLElement} options.body - Modal body content
 * @param {Array} options.buttons - Array of button configs [{label, class, onClick}]
 * @param {Function} options.onClose - Callback when modal is closed
 * @param {string} options.size - Modal size: 'sm', 'lg', 'xl' (optional)
 * @returns {HTMLElement} Modal element
 */
export function showModal(options = {}) {
  const {
    title = 'Modal',
    body = '',
    buttons = [],
    onClose = null,
    size = ''
  } = options;
  
  // Remove existing modals
  const existingModals = document.querySelectorAll('.modal');
  existingModals.forEach(modal => {
    const bsModal = bootstrap.Modal.getInstance(modal);
    if (bsModal) {
      bsModal.dispose();
    }
    modal.remove();
  });
  
  // Create modal element
  const modalId = `modal-${Date.now()}`;
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = modalId;
  modal.setAttribute('tabindex', '-1');
  modal.setAttribute('aria-labelledby', `${modalId}Label`);
  modal.setAttribute('aria-hidden', 'true');
  
  const sizeClass = size ? `modal-${size}` : '';
  
  modal.innerHTML = `
    <div class="modal-dialog ${sizeClass}">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="${modalId}Label">${title}</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          ${typeof body === 'string' ? body : ''}
        </div>
        <div class="modal-footer">
          ${buttons.map((btn, index) => `
            <button type="button" class="btn ${btn.class || 'btn-secondary'}" 
                    data-btn-index="${index}" ${btn.dataBsDismiss ? 'data-bs-dismiss="modal"' : ''}>
              ${btn.label}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  // Insert body content if it's an HTMLElement
  const modalBody = modal.querySelector('.modal-body');
  if (body instanceof HTMLElement) {
    modalBody.innerHTML = '';
    modalBody.appendChild(body);
  }
  
  // Append to document
  document.body.appendChild(modal);
  
  // Attach button handlers
  buttons.forEach((btn, index) => {
    const button = modal.querySelector(`[data-btn-index="${index}"]`);
    if (button && btn.onClick) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        btn.onClick(e, modal);
      });
    }
  });
  
  // Initialize Bootstrap modal
  const bsModal = new bootstrap.Modal(modal, {
    backdrop: true,
    keyboard: true
  });
  
  // Handle close events
  modal.addEventListener('hidden.bs.modal', () => {
    if (onClose) {
      onClose();
    }
    modal.remove();
  });
  
  // Show modal
  bsModal.show();
  
  return modal;
}

/**
 * Hide and remove a modal
 * @param {HTMLElement|string} modal - Modal element or modal ID
 */
export function hideModal(modal) {
  let modalElement;
  
  if (typeof modal === 'string') {
    modalElement = document.getElementById(modal);
  } else {
    modalElement = modal;
  }
  
  if (modalElement) {
    const bsModal = bootstrap.Modal.getInstance(modalElement);
    if (bsModal) {
      bsModal.hide();
    } else {
      modalElement.remove();
    }
  }
}

/**
 * Create a confirmation modal
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Confirm callback
 * @param {Function} onCancel - Cancel callback (optional)
 * @returns {HTMLElement} Modal element
 */
export function showConfirmationModal(message, onConfirm, onCancel = null) {
  return showModal({
    title: 'Confirm Action',
    body: `<p>${message}</p>`,
    buttons: [
      {
        label: 'Cancel',
        class: 'btn-secondary',
        dataBsDismiss: true,
        onClick: onCancel || (() => {})
      },
      {
        label: 'Confirm',
        class: 'btn-primary',
        onClick: (e, modal) => {
          hideModal(modal);
          if (onConfirm) {
            onConfirm();
          }
        }
      }
    ]
  });
}

/**
 * Create an error modal
 * @param {string} message - Error message
 * @returns {HTMLElement} Modal element
 */
export function showErrorModal(message) {
  return showModal({
    title: 'Error',
    body: `<div class="alert alert-danger">${message}</div>`,
    buttons: [
      {
        label: 'Close',
        class: 'btn-primary',
        dataBsDismiss: true
      }
    ]
  });
}
