export function Spinner({ sm, label, centered, className = "" }) {
  const classes = `spinner-border${sm ? " spinner-border-sm" : ""}${className ? " " + className : ""}`;

  if (label) {
    return (
      <div className="d-flex align-items-center justify-content-center gap-2">
        <div className={classes} />
        <span>{label}</span>
      </div>
    );
  }

  if (centered) {
    return (
      <div className="min-vh-60 d-flex align-items-center justify-content-center">
        <div className={classes} />
      </div>
    );
  }

  return <div className={classes} />;
}
