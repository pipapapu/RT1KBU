import { useState } from "react";
import { useListIuran, useUpdateIuranStatus, useGenerateMonthlyIuran, getListIuranQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatRupiah, formatBulanTahun, formatTanggal } from "@/lib/format";
import { CheckCircle, Clock, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";

const STATUS_MAP = {
  belum_bayar: { label: "Belum Bayar", variant: "destructive" as const, icon: <AlertCircle className="w-3 h-3" /> },
  menunggu_verifikasi: { label: "Menunggu Verifikasi", variant: "secondary" as const, icon: <Clock className="w-3 h-3" /> },
  lunas: { label: "Lunas", variant: "default" as const, icon: <CheckCircle className="w-3 h-3" /> },
};

export default function AdminIuran() {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showBuktiDialog, setShowBuktiDialog] = useState<{ id: number; url: string; nama: string } | null>(null);
  const [generateForm, setGenerateForm] = useState({ bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear(), jumlah: 30000 });
  const qc = useQueryClient();
  const { toast } = useToast();

  const params = filterStatus ? { status: filterStatus as any } : {};
  const { data: iuranList, isLoading } = useListIuran(params);
  const updateStatus = useUpdateIuranStatus({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListIuranQueryKey() }); toast({ title: "Status iuran berhasil diperbarui" }); } } });
  const generateMonthly = useGenerateMonthlyIuran({ mutation: { onSuccess: (data) => { qc.invalidateQueries({ queryKey: getListIuranQueryKey() }); setShowGenerateDialog(false); toast({ title: `Berhasil membuat ${data.created} tagihan iuran` }); } } });

  const menungguCount = iuranList?.filter(i => i.status === "menunggu_verifikasi").length ?? 0;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Iuran</h1>
          <p className="text-sm text-muted-foreground">Verifikasi pembayaran dan kelola tagihan iuran warga</p>
        </div>
        <Button data-testid="button-generate-iuran" onClick={() => setShowGenerateDialog(true)}>
          <RefreshCw className="w-4 h-4 mr-2" />Generate Iuran Bulanan
        </Button>
      </div>

      {menungguCount > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="py-3 px-4 flex items-center gap-2 text-yellow-800">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{menungguCount} pembayaran menunggu verifikasi</span>
            <Button variant="link" size="sm" className="text-yellow-800 p-0 h-auto" onClick={() => setFilterStatus("menunggu_verifikasi")}>Lihat sekarang</Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        {[{ v: "", l: "Semua" }, { v: "belum_bayar", l: "Belum Bayar" }, { v: "menunggu_verifikasi", l: "Menunggu Verifikasi" }, { v: "lunas", l: "Lunas" }].map(({ v, l }) => (
          <Button key={v} data-testid={`filter-${v || "semua"}`} variant={filterStatus === v ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(v)}>{l}</Button>
        ))}
      </div>

      {isLoading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div> : (
        <div className="grid gap-3">
          {iuranList?.length === 0 && <p className="text-muted-foreground text-center py-8">Tidak ada data iuran.</p>}
          {iuranList?.map(iuran => {
            const s = STATUS_MAP[iuran.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.belum_bayar;
            return (
              <Card key={iuran.id} data-testid={`card-iuran-${iuran.id}`} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{iuran.namaWarga ?? "Warga"}</span>
                      <Badge variant={s.variant} className="flex items-center gap-1 text-xs">{s.icon}{s.label}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">Rumah: {iuran.nomorRumah ?? "-"} · {formatBulanTahun(iuran.bulan, iuran.tahun)}</div>
                    <div className="text-sm font-medium text-foreground">{formatRupiah(iuran.jumlah)}</div>
                    {iuran.buktiBayarUrl && (
                      <button data-testid={`button-lihat-bukti-${iuran.id}`} onClick={() => setShowBuktiDialog({ id: iuran.id, url: iuran.buktiBayarUrl!, nama: iuran.namaWarga ?? "" })} className="text-xs text-primary flex items-center gap-1 hover:underline">
                        <ExternalLink className="w-3 h-3" />Lihat Bukti Bayar
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {iuran.status === "menunggu_verifikasi" && (
                      <>
                        <Button size="sm" data-testid={`button-verifikasi-${iuran.id}`} onClick={() => updateStatus.mutate({ id: iuran.id, data: { status: "lunas" } })} disabled={updateStatus.isPending}>Konfirmasi Lunas</Button>
                        <Button size="sm" variant="outline" data-testid={`button-tolak-${iuran.id}`} onClick={() => updateStatus.mutate({ id: iuran.id, data: { status: "belum_bayar" } })} disabled={updateStatus.isPending}>Tolak</Button>
                      </>
                    )}
                    {iuran.status === "belum_bayar" && (
                      <Button size="sm" variant="outline" data-testid={`button-manual-lunas-${iuran.id}`} onClick={() => { if (confirm("Tandai lunas manual?")) updateStatus.mutate({ id: iuran.id, data: { status: "lunas" } }); }}>Lunas Manual</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Iuran Bulanan</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Akan membuat tagihan iuran untuk seluruh warga aktif yang belum memiliki tagihan di bulan tersebut.</p>
          <div className="space-y-3">
            <div>
              <Label>Bulan</Label>
              <select data-testid="select-bulan-generate" className="w-full border rounded-md p-2 mt-1 bg-background text-sm" value={generateForm.bulan} onChange={e => setGenerateForm(p => ({ ...p, bulan: Number(e.target.value) }))}>
                {["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].map((b, i) => (
                  <option key={i+1} value={i+1}>{b}</option>
                ))}
              </select>
            </div>
            <div><Label>Tahun</Label><Input data-testid="input-tahun-generate" type="number" value={generateForm.tahun} onChange={e => setGenerateForm(p => ({ ...p, tahun: Number(e.target.value) }))} /></div>
            <div><Label>Jumlah Iuran (Rp)</Label><Input data-testid="input-jumlah-generate" type="number" value={generateForm.jumlah} onChange={e => setGenerateForm(p => ({ ...p, jumlah: Number(e.target.value) }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Batal</Button>
            <Button data-testid="button-generate-submit" onClick={() => generateMonthly.mutate({ data: generateForm })} disabled={generateMonthly.isPending}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bukti Bayar Dialog */}
      <Dialog open={!!showBuktiDialog} onOpenChange={() => setShowBuktiDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bukti Pembayaran - {showBuktiDialog?.nama}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <img src={showBuktiDialog?.url} alt="Bukti Bayar" className="w-full rounded-md border" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <a href={showBuktiDialog?.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
              <ExternalLink className="w-3 h-3" />Buka di tab baru
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
