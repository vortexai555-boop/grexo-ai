import React from "react";
import useSWR from "swr";
import { api } from "@/lib/api";

export default function AdminSystem() {
  const { data, error } = useSWR("/admin/system", (url) => api.get(url).then(r => r.data));

  if (error) return <div className="p-4 text-red-500">Failed to load system info</div>;
  if (!data) return <div className="p-4 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light mb-4">Health Monitoring</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-white/10 rounded-xl bg-white/5">
            <div className="text-sm text-slate-400">Overall Status</div>
            <div className="text-xl font-medium mt-1 text-green-400 capitalize flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> {data.status}
            </div>
          </div>
          <div className="p-4 border border-white/10 rounded-xl bg-white/5">
            <div className="text-sm text-slate-400">CPU Usage</div>
            <div className="text-xl font-medium mt-1">{data.cpu_usage}%</div>
            <div className="w-full bg-white/10 h-1.5 mt-2 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full" style={{ width: `${data.cpu_usage}%` }}></div>
            </div>
          </div>
          <div className="p-4 border border-white/10 rounded-xl bg-white/5">
            <div className="text-sm text-slate-400">Memory Usage</div>
            <div className="text-xl font-medium mt-1">{data.memory_usage}%</div>
            <div className="w-full bg-white/10 h-1.5 mt-2 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full" style={{ width: `${data.memory_usage}%` }}></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-light mb-4">System Status</h2>
          <div className="border border-white/10 rounded-xl p-4 bg-white/5 space-y-4 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Database Connection</span>
              <span className="text-green-400">{data.db_status}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Rate Limits (Free)</span>
              <span>{data.rate_limits?.free}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Rate Limits (Pro)</span>
              <span>{data.rate_limits?.pro}</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-light mb-4">Error Logs</h2>
          <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 max-h-64 overflow-y-auto scrollbar-thin">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/10 text-slate-400 sticky top-0">
                <tr>
                  <th className="p-3 font-medium">Timestamp</th>
                  <th className="p-3 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recent_errors?.map((e, i) => (
                  <tr key={i} className="hover:bg-white/10">
                    <td className="p-3 text-slate-400 whitespace-nowrap">{new Date(e.created_at).toLocaleTimeString()}</td>
                    <td className="p-3 text-red-400 line-clamp-1">{e.summary}</td>
                  </tr>
                ))}
                {data.recent_errors?.length === 0 && (
                  <tr><td colSpan={2} className="p-4 text-center text-slate-400">No recent errors.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
