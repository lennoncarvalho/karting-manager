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

  const navItems = [
    { to: "/rankings", label: t("nav.rankings") },
    {
      to: "/admin/seasons",
      label: t("nav.seasons"),
      show: isAuthenticated && isAdmin,
    },
    {
      to: "/admin/drivers",
      label: t("nav.drivers"),
      show: isAuthenticated && isAdmin,
    },
    {
      to: "/admin/cups",
      label: t("nav.cups"),
      show: isAuthenticated && isAdmin,
    },
    {
      to: "/admin/races",
      label: t("nav.races"),
      show: isAuthenticated && isAdmin,
    },
    {
      to: "/driver/profile",
      label: t("nav.myProfile"),
      show: isAuthenticated && isDriver,
    },
    {
      to: "/driver/login",
      label: t("nav.driverLogin"),
      show: !isAuthenticated,
    },
    {
      to: "/login",
      label: t("nav.adminLogin"),
      show: !isAuthenticated,
    },
  ].filter((item) => item.show !== false);

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark bg-custom-accent"
      style={{ backgroundColor: "var(--season-accent)" }}
    >
      <div className="container">
        <Link
          to="/rankings"
          className="navbar-brand d-flex align-items-center"
          aria-label={t("nav.brandAria")}
        >
          <img src={logoUrl} alt="" height="80" className="max-h-15" />
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
            {navItems.map((item) => (
              <li key={item.to} className="nav-item">
                <Link className={`nav-link ${isActive(item.to)}`} to={item.to}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {isAuthenticated && user ? (
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
                  {isAdmin ? (
                    <li>
                      <Link className="dropdown-item" to="/admin">
                        {t("nav.settings")}
                      </Link>
                    </li>
                  ) : null}
                  {isDriver ? (
                    <li>
                      <Link className="dropdown-item" to="/driver/profile">
                        {t("nav.myProfile")}
                      </Link>
                    </li>
                  ) : null}
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
          ) : null}
        </div>
      </div>
    </nav>
  );
}
