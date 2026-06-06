import React, { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, UploadSimple, Trash } from "@phosphor-icons/react";

export default function AdminPaymentSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const r = await api.get("/payment-settings");
      setSettings({
        qr_image: r.data.qr_image || "",
        qr_mime: r.data.qr_mime || "image/png",
        qr_enabled: r.data.qr_enabled !== false,
        pro_price: r.data.pro_price ?? 29,
        business_price: r.data.business_price ?? 99,
        currency: r.data.currency || "USD",
        instructions: r.data.instructions || "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Please pick an image file"); return; }
    if (f.size > 2 * 1024 * 1024) { toast.error("Image must be smaller than 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const head = dataUrl.split(",")[0];
      const mime = head.split(":")[1].split(";")[0];
      const b64 = dataUrl.split(",")[1];
      setSettings((s) => ({ ...s, qr_image: b64, qr_mime: mime }));
    };
    reader.readAsDataURL(f);
  };

  const removeQr = async () => {
    if (!window.confirm("Delete the current QR code?")) return;
    try {
      await api.delete("/admin/payment-settings/qr");
      toast.success("QR removed");
      setSettings((s) => ({ ...s, qr_image: "" }));
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Delete failed");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        qr_enabled: settings.qr_enabled,
        pro_price: Number(settings.pro_price),
        business_price: Number(settings.business_price),
        currency: settings.currency,
        instructions: settings.instructions,
      };
      if (settings.qr_image) {
        payload.qr_image = settings.qr_image;
        payload.qr_mime = settings.qr_mime;
      }
      await api.put("/admin/payment-settings", payload);
      toast.success("Settings saved");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="text-mono-accent">Loading…</div>;
  }

  const qrSrc = settings.qr_image
    ? (settings.qr_image.startsWith("data:") ? settings.qr_image : `data:${settings.qr_mime};base64,${settings.qr_image}`)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="admin-settings-page">
      {/* QR */}
      <div className="glass rounded-2xl p-6">
        <div className="text-mono-accent mb-1">Payment QR</div>
        <h3 className="text-xl font-medium">Dynamic QR code</h3>
        <p className="text-sm text-slate-400 mt-1">Users will see this on the payment page. Upload PNG/JPG up to 2 MB.</p>

        <div className="mt-6 flex items-center justify-center min-h-[240px]">
          {qrSrc ? (
            <div className="bg-white rounded-2xl p-4 shadow-2xl">
              <img src={qrSrc} alt="QR" className="w-48 h-48 object-contain" data-testid="admin-settings-qr-preview" />
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-dashed border-white/15 rounded-2xl p-10 text-center">
              <QrCode size={36} className="mx-auto text-slate-500" />
              <p className="mt-2 text-slate-500 text-sm">No QR uploaded</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" data-testid="admin-settings-qr-file" />
          <Button onClick={() => fileRef.current?.click()} className="btn-primary-vortex" data-testid="admin-settings-qr-upload">
            <UploadSimple size={14} className="mr-1.5" /> {qrSrc ? "Replace QR" : "Upload QR"}
          </Button>
          {qrSrc && (
            <Button variant="outline" onClick={removeQr} className="btn-ghost-vortex" data-testid="admin-settings-qr-remove">
              <Trash size={14} className="mr-1.5" /> Remove
            </Button>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl p-4">
          <div>
            <div className="text-sm font-medium">QR payments enabled</div>
            <div className="text-xs text-slate-500">Toggle off to temporarily disable manual payments.</div>
          </div>
          <Switch
            checked={settings.qr_enabled}
            onCheckedChange={(v) => setSettings({ ...settings, qr_enabled: v })}
            data-testid="admin-settings-qr-enabled"
          />
        </div>
      </div>

      {/* Prices */}
      <div className="glass rounded-2xl p-6">
        <div className="text-mono-accent mb-1">Pricing</div>
        <h3 className="text-xl font-medium">Plan prices</h3>
        <p className="text-sm text-slate-400 mt-1">Changes apply immediately to the public pricing page.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <Label className="text-slate-300 text-xs uppercase tracking-widest">Pro price</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={settings.pro_price}
              onChange={(e) => setSettings({ ...settings, pro_price: e.target.value })}
              className="mt-2 h-11 bg-vortex-elevated border-white/10"
              data-testid="admin-settings-pro-price"
            />
          </div>
          <div>
            <Label className="text-slate-300 text-xs uppercase tracking-widest">Business price</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={settings.business_price}
              onChange={(e) => setSettings({ ...settings, business_price: e.target.value })}
              className="mt-2 h-11 bg-vortex-elevated border-white/10"
              data-testid="admin-settings-business-price"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label className="text-slate-300 text-xs uppercase tracking-widest">Currency</Label>
          <Select value={settings.currency} onValueChange={(v) => setSettings({ ...settings, currency: v })}>
            <SelectTrigger className="mt-2 h-11 bg-vortex-elevated border-white/10" data-testid="admin-settings-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="INR">INR (₹)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4">
          <Label className="text-slate-300 text-xs uppercase tracking-widest">Payment instructions</Label>
          <Textarea
            value={settings.instructions}
            onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
            placeholder="Scan the QR with your UPI app and complete payment…"
            className="mt-2 min-h-[90px] bg-vortex-elevated border-white/10"
            data-testid="admin-settings-instructions"
          />
        </div>

        <Button onClick={save} disabled={saving} className="mt-6 w-full h-11 btn-primary-vortex" data-testid="admin-settings-save">
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
