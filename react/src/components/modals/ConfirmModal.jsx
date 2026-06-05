import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export function ConfirmModal({ show, onConfirm, onCancel, message, title }) {
  const { t } = useTranslation();
  const modalTitle = title || t("common.actions.confirm");
  const modalRef = useRef(null);
  const bsModalRef = useRef(null);

  useEffect(() => {
    if (!modalRef.current) return;

    if (show) {
      bsModalRef.current = new bootstrap.Modal(modalRef.current, {
        backdrop: "static",
        keyboard: false,
      });
      bsModalRef.current.show();
    } else if (bsModalRef.current) {
      bsModalRef.current.hide();
    }

    return () => {
      if (bsModalRef.current) {
        bsModalRef.current.dispose();
      }
    };
  }, [show]);

  const handleConfirm = () => {
    onConfirm();
    if (bsModalRef.current) bsModalRef.current.hide();
  };

  const handleCancel = () => {
    onCancel();
    if (bsModalRef.current) bsModalRef.current.hide();
  };

  return (
    <div
      ref={modalRef}
      className="modal fade"
      tabIndex="-1"
      role="dialog"
      aria-labelledby={`${modalTitle}Label`}
      aria-hidden="true"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
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
