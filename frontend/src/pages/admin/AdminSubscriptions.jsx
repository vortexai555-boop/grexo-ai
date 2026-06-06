import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Copy } from "@phosphor-icons/react";

const STATUS_BADGE = {
  active: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  inactive: "bg-slate-500/15 text-slate-300 border border-slate-500/30",
  expired: "bg-red-500/15 text-red-300 border border-red-500/30",
};

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/admin/subscriptions");
        setSubs(r.data || []);
      } catch (e) {
        toast.error(e?.response?.data?.detail || "Load failed");
      }
    })();
  }, []);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div data-testid="admin-subscriptions-page">
      {subs.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-slate-500">No subscriptions yet.</div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-mono-accent">
                <tr>
                  <th className="text-left px-4 py-3">User ID</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-left px-4 py-3">Activation code</th>
                  <th className="text-left px-4 py-3">Start</th>
                  <th className="text-left px-4 py-3">End</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subs.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]" data-testid={`admin-sub-row-${s.id}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{s.user_id}</td>
                    <td className="px-4 py-3 capitalize">{s.plan}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => copy(s.activation_code)} className="font-mono text-vortex-cyan text-xs inline-flex items-center gap-1 hover:text-white">
                        {s.activation_code} <Copy size={11} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(s.start_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{s.end_date ? new Date(s.end_date).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs ${STATUS_BADGE[s.status] || STATUS_BADGE.inactive}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
