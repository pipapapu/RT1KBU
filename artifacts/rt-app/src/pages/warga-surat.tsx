import { useState } from "react";
import { useListMySurat, useCreateSurat, getListMySuratQueryKey, useGetMyWargaProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatTanggal } from "@/lib/format";
import { Plus, FileText, Clock, CheckCircle2, Loader2 } from "lucide-react";

const STATUS_MAP = {
  diajukan: { label: "Diajukan", variant: "secondary" as const, icon: <Clock className="w-3 h-3" /> },
  diproses: { label: "Diproses", variant: "default" as const, icon: <Loader2 className="w-3 h-3" /> },
  selesai: { label: "Selesai / Bisa Diambil", variant: "outline" as const, icon: <CheckCircle2 className="w-3 h-3" /> },
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
  const create = useCreateSurat({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListMySuratQueryKey() }); setShowDialog(false); toast({ title: "Permohonan surat berhasil diajukan!" }); } } });

  function openNew() {
    setForm({ namaLengkap: profile?.namaLengkap ?? "", nomorRumah: profile?.nomorRumah ?? "", jenisSurat: "", alasan: "" });
    setShowDialog(true);
  }

  function submit() {
    if (!form.namaLengkap || !form.jenisSurat || !form.alasan) { toast({ title: "Lengkapi semua data yang diperlukan", variant: "destructive" }); return; }
    create.mutate({ data: form });
  }

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

      <Card className="bg-muted/30">
        <CardContent className="py-3 px-4">
          <p className="text-sm text-muted-foreground">
            Permohonan surat akan diproses oleh Ketua RT. Surat dapat diambil setelah status berubah menjadi <strong>Selesai</strong>. Hubungi Pak RT untuk konfirmasi.
          </p>
        </CardContent>
      </Card>

      {isLoading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div> : (
        <div className="grid gap-3">
          {suratList?.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Belum ada permohonan surat.</p>
              <Button variant="outline" onClick={openNew}>Ajukan Sekarang</Button>
            </div>
          )}
          {suratList?.map(surat => {
            const s = STATUS_MAP[surat.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.diajukan;
            return (
              <Card key={surat.id} data-testid={`card-surat-${surat.id}`}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{surat.jenisSurat}</span>
                    <Badge variant={s.variant} className="flex items-center gap-1 text-xs whitespace-nowrap">{s.icon}{s.label}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{formatTanggal(surat.createdAt)}</div>
                  <div className="text-sm text-foreground/70 italic line-clamp-2">"{surat.alasan}"</div>
                  {surat.catatanAdmin && (
                    <div className="text-sm text-primary bg-primary/5 rounded p-2">
                      Catatan Admin: {surat.catatanAdmin}
                    </div>
                  )}
                  {surat.status === "selesai" && (
                    <div className="text-sm font-medium text-green-700 bg-green-50 rounded p-2">
                      Surat Anda sudah siap! Silakan ambil di rumah Ketua RT.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
