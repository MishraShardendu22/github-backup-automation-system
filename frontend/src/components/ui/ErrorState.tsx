import { cn } from "@/lib/utils";

interface ErrorStateProps {
  message: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({ message, retry, className }: ErrorStateProps) {
  return (
    <div className={cn("error-state", className)} style={{ 
      display: "flex", 
      flexDirection: "column",
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "200px",
      gap: "16px"
    }}>
      <div style={{ color: "#ef4444", fontSize: "14px", textAlign: "center" }}>
        ⚠ {message}
      </div>
      {retry && (
        <button onClick={retry} className="btn btn-outline" style={{ fontSize: "12px" }}>
          Try Again
        </button>
      )}
    </div>
  );
}
