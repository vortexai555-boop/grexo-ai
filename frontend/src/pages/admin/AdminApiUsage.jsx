import React from "react";
import useSWR from "swr";
import { api } from "@/lib/api";

export default function AdminApiUsage() {
  const { data, error } = useSWR("/admin/api-usage", (url) => api.get(url).then(r => r.data));

  if (error) return <div className="p-4 text-red-500">Failed to load API usage</div>;
  if (!data) return <div className="p-4 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-light mb-4">Provider Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.providers?.map((p, i) => (
            <div key={i} className="p-4 border border-white/10 rounded-xl bg-white/5">
              <h3 className="font-medium text-white">{p.provider}</h3>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Total Calls</span>
                  <span className="text-white">{p.calls}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Errors</span>
                  <span className="text-red-400">{p.errors}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-light mb-4">Activity Summary</h2>
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="p-3 font-medium">Activity Type</th>
                <th className="p-3 font-medium">Total Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.activity?.map((a, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="p-3 capitalize">{a._id || 'unknown'}</td>
                  <td className="p-3">{a.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
