export default function StatusBadge({ status }) {
  const label = status || "unknown";
  const className = String(label).toLowerCase().replaceAll("_", "-").replaceAll(" ", "-");
  return <span className={`status-badge ${className}`}>{String(label).replaceAll("_", " ")}</span>;
}
