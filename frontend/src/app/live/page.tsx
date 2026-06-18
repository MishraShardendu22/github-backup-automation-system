import { LiveLogStream } from "@/components/live/live-log-stream";

export default function LivePage() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-kicker">Real-time</div>
          <h1 className="page-title">Live logs</h1>
          <p className="page-subtitle">
            A clean stream of worker events from PostgreSQL-backed execution
            logs.
          </p>
        </div>
      </div>

      <LiveLogStream />
    </div>
  );
}
