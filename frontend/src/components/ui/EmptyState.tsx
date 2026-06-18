import { cn } from "@/lib/utils";

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ message, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn("empty-state", className)}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px",
        color: "var(--text-secondary)",
        fontSize: "14px",
        gap: "12px",
      }}
    >
      {icon && <div style={{ opacity: 0.5 }}>{icon}</div>}
      <p>{message}</p>
    </div>
  );
}
