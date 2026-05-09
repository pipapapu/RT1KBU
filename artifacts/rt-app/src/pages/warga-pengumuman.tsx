import { useListPengumuman } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTanggal } from "@/lib/format";
import { Megaphone } from "lucide-react";

export default function WargaPengumuman() {
  const { data: list, isLoading } = useListPengumuman();

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengumuman RT</h1>
        <p className="text-sm text-muted-foreground">Informasi dan berita terbaru dari Ketua RT</p>
      </div>

      {isLoading ? <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div> : (
        <div className="grid gap-4">
          {list?.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <Megaphone className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Belum ada pengumuman saat ini.</p>
            </div>
          )}
          {list?.map(item => (
            <Card key={item.id} data-testid={`card-pengumuman-${item.id}`} className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg leading-tight">{item.judul}</CardTitle>
                    <div className="flex items-center gap-2">
                      {item.kategori && <Badge variant="outline" className="text-xs">{item.kategori}</Badge>}
                      <span className="text-xs text-muted-foreground">{formatTanggal(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.konten}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
