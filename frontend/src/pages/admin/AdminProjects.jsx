import React from "react";
import useSWR from "swr";
import { api } from "@/lib/api";

export default function AdminProjects() {
  const { data, error } = useSWR("/admin/projects", (url) => api.get(url).then(r => r.data));

  if (error) return <div className="p-4 text-red-500">Failed to load projects</div>;
  if (!data) return <div className="p-4 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-light">Projects (Websites)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.projects?.map((p, i) => (
          <div key={i} className="p-4 border border-white/10 rounded-xl bg-white/5">
            <h3 className="font-medium text-white">{p.name || 'Untitled'}</h3>
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{p.description}</p>
            <div className="text-xs text-slate-500 mt-4 flex justify-between items-center">
              <span>{p.site_type}</span>
              <span>{new Date(p.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {data.projects?.length === 0 && (
          <div className="col-span-full p-4 text-center text-slate-400">No projects found.</div>
        )}
      </div>
    </div>
  );
}
