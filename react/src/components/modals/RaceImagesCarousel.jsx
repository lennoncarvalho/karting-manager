import { useTranslation } from "react-i18next";

export function RaceImagesCarousel({ images = [], onClose = null }) {
  const { t } = useTranslation();

  if (!images.length) {
    return (
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-xl modal-fullscreen-md-down">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{t("raceImages.title")}</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body text-center py-5">
              <p className="text-muted">{t("raceImages.noImages")}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                {t("raceImages.close")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl modal-fullscreen-md-down">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t("raceImages.title")}</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body p-0">
            <div
              id="raceImagesCarousel"
              className="carousel slide"
              data-bs-ride="false"
              data-bs-interval="false"
            >
              <div className="carousel-indicators">
                {images.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    data-bs-target="#raceImagesCarousel"
                    data-bs-slide-to={index}
                    className={index === 0 ? "active" : ""}
                    aria-current={index === 0 ? "true" : undefined}
                    aria-label={t("raceImages.slideCounter", {
                      current: index + 1,
                      total: images.length,
                    })}
                  ></button>
                ))}
              </div>
              <div className="carousel-inner">
                {images.map((image, index) => {
                  const isPdf = image.url?.endsWith(".pdf");
                  return (
                    <div
                      key={image.name}
                      className={`carousel-item ${index === 0 ? "active" : ""}`}
                    >
                      {isPdf ? (
                        <embed
                          src={`${image.url}#toolbar=0&navpanes=0&scrollbar=0`}
                          type="application/pdf"
                          className="d-block w-100"
                          style={{ height: "80vh" }}
                        />
                      ) : (
                        <img
                          src={image.url}
                          className="d-block w-100"
                          alt={t("raceImages.slideCounter", {
                            current: index + 1,
                            total: images.length,
                          })}
                          style={{ maxHeight: "80vh", objectFit: "contain" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {images.length > 1 && (
                <>
                  <button
                    className="carousel-control-prev"
                    type="button"
                    data-bs-target="#raceImagesCarousel"
                    data-bs-slide="prev"
                  >
                    <span
                      className="carousel-control-prev-icon"
                      aria-hidden="true"
                    ></span>
                    <span className="visually-hidden">Previous</span>
                  </button>
                  <button
                    className="carousel-control-next"
                    type="button"
                    data-bs-target="#raceImagesCarousel"
                    data-bs-slide="next"
                  >
                    <span
                      className="carousel-control-next-icon"
                      aria-hidden="true"
                    ></span>
                    <span className="visually-hidden">Next</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
            >
              {t("raceImages.close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
