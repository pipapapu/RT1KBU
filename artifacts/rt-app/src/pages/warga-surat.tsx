import { useState } from "react";
import { useListMySurat, useCreateSurat, getListMySuratQueryKey, useGetMyWargaProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatTanggal } from "@/lib/format";
import { Plus, FileText, Clock, CheckCircle2, Loader2, MapPin } from "lucide-react";

type SuratStatus = "diajukan" | "diproses" | "selesai";

const STATUS_CONFIG: Record<SuratStatus, {
  label: string;
  desc: string;
  icon: React.ReactNode;
  cardClass: string;
  labelClass: string;
  step: number;
}> = {
  diajukan: {
    label: "Menunggu Diproses",
    desc: "Permohonan Anda telah diterima dan menunggu ditindaklanjuti oleh Ketua RT.",
    icon: <Clock className="w-5 h-5 text-amber-500" />,
    cardClass: "border-amber-200 bg-amber-50/50",
    labelClass: "bg-amber-100 text-amber-800 border border-amber-200",
    step: 1,
  },
  diproses: {
    label: "Sedang Diproses",
    desc: "Surat Anda sedang dibuat oleh Ketua RT. Harap menunggu konfirmasi selanjutnya.",
    icon: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
    cardClass: "border-blue-200 bg-blue-50/50",
    labelClass: "bg-blue-100 text-blue-800 border border-blue-200",
    step: 2,
  },
  selesai: {
    label: "Siap Diambil",
    desc: "Surat Anda sudah siap! Silakan ambil langsung ke rumah Ketua RT.",
    icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    cardClass: "border-green-300 bg-green-50 ring-1 ring-green-200",
    labelClass: "bg-green-100 text-green-800 border border-green-300",
    step: 3,
  },
};

const JENIS_SURAT = [
  "Surat Pengantar Domisili",
  "Surat Keterangan Tidak Mampu",
  "Surat Keterangan Usaha",
  "Surat Pengantar SKCK",
  "Surat Keterangan Kelahiran",
  "Surat Keterangan Kematian",
  "Surat Lainnya",
];

export default function WargaSurat() {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ namaLengkap: "", nomorRumah: "", jenisSurat: "", alasan: "" });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: suratList, isLoading } = useListMySurat();
  const { data: profile } = useGetMyWargaProfile();
  const create = useCreateSurat({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListMySuratQueryKey() });
        setShowDialog(false);
        toast({ title: "Permohonan surat berhasil diajukan!" });
      },
    },
  });

  function openNew() {
    setForm({ namaLengkap: profile?.namaLengkap ?? "", nomorRumah: profile?.nomorRumah ?? "", jenisSurat: "", alasan: "" });
    setShowDialog(true);
  }

  function submit() {
    if (!form.namaLengkap || !form.jenisSurat || !form.alasan) {
      toast({ title: "Lengkapi semua data yang diperlukan", variant: "destructive" });
      return;
    }
    create.mutate({ data: form });
  }

  const readySurat = suratList?.filter(s => s.status === "selesai") ?? [];
  const activeSurat = suratList?.filter(s => s.status !== "selesai") ?? [];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengajuan Surat</h1>
          <p className="text-sm text-muted-foreground">Ajukan permohonan surat pengantar dari RT</p>
        </div>
        <Button data-testid="button-ajukan-surat" onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />Ajukan Surat
        </Button>
      </div>

      {/* Ready to pick up — shown prominently at the top */}
      {readySurat.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wide flex items-center gap-2">
            <MapPin className="w-4 h-4" />Siap Diambil
          </h2>
          {readySurat.map(surat => (
            <SuratCard key={surat.id} surat={surat} />
          ))}
        </div>
      )}

      {/* Active requests */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : (
        <>
          {activeSurat.length > 0 && (
            <div className="space-y-3">
              {readySurat.length > 0 && <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Sedang Berjalan</h2>}
              {activeSurat.map(surat => <SuratCard key={surat.id} surat={surat} />)}
            </div>
          )}

          {suratList?.length === 0 && (
            <div className="text-center py-14 space-y-3">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Belum ada permohonan surat.</p>
              <Button variant="outline" onClick={openNew}>Ajukan Sekarang</Button>
            </div>
          )}
        </>
      )}

      <Card className="bg-muted/30">
        <CardContent className="py-3 px-4">
          <p className="text-sm text-muted-foreground">
            Surat dapat diambil langsung ke rumah Ketua RT setelah status berubah menjadi <strong className="text-green-700">Siap Diambil</strong>.
          </p>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Ajukan Permohonan Surat</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama Lengkap *</Label><Input data-testid="input-nama-surat" value={form.namaLengkap} onChange={e => setForm(p => ({ ...p, namaLengkap: e.target.value }))} /></div>
            <div><Label>Nomor Rumah</Label><Input data-testid="input-nomor-rumah-surat" value={form.nomorRumah} onChange={e => setForm(p => ({ ...p, nomorRumah: e.target.value }))} /></div>
            <div>
              <Label>Jenis Surat *</Label>
              <select data-testid="select-jenis-surat" className="w-full border rounded-md p-2 mt-1 bg-background text-sm" value={form.jenisSurat} onChange={e => setForm(p => ({ ...p, jenisSurat: e.target.value }))}>
                <option value="">-- Pilih Jenis Surat --</option>
                {JENIS_SURAT.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div><Label>Alasan Pembuatan Surat *</Label><Textarea data-testid="textarea-alasan" rows={4} value={form.alasan} onChange={e => setForm(p => ({ ...p, alasan: e.target.value }))} placeholder="Jelaskan alasan Anda memerlukan surat ini..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
            <Button data-testid="button-submit-surat" onClick={submit} disabled={create.isPending}>Ajukan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SuratCard({ surat }: { surat: { id: number; jenisSurat: string; alasan: string; status: string; createdAt: string; catatanAdmin?: string | null } }) {
  const status = (surat.status as SuratStatus) in STATUS_CONFIG ? surat.status as SuratStatus : "diajukan";
  const cfg = STATUS_CONFIG[status];

  return (
    <Card data-testid={`card-surat-${surat.id}`} className={`transition-all ${cfg.cardClass}`}>
      <CardContent className="py-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="font-semibold text-foreground">{surat.jenisSurat}</div>
            <div className="text-xs text-muted-foreground">{formatTanggal(surat.createdAt)}</div>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${cfg.labelClass}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        </div>

        {/* Progress steps */}
        <ProgressSteps step={cfg.step} />

        {/* Status description */}
        <p className="text-sm text-muted-foreground">{cfg.desc}</p>

        {/* Admin note if any */}
        {surat.catatanAdmin && (
          <div className="text-sm rounded-md p-2.5 bg-background/80 border border-border">
            <span className="font-medium text-foreground">Catatan RT:</span>{" "}
            <span className="text-foreground/80">{surat.catatanAdmin}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressSteps({ step }: { step: number }) {
  const steps = [
    { label: "Diajukan" },
    { label: "Diproses" },
    { label: "Siap Diambil" },
  ];
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done = i + 1 < step;
        const current = i + 1 === step;
        return (
          <div key={s.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${done ? "bg-primary text-primary-foreground" : current ? "bg-primary text-primary-foreground ring-2 ring-primary/30" : "bg-muted text-muted-foreground"}`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${current ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 ${done ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
