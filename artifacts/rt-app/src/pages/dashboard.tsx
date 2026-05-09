import { useGetDashboardSummary, useListPengumuman, useListMySurat } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { Users, Home, CheckCircle, AlertCircle, Clock, FileText, Wallet, MapPin, Loader2, ChevronRight } from "lucide-react";
import { formatRupiah, formatTanggal } from "@/lib/format";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Dashboard() {
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  const isAdmin = role === "admin";

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Selamat datang kembali, <strong>{user?.firstName || "Warga"}</strong>
        </p>
      </div>
      {isAdmin ? <AdminDashboard /> : <WargaDashboard />}
    </div>
  );
}

function AdminDashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Warga" value={summary.totalWarga} icon={<Users className="w-5 h-5 text-primary" />} />
        <StatCard title="Total KK" value={summary.totalKK} icon={<Home className="w-5 h-5 text-primary" />} />
        <StatCard title="Total Pemasukan" value={formatRupiah(summary.totalPemasukan)} icon={<Wallet className="w-5 h-5 text-primary" />} />
        <StatCard title="Iuran Lunas" value={summary.iuranLunasBulanIni} icon={<CheckCircle className="w-5 h-5 text-primary" />} />
        <StatCard title="Belum Bayar" value={summary.iuranBelumBayar} icon={<AlertCircle className="w-5 h-5 text-destructive" />} alert />
        <StatCard title="Menunggu Verifikasi" value={summary.iuranMenungguVerifikasi} icon={<Clock className="w-5 h-5 text-amber-500" />} alert={summary.iuranMenungguVerifikasi > 0} />
        <StatCard title="Surat Baru" value={summary.suratBaru} icon={<FileText className="w-5 h-5 text-primary" />} alert={summary.suratBaru > 0} />
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link href="/admin/iuran">
          <Button variant="outline" size="sm">
            Kelola Iuran <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
        <Link href="/admin/surat">
          <Button variant="outline" size="sm">
            Permohonan Surat <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function WargaDashboard() {
  const { data: pengumuman, isLoading: pengumumanLoading } = useListPengumuman();
  const { data: suratList, isLoading: suratLoading } = useListMySurat();

  const activeSurat = suratList?.filter(s => s.status !== "selesai") ?? [];
  const readySurat = suratList?.filter(s => s.status === "selesai") ?? [];

  return (
    <div className="space-y-8">
      {/* Letter status section — always visible if any exist */}
      {(suratLoading || (suratList && suratList.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Status Surat Anda</h2>
            <Link href="/warga/surat" className="text-sm text-primary hover:underline">Lihat semua</Link>
          </div>

          {suratLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <div className="grid gap-3">
              {/* Ready to pick up — highest priority */}
              {readySurat.map(surat => (
                <SuratStatusCard key={surat.id} surat={surat} />
              ))}
              {/* In-progress */}
              {activeSurat.slice(0, 2).map(surat => (
                <SuratStatusCard key={surat.id} surat={surat} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Announcements */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground border-b pb-2">Pengumuman Terbaru</h2>
        {pengumumanLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : pengumuman?.length === 0 ? (
          <p className="text-muted-foreground italic text-sm">Tidak ada pengumuman saat ini.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pengumuman?.slice(0, 4).map(p => (
              <Card key={p.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base leading-tight">{p.judul}</CardTitle>
                  <p className="text-xs text-muted-foreground">{formatTanggal(p.createdAt)}</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm line-clamp-3 text-foreground/80">{p.konten}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type SuratItem = { id: number; jenisSurat: string; status: string; createdAt: string; catatanAdmin?: string | null };

function SuratStatusCard({ surat }: { surat: SuratItem }) {
  const isReady = surat.status === "selesai";
  const isProcessing = surat.status === "diproses";

  if (isReady) {
    return (
      <Card data-testid={`dashboard-surat-${surat.id}`} className="border-green-300 bg-green-50 ring-1 ring-green-200">
        <CardContent className="py-4 flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-green-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-green-800">{surat.jenisSurat}</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-200 text-green-900">
                <CheckCircle className="w-3 h-3" /> Siap Diambil
              </span>
            </div>
            <p className="text-sm text-green-800 mt-1">
              Surat Anda sudah jadi! Silakan ambil langsung ke rumah Ketua RT.
            </p>
            {surat.catatanAdmin && (
              <p className="text-xs text-green-700 mt-1 italic">Catatan RT: {surat.catatanAdmin}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid={`dashboard-surat-${surat.id}`} className={isProcessing ? "border-blue-200 bg-blue-50/50" : "border-amber-200 bg-amber-50/50"}>
      <CardContent className="py-4 flex items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isProcessing ? "bg-blue-100" : "bg-amber-100"}`}>
          {isProcessing
            ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            : <Clock className="w-5 h-5 text-amber-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">{surat.jenisSurat}</span>
            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${isProcessing ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
              {isProcessing ? "Sedang Diproses" : "Menunggu Diproses"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isProcessing
              ? "Surat Anda sedang dibuat oleh Ketua RT."
              : "Permohonan diterima, menunggu ditindaklanjuti."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, icon, alert = false }: { title: string; value: string | number; icon: React.ReactNode; alert?: boolean }) {
  return (
    <Card className={alert && value !== 0 ? "border-amber-200 bg-amber-50/30" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
