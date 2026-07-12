import { Modal } from 'bootstrap';

export function attachModalToBody(modalEl) {
  if (!modalEl) return null;

  document.body.appendChild(modalEl);
  return Modal.getOrCreateInstance(modalEl);
}

export function detachModal(modalInstance, modalEl) {
  if (modalInstance) {
    modalInstance.hide();
    modalInstance.dispose();
  }

  modalEl?.remove();

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
  document.body.classList.remove('modal-open');
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');
}
