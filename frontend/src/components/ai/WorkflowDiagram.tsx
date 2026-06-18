export function WorkflowDiagram({ activeStep }: { activeStep: string }) {
  const steps = [
    { key: "query", label: "Query received" },
    { key: "agent", label: "Agent reasoning" },
    { key: "tools", label: "Tool execution" },
    { key: "response", label: "Answering" },
  ];

  return (
    <div className="ai-workflow-container">
      <span
        style={{
          fontSize: "9px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-secondary)",
          marginRight: 8,
          flexShrink: 0,
        }}
      >
        Pipeline:
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          overflowX: "auto",
          flex: 1,
          whiteSpace: "nowrap",
        }}
      >
        {steps.map((step, idx) => {
          const active = activeStep === step.key;
          return (
            <div
              key={step.key}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span
                style={{
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: active ? 600 : 400,
                  textShadow: active
                    ? "0 0 8px rgba(212, 168, 50, 0.3)"
                    : "none",
                  fontSize: "11px",
                }}
              >
                {active ? "● " : ""}
                {step.label}
              </span>
              {idx < steps.length - 1 && (
                <span
                  style={{ color: "rgba(255,255,255,0.15)", fontSize: "10px" }}
                >
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
