import { useState } from "react";
import { useListSurat, useUpdateSuratStatus, getListSuratQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatTanggal } from "@/lib/format";
import { FileText, Clock, CheckCircle2, Loader2 } from "lucide-react";

const STATUS_MAP = {
  diajukan: { label: "Diajukan", variant: "secondary" as const, icon: <Clock className="w-3 h-3" /> },
  diproses: { label: "Diproses", variant: "default" as const, icon: <Loader2 className="w-3 h-3" /> },
  selesai: { label: "Selesai / Bisa Diambil", variant: "outline" as const, icon: <CheckCircle2 className="w-3 h-3" /> },
};

export default function AdminSurat() {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showDetailDialog, setShowDetailDialog] = useState<any | null>(null);
  const [catatanAdmin, setCatatanAdmin] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const params = filterStatus ? { status: filterStatus as any } : {};
  const { data: suratList, isLoading } = useListSurat(params);
  const updateStatus = useUpdateSuratStatus({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListSuratQueryKey() }); setShowDetailDialog(null); toast({ title: "Status surat diperbarui" }); } } });

  const baru = suratList?.filter(s => s.status === "diajukan").length ?? 0;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Permohonan Surat</h1>
        <p className="text-sm text-muted-foreground">Kelola permohonan surat dari warga</p>
      </div>

      {baru > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{baru} permohonan baru menunggu tindakan</span>
            <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={() => setFilterStatus("diajukan")}>Lihat</Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        {[{ v: "", l: "Semua" }, { v: "diajukan", l: "Diajukan" }, { v: "diproses", l: "Diproses" }, { v: "selesai", l: "Selesai" }].map(({ v, l }) => (
          <Button key={v} data-testid={`filter-surat-${v || "semua"}`} variant={filterStatus === v ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(v)}>{l}</Button>
        ))}
      </div>

      {isLoading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div> : (
        <div className="grid gap-3">
          {suratList?.length === 0 && <p className="text-muted-foreground text-center py-8">Tidak ada permohonan surat.</p>}
          {suratList?.map(surat => {
            const s = STATUS_MAP[surat.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.diajukan;
            return (
              <Card key={surat.id} data-testid={`card-surat-${surat.id}`} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setShowDetailDialog(surat); setCatatanAdmin(surat.catatanAdmin ?? ""); }}>
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{surat.namaLengkap}</span>
                      <Badge variant={s.variant} className="flex items-center gap-1 text-xs">{s.icon}{s.label}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{surat.jenisSurat} · Rumah: {surat.nomorRumah ?? "-"}</div>
                    <div className="text-sm text-muted-foreground">{formatTanggal(surat.createdAt)}</div>
                    <div className="text-sm line-clamp-1 text-foreground/70 italic">"{surat.alasan}"</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {surat.status === "diajukan" && <Button size="sm" data-testid={`button-proses-${surat.id}`} onClick={() => updateStatus.mutate({ id: surat.id, data: { status: "diproses" } })}>Proses</Button>}
                    {surat.status === "diproses" && <Button size="sm" data-testid={`button-selesai-${surat.id}`} onClick={() => updateStatus.mutate({ id: surat.id, data: { status: "selesai" } })}>Selesai</Button>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!showDetailDialog} onOpenChange={() => setShowDetailDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detail Permohonan Surat</DialogTitle></DialogHeader>
          {showDetailDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Nama:</span><div className="font-medium">{showDetailDialog.namaLengkap}</div></div>
                <div><span className="text-muted-foreground">Rumah:</span><div className="font-medium">{showDetailDialog.nomorRumah ?? "-"}</div></div>
                <div><span className="text-muted-foreground">Jenis Surat:</span><div className="font-medium">{showDetailDialog.jenisSurat}</div></div>
                <div><span className="text-muted-foreground">Diajukan:</span><div className="font-medium">{formatTanggal(showDetailDialog.createdAt)}</div></div>
              </div>
              <div><span className="text-sm text-muted-foreground">Alasan Pembuatan:</span><div className="mt-1 text-sm p-3 bg-muted rounded-md">{showDetailDialog.alasan}</div></div>
              <div>
                <Label>Catatan Admin (opsional)</Label>
                <Textarea data-testid="textarea-catatan-admin" className="mt-1" value={catatanAdmin} onChange={e => setCatatanAdmin(e.target.value)} placeholder="Tambahkan catatan untuk warga..." />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowDetailDialog(null)}>Tutup</Button>
            {showDetailDialog?.status === "diajukan" && <Button data-testid="button-dialog-proses" onClick={() => updateStatus.mutate({ id: showDetailDialog.id, data: { status: "diproses", catatanAdmin } })}>Tandai Diproses</Button>}
            {showDetailDialog?.status === "diproses" && <Button data-testid="button-dialog-selesai" onClick={() => updateStatus.mutate({ id: showDetailDialog.id, data: { status: "selesai", catatanAdmin } })}>Tandai Selesai</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
