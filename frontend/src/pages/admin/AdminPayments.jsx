import React, { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Clock, Copy } from "@phosphor-icons/react";

const STATUS_BADGE = {
  pending: "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-300 border border-red-500/30",
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState("pending");

  const load = async () => {
    try {
      const r = await api.get("/admin/payments");
      setPayments(r.data || []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to load payments");
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (p) => {
    if (!window.confirm(`Approve payment from ${p.email} for ${p.plan.toUpperCase()} plan?`)) return;
    setBusyId(p.id);
    try {
      const r = await api.post(`/admin/payments/${p.id}/approve`);
      toast.success(`Approved — activation code ${r.data.activation_code}`);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Approval failed");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (p) => {
    if (!window.confirm(`Reject payment ${p.utr_number}?`)) return;
    setBusyId(p.id);
    try {
      await api.post(`/admin/payments/${p.id}/reject`);
      toast.success("Payment rejected");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Reject failed");
    } finally {
      setBusyId(null);
    }
  };

  const copyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success("Activation code copied");
  };

  const filtered = useMemo(
    () => payments.filter((p) => (tab === "all" ? true : p.status === tab)),
    [payments, tab]
  );

  const counts = useMemo(() => ({
    all: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    approved: payments.filter((p) => p.status === "approved").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
  }), [payments]);

  return (
    <div data-testid="admin-payments-page">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-vortex-elevated border border-white/5">
          <TabsTrigger value="pending" data-testid="admin-payments-tab-pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved" data-testid="admin-payments-tab-approved">Approved ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="admin-payments-tab-rejected">Rejected ({counts.rejected})</TabsTrigger>
          <TabsTrigger value="all" data-testid="admin-payments-tab-all">All ({counts.all})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="m-0 mt-5">
          {filtered.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-slate-500" data-testid="admin-payments-empty">
              No {tab !== "all" ? tab : ""} payments yet.
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.02] text-mono-accent">
                    <tr>
                      <th className="text-left px-4 py-3">User</th>
                      <th className="text-left px-4 py-3">Plan</th>
                      <th className="text-left px-4 py-3">UTR</th>
                      <th className="text-left px-4 py-3">Amount</th>
                      <th className="text-left px-4 py-3">Submitted</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02]" data-testid={`admin-payment-row-${p.id}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.email}</div>
                        </td>
                        <td className="px-4 py-3 capitalize">{p.plan}</td>
                        <td className="px-4 py-3 font-mono text-xs">{p.utr_number}</td>
                        <td className="px-4 py-3">{p.currency === "INR" ? "₹" : "$"}{p.amount ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{new Date(p.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs ${STATUS_BADGE[p.status]} inline-flex items-center gap-1.5`}>
                            {p.status === "approved" ? <Check size={12} weight="bold" /> : p.status === "rejected" ? <X size={12} weight="bold" /> : <Clock size={12} />}
                            {p.status}
                          </span>
                          {p.activation_code && (
                            <button
                              onClick={() => copyCode(p.activation_code)}
                              className="mt-1.5 flex items-center gap-1 text-[11px] text-vortex-cyan font-mono hover:text-white"
                              data-testid={`admin-payment-code-${p.id}`}
                            >
                              {p.activation_code} <Copy size={11} />
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.status === "pending" ? (
                            <div className="inline-flex gap-2">
                              <Button size="sm" onClick={() => approve(p)} disabled={busyId === p.id} className="btn-primary-vortex h-8" data-testid={`admin-payment-approve-${p.id}`}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => reject(p)} disabled={busyId === p.id} className="btn-ghost-vortex h-8" data-testid={`admin-payment-reject-${p.id}`}>
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
