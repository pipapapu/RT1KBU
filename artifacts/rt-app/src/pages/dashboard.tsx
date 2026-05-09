import { useGetDashboardSummary, useGetPendingActions, useListPengumuman } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";
import { Users, Home, CheckCircle, AlertCircle, Clock, FileText, Wallet } from "lucide-react";
import { formatRupiah, formatTanggal } from "@/lib/format";

export default function Dashboard() {
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  const isAdmin = role === "admin";

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Selamat datang kembali, {user?.firstName || "Warga"}
        </p>
      </div>

      {isAdmin ? <AdminDashboard /> : <WargaDashboard />}
    </div>
  );
}

function AdminDashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: pending } = useGetPendingActions();

  if (isLoading) {
    return <div className="space-y-4">
      <Skeleton className="h-[120px] w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
      </div>
    </div>;
  }

  if (!summary) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Warga" value={summary.totalWarga} icon={<Users className="w-5 h-5 text-primary" />} />
        <StatCard title="Total KK" value={summary.totalKK} icon={<Home className="w-5 h-5 text-primary" />} />
        <StatCard title="Total Pemasukan" value={formatRupiah(summary.totalPemasukan)} icon={<Wallet className="w-5 h-5 text-primary" />} />
        <StatCard title="Iuran Lunas" value={summary.iuranLunasBulanIni} icon={<CheckCircle className="w-5 h-5 text-primary" />} />
        <StatCard title="Belum Bayar" value={summary.iuranBelumBayar} icon={<AlertCircle className="w-5 h-5 text-destructive" />} />
        <StatCard title="Menunggu Verifikasi" value={summary.iuranMenungguVerifikasi} icon={<Clock className="w-5 h-5 text-yellow-500" />} highlight={summary.iuranMenungguVerifikasi > 0} />
        <StatCard title="Surat Baru" value={summary.suratBaru} icon={<FileText className="w-5 h-5 text-primary" />} highlight={summary.suratBaru > 0} />
      </div>
    </div>
  );
}

function WargaDashboard() {
  const { data: pengumuman, isLoading } = useListPengumuman();

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2">Pengumuman Terbaru</h2>
      {pengumuman?.length === 0 ? (
        <p className="text-muted-foreground italic">Tidak ada pengumuman saat ini.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pengumuman?.slice(0, 4).map(p => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{p.judul}</CardTitle>
                <p className="text-xs text-muted-foreground">{formatTanggal(p.createdAt)}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm line-clamp-3">{p.konten}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, highlight = false }: { title: string, value: string | number, icon: React.ReactNode, highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-primary/50 shadow-sm" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
