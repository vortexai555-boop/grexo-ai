import React, { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    api.get("/admin/audit").then((r) => setLogs(r.data || [])).catch(() => {});
  }, []);
  return (
    <div data-testid="admin-audit-page">
      {logs.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-slate-500">No admin actions logged yet.</div>
      ) : (
        <div className="glass rounded-2xl divide-y divide-white/5">
          {logs.map((l) => (
            <div key={l.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm" data-testid={`admin-audit-row-${l.id}`}>
              <div>
                <div className="font-medium">
                  <span className="text-vortex-cyan">{l.action}</span> · <span className="text-slate-400">{l.admin_email}</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">target: {l.target_id || "—"}</div>
              </div>
              <div className="text-xs text-slate-500">{new Date(l.ts).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
