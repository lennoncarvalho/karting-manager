import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useLocation, Link, useNavigate } from "react-router-dom";
import logoUrl from "@/assets/kartarados_3grays.png";

export function Navbar() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isAdmin, isDriver, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    // Route drivers back to driver login, admins to admin login
    navigate(isDriver ? "/driver/login" : "/login");
  };

  const isActive = (path) => {
    if (path === "/admin" && location.pathname === "/admin") return "active";
    if (path === "/driver/profile" && location.pathname === "/driver/profile")
      return "active";
    if (
      path !== "/admin" &&
      path !== "/driver/profile" &&
      location.pathname.startsWith(path)
    )
      return "active";
    return "";
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark"
      style={{ backgroundColor: "var(--season-accent)" }}
    >
      <div className="container-fluid py-0 gap-3">
        <Link
          to="/rankings"
          className="navbar-brand d-flex align-items-center"
          aria-label={t("nav.brandAria")}
        >
          <img src={logoUrl} alt="" height="80" style={{ maxHeight: "60px" }} />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label={t("nav.toggle")}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive("/rankings")}`}
                to="/rankings"
              >
                {t("nav.rankings")}
              </Link>
            </li>

            {/* Admin navigation links */}
            {isAuthenticated && isAdmin && (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/admin/seasons")}`}
                    to="/admin/seasons"
                  >
                    {t("nav.seasons")}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/admin/drivers")}`}
                    to="/admin/drivers"
                  >
                    {t("nav.drivers")}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/admin/cups")}`}
                    to="/admin/cups"
                  >
                    {t("nav.cups")}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/admin/races")}`}
                    to="/admin/races"
                  >
                    {t("nav.races")}
                  </Link>
                </li>
              </>
            )}

            {/* Driver navigation link */}
            {isAuthenticated && isDriver && (
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive("/driver/profile")}`}
                  to="/driver/profile"
                >
                  {t("nav.myProfile")}
                </Link>
              </li>
            )}

            {/* Unauthenticated links */}
            {!isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/driver/login")}`}
                    to="/driver/login"
                  >
                    {t("nav.driverLogin")}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${isActive("/login")}`}
                    to="/login"
                  >
                    {t("nav.adminLogin")}
                  </Link>
                </li>
              </>
            )}
          </ul>

          {isAuthenticated && user && (
            <ul className="navbar-nav">
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle me-1"></i>
                  {user.email}
                </a>
                <ul
                  className="dropdown-menu dropdown-menu-end"
                  aria-labelledby="navbarDropdown"
                >
                  {isAdmin && (
                    <li>
                      <Link className="dropdown-item" to="/admin">
                        {t("nav.settings")}
                      </Link>
                    </li>
                  )}
                  {isDriver && (
                    <li>
                      <Link className="dropdown-item" to="/driver/profile">
                        {t("nav.myProfile")}
                      </Link>
                    </li>
                  )}
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <a
                      className="dropdown-item"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                      }}
                    >
                      {t("nav.logout")}
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
