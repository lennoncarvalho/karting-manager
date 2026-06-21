import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import * as bootstrap from "bootstrap";

function cleanupModal() {
  document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
  document.body.classList.remove("modal-open");
  document.body.style.removeProperty("padding-right");
}

export function ConfirmModal({ show, onConfirm, onCancel, message, title }) {
  const { t } = useTranslation();
  const modalTitle = title || t("common.actions.confirm");
  const modalRef = useRef(null);
  const bsModalRef = useRef(null);

  useEffect(() => {
    if (!modalRef.current) return undefined;

    // Instantiate once per mount; Bootstrap owns visibility from here on.
    if (!bsModalRef.current) {
      bsModalRef.current = new bootstrap.Modal(modalRef.current, {
        backdrop: "static",
        keyboard: false,
      });
    }

    try {
      if (show) {
        bsModalRef.current.show();
      } else {
        bsModalRef.current.hide();
        cleanupModal();
      }
    } catch {
      // Element may have been detached by a parent re-render; ignore.
    }

    return () => {
      const inst = bsModalRef.current;
      bsModalRef.current = null;
      if (inst) {
        try {
          inst.hide();
        } catch {}
        try {
          // Guard: dispose() reads inst._element which can be null if
          // Bootstrap already tore down internally.
          if (inst._element) inst.dispose();
        } catch {}
      }
      cleanupModal();
    };
  }, [show]);

  const handleConfirm = () => {
    onConfirm();
    if (bsModalRef.current) bsModalRef.current.hide();
    cleanupModal();
  };

  const handleCancel = () => {
    onCancel();
    if (bsModalRef.current) bsModalRef.current.hide();
    cleanupModal();
  };

  return (
    <div
      ref={modalRef}
      className="modal fade"
      tabIndex="-1"
      role="dialog"
      aria-labelledby={`${modalTitle}Label`}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id={`${modalTitle}Label`}>
              {modalTitle}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleCancel}
            ></button>
          </div>
          <div className="modal-body">
            <p className="mb-0">{message}</p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleCancel}
            >
              {t("common.actions.cancel")}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirm}
            >
              {t("common.actions.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
