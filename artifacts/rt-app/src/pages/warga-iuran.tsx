import { useState } from "react";
import { useListMyIuran, useUploadBuktiBayar, getListMyIuranQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatRupiah, formatBulanTahun } from "@/lib/format";
import { CheckCircle, Clock, AlertCircle, Upload, Info } from "lucide-react";

const STATUS_MAP = {
  belum_bayar: { label: "Belum Bayar", variant: "destructive" as const, icon: <AlertCircle className="w-3 h-3" /> },
  menunggu_verifikasi: { label: "Menunggu Verifikasi", variant: "secondary" as const, icon: <Clock className="w-3 h-3" /> },
  lunas: { label: "Lunas", variant: "default" as const, icon: <CheckCircle className="w-3 h-3" /> },
};

const PAYMENT_INFO = [
  { method: "GOPAY", number: "083893495975", name: "Diana Rosliana" },
  { method: "DANA", number: "081556567854", name: "Diana Rosliana" },
  { method: "SeaBank", number: "901501258859", name: "Diana Rosliana" },
];

export default function WargaIuran() {
  const [showUploadDialog, setShowUploadDialog] = useState<any | null>(null);
  const [buktiUrl, setBuktiUrl] = useState("");
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: iuranList, isLoading } = useListMyIuran();
  const uploadBukti = useUploadBuktiBayar({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListMyIuranQueryKey() }); setShowUploadDialog(null); setBuktiUrl(""); toast({ title: "Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin." }); } } });

  const belumBayarCount = iuranList?.filter(i => i.status === "belum_bayar").length ?? 0;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Iuran Bulanan</h1>
          <p className="text-sm text-muted-foreground">Status tagihan dan pembayaran iuran Anda</p>
        </div>
        <Button variant="outline" data-testid="button-info-pembayaran" onClick={() => setShowPaymentInfo(true)}>
          <Info className="w-4 h-4 mr-2" />Info Pembayaran
        </Button>
      </div>

      {belumBayarCount > 0 && (
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="py-3 px-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive font-medium">Anda memiliki {belumBayarCount} tagihan yang belum dibayar</span>
          </CardContent>
        </Card>
      )}

      {isLoading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div> : (
        <div className="grid gap-3">
          {iuranList?.length === 0 && (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <p>Belum ada tagihan iuran. Hubungi admin RT jika ada pertanyaan.</p>
              </CardContent>
            </Card>
          )}
          {iuranList?.map(iuran => {
            const s = STATUS_MAP[iuran.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.belum_bayar;
            return (
              <Card key={iuran.id} data-testid={`card-iuran-${iuran.id}`}>
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatBulanTahun(iuran.bulan, iuran.tahun)}</span>
                      <Badge variant={s.variant} className="flex items-center gap-1 text-xs">{s.icon}{s.label}</Badge>
                    </div>
                    <div className="text-lg font-bold text-foreground">{formatRupiah(iuran.jumlah)}</div>
                    {iuran.buktiBayarUrl && iuran.status === "menunggu_verifikasi" && (
                      <div className="text-xs text-muted-foreground">Bukti sudah dikirim, menunggu konfirmasi admin</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {iuran.status === "belum_bayar" && (
                      <Button size="sm" data-testid={`button-bayar-${iuran.id}`} onClick={() => { setShowUploadDialog(iuran); setBuktiUrl(""); setShowPaymentInfo(true); }}>
                        <Upload className="w-4 h-4 mr-2" />Kirim Bukti Bayar
                      </Button>
                    )}
                    {iuran.status === "menunggu_verifikasi" && (
                      <Button size="sm" variant="outline" data-testid={`button-update-bukti-${iuran.id}`} onClick={() => { setShowUploadDialog(iuran); setBuktiUrl(iuran.buktiBayarUrl ?? ""); }}>
                        Perbarui Bukti
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment Info Dialog */}
      <Dialog open={showPaymentInfo} onOpenChange={(o) => { setShowPaymentInfo(o); if (showUploadDialog && !o) { } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Informasi Pembayaran</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Silakan transfer ke salah satu rekening berikut, lalu kirim bukti pembayaran.</p>
          <div className="space-y-3">
            {PAYMENT_INFO.map(p => (
              <Card key={p.method} className="bg-muted/50">
                <CardContent className="py-3 px-4">
                  <div className="font-semibold text-primary">{p.method}</div>
                  <div className="text-lg font-mono font-bold">{p.number}</div>
                  <div className="text-sm text-muted-foreground">a/n {p.name}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => { setShowPaymentInfo(false); if (!showUploadDialog && iuranList?.find(i => i.status === "belum_bayar")) setShowUploadDialog(iuranList.find(i => i.status === "belum_bayar")); }}>Lanjut Kirim Bukti</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Bukti Dialog */}
      <Dialog open={!!showUploadDialog} onOpenChange={() => setShowUploadDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Kirim Bukti Pembayaran</DialogTitle></DialogHeader>
          {showUploadDialog && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm text-muted-foreground">Tagihan:</div>
                <div className="font-semibold">{formatBulanTahun(showUploadDialog.bulan, showUploadDialog.tahun)} — {formatRupiah(showUploadDialog.jumlah)}</div>
              </div>
              <div>
                <Label>URL Bukti Pembayaran *</Label>
                <Input data-testid="input-bukti-url" className="mt-1" value={buktiUrl} onChange={e => setBuktiUrl(e.target.value)} placeholder="https://drive.google.com/... atau link foto lainnya" />
                <p className="text-xs text-muted-foreground mt-1">Upload foto ke Google Drive, WhatsApp, atau layanan lain lalu tempel link-nya di sini.</p>
              </div>
              {buktiUrl && <img src={buktiUrl} alt="Preview" className="w-full rounded-md border" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(null)}>Batal</Button>
            <Button data-testid="button-kirim-bukti" onClick={() => { if (!buktiUrl) { toast({ title: "Masukkan link bukti bayar", variant: "destructive" }); return; } uploadBukti.mutate({ id: showUploadDialog.id, data: { buktiBayarUrl: buktiUrl } }); }} disabled={uploadBukti.isPending}>Kirim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
