import { DocumentStatus } from "../backend";

const STATUS_CONFIG = {
  [DocumentStatus.notStarted]: {
    label: "Not Started",
    className:
      "bg-slate-800 text-slate-300 border border-slate-700 font-medium",
  },
  [DocumentStatus.inProgress]: {
    label: "In Progress",
    className:
      "bg-amber-950/60 text-amber-300 border border-amber-800/60 font-medium",
  },
  [DocumentStatus.completed]: {
    label: "Completed",
    className:
      "bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-medium",
  },
  [DocumentStatus.approved]: {
    label: "Approved",
    className:
      "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-medium",
  },
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const config =
    STATUS_CONFIG[status] ?? STATUS_CONFIG[DocumentStatus.notStarted];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
