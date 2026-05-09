import { useState } from "react";
import { useListPengumuman, useCreatePengumuman, useUpdatePengumuman, useDeletePengumuman, getListPengumumanQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatTanggal } from "@/lib/format";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";

const KATEGORI_OPTIONS = ["Kegiatan", "Keamanan", "Rapat", "Kesehatan", "Umum"];

export default function AdminPengumuman() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({ judul: "", konten: "", kategori: "" });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: list, isLoading } = useListPengumuman();
  const create = useCreatePengumuman({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListPengumumanQueryKey() }); setShowDialog(false); toast({ title: "Pengumuman berhasil dibuat" }); } } });
  const update = useUpdatePengumuman({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListPengumumanQueryKey() }); setShowDialog(false); setEditItem(null); toast({ title: "Pengumuman berhasil diperbarui" }); } } });
  const remove = useDeletePengumuman({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListPengumumanQueryKey() }); toast({ title: "Pengumuman dihapus" }); } } });

  function openNew() { setEditItem(null); setForm({ judul: "", konten: "", kategori: "" }); setShowDialog(true); }
  function openEdit(item: any) { setEditItem(item); setForm({ judul: item.judul, konten: item.konten, kategori: item.kategori ?? "" }); setShowDialog(true); }

  function submit() {
    if (!form.judul || !form.konten) { toast({ title: "Judul dan konten wajib diisi", variant: "destructive" }); return; }
    if (editItem) { update.mutate({ id: editItem.id, data: form }); }
    else { create.mutate({ data: form }); }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola Pengumuman</h1>
          <p className="text-sm text-muted-foreground">Buat dan kelola pengumuman untuk warga RT</p>
        </div>
        <Button data-testid="button-tambah-pengumuman" onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />Buat Pengumuman
        </Button>
      </div>

      {isLoading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}</div> : (
        <div className="grid gap-4">
          {list?.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <Megaphone className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Belum ada pengumuman. Buat pengumuman pertama!</p>
            </div>
          )}
          {list?.map(item => (
            <Card key={item.id} data-testid={`card-pengumuman-${item.id}`} className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg leading-tight">{item.judul}</CardTitle>
                    {item.kategori && <Badge variant="outline" className="text-xs">{item.kategori}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTanggal(item.createdAt)}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" data-testid={`button-edit-pengumuman-${item.id}`} onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-destructive" data-testid={`button-delete-pengumuman-${item.id}`} onClick={() => { if (confirm("Hapus pengumuman ini?")) remove.mutate({ id: item.id }); }}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{item.konten}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? "Edit Pengumuman" : "Buat Pengumuman Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Judul *</Label><Input data-testid="input-judul-pengumuman" value={form.judul} onChange={e => setForm(p => ({ ...p, judul: e.target.value }))} placeholder="Judul pengumuman..." /></div>
            <div>
              <Label>Kategori</Label>
              <select data-testid="select-kategori" className="w-full border rounded-md p-2 mt-1 bg-background text-sm" value={form.kategori} onChange={e => setForm(p => ({ ...p, kategori: e.target.value }))}>
                <option value="">-- Pilih Kategori --</option>
                {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div><Label>Konten *</Label><Textarea data-testid="textarea-konten-pengumuman" rows={5} value={form.konten} onChange={e => setForm(p => ({ ...p, konten: e.target.value }))} placeholder="Isi pengumuman..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
            <Button data-testid="button-simpan-pengumuman" onClick={submit} disabled={create.isPending || update.isPending}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
