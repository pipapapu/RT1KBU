import { useState } from "react";
import { useListWarga, useListKK, useCreateWarga, useUpdateWarga, useDeleteWarga, useCreateKK, useUpdateKK, useDeleteKK, useLinkWargaUser, getListWargaQueryKey, getListKKQueryKey } from "@workspace/api-client-react";
import type { Warga, KartuKeluarga } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Users, Home } from "lucide-react";

export default function AdminWarga() {
  const [search, setSearch] = useState("");
  const [showWargaDialog, setShowWargaDialog] = useState(false);
  const [showKKDialog, setShowKKDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [editWarga, setEditWarga] = useState<Warga | null>(null);
  const [editKK, setEditKK] = useState<KartuKeluarga | null>(null);
  const [linkWarga, setLinkWarga] = useState<Warga | null>(null);

  const { data: wargaList, isLoading: wargaLoading } = useListWarga({ search });
  const { data: kkList, isLoading: kkLoading } = useListKK({ search });
  const qc = useQueryClient();
  const { toast } = useToast();

  const createWarga = useCreateWarga({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListWargaQueryKey() }); setShowWargaDialog(false); toast({ title: "Warga berhasil ditambahkan" }); } } });
  const updateWarga = useUpdateWarga({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListWargaQueryKey() }); setShowWargaDialog(false); setEditWarga(null); toast({ title: "Data warga berhasil diperbarui" }); } } });
  const deleteWarga = useDeleteWarga({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListWargaQueryKey() }); toast({ title: "Warga berhasil dihapus" }); } } });
  const createKK = useCreateKK({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListKKQueryKey() }); setShowKKDialog(false); toast({ title: "KK berhasil ditambahkan" }); } } });
  const updateKK = useUpdateKK({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListKKQueryKey() }); setShowKKDialog(false); setEditKK(null); toast({ title: "Data KK berhasil diperbarui" }); } } });
  const deleteKK = useDeleteKK({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListKKQueryKey() }); toast({ title: "KK berhasil dihapus" }); } } });
  const linkUser = useLinkWargaUser({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListWargaQueryKey() }); setShowLinkDialog(false); setLinkWarga(null); toast({ title: "Akun berhasil ditautkan" }); } } });

  const [wargaForm, setWargaForm] = useState({ kkId: 0, namaLengkap: "", nik: "", tempatLahir: "", tanggalLahir: "", namaOrangTua: "", nomorRumah: "", nomorTelepon: "" });
  const [kkForm, setKKForm] = useState({ nomorKK: "", nomorRumah: "", namaKepalaKeluarga: "" });
  const [linkClerkId, setLinkClerkId] = useState("");

  function openNewWarga() { setEditWarga(null); setWargaForm({ kkId: 0, namaLengkap: "", nik: "", tempatLahir: "", tanggalLahir: "", namaOrangTua: "", nomorRumah: "", nomorTelepon: "" }); setShowWargaDialog(true); }
  function openEditWarga(w: Warga) { setEditWarga(w); setWargaForm({ kkId: w.kkId, namaLengkap: w.namaLengkap, nik: w.nik, tempatLahir: w.tempatLahir ?? "", tanggalLahir: w.tanggalLahir ?? "", namaOrangTua: w.namaOrangTua ?? "", nomorRumah: w.nomorRumah, nomorTelepon: w.nomorTelepon ?? "" }); setShowWargaDialog(true); }
  function openNewKK() { setEditKK(null); setKKForm({ nomorKK: "", nomorRumah: "", namaKepalaKeluarga: "" }); setShowKKDialog(true); }
  function openEditKK(kk: KartuKeluarga) { setEditKK(kk); setKKForm({ nomorKK: kk.nomorKK, nomorRumah: kk.nomorRumah, namaKepalaKeluarga: kk.namaKepalaKeluarga }); setShowKKDialog(true); }

  function submitWarga() {
    if (!wargaForm.namaLengkap || !wargaForm.nik || !wargaForm.nomorRumah) { toast({ title: "Lengkapi data yang wajib diisi", variant: "destructive" }); return; }
    if (editWarga) { updateWarga.mutate({ id: editWarga.id, data: wargaForm }); }
    else { createWarga.mutate({ data: { ...wargaForm, kkId: Number(wargaForm.kkId) } }); }
  }
  function submitKK() {
    if (!kkForm.nomorKK || !kkForm.nomorRumah || !kkForm.namaKepalaKeluarga) { toast({ title: "Lengkapi semua data KK", variant: "destructive" }); return; }
    if (editKK) { updateKK.mutate({ id: editKK.id, data: kkForm }); }
    else { createKK.mutate({ data: kkForm }); }
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Warga & KK</h1>
          <p className="text-sm text-muted-foreground">Kelola data penduduk dan kartu keluarga</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input data-testid="input-search" placeholder="Cari nama, nomor rumah..." className="pl-9 w-64" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <Tabs defaultValue="warga">
        <TabsList>
          <TabsTrigger value="warga"><Users className="w-4 h-4 mr-2" />Data Warga</TabsTrigger>
          <TabsTrigger value="kk"><Home className="w-4 h-4 mr-2" />Kartu Keluarga</TabsTrigger>
        </TabsList>

        <TabsContent value="warga" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button data-testid="button-tambah-warga" onClick={openNewWarga}><Plus className="w-4 h-4 mr-2" />Tambah Warga</Button>
          </div>
          {wargaLoading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div> : (
            <div className="grid gap-3">
              {wargaList?.length === 0 && <p className="text-muted-foreground text-center py-8">Belum ada data warga.</p>}
              {wargaList?.map(w => (
                <Card key={w.id} data-testid={`card-warga-${w.id}`} className="hover:shadow-sm transition-shadow">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{w.namaLengkap}</span>
                        <Badge variant={w.isActive ? "default" : "secondary"}>{w.isActive ? "Aktif" : "Nonaktif"}</Badge>
                        {w.clerkUserId && <Badge variant="outline" className="text-xs">Terhubung</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">NIK: {w.nik}</div>
                      <div className="text-sm text-muted-foreground">Rumah: {w.nomorRumah} {w.kkNomor && `· KK: ${w.kkNomor}`}</div>
                      {w.nomorTelepon && <div className="text-sm text-muted-foreground">Telp: {w.nomorTelepon}</div>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" data-testid={`button-link-warga-${w.id}`} onClick={() => { setLinkWarga(w); setLinkClerkId(w.clerkUserId ?? ""); setShowLinkDialog(true); }}>Tautkan Akun</Button>
                      <Button variant="outline" size="sm" data-testid={`button-edit-warga-${w.id}`} onClick={() => openEditWarga(w as Warga)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" className="text-destructive" data-testid={`button-delete-warga-${w.id}`} onClick={() => { if (confirm("Hapus warga ini?")) deleteWarga.mutate({ id: w.id }); }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="kk" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button data-testid="button-tambah-kk" onClick={openNewKK}><Plus className="w-4 h-4 mr-2" />Tambah KK</Button>
          </div>
          {kkLoading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div> : (
            <div className="grid gap-3">
              {kkList?.length === 0 && <p className="text-muted-foreground text-center py-8">Belum ada data KK.</p>}
              {kkList?.map(kk => (
                <Card key={kk.id} data-testid={`card-kk-${kk.id}`} className="hover:shadow-sm transition-shadow">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                    <div className="space-y-1">
                      <div className="font-semibold">{kk.namaKepalaKeluarga}</div>
                      <div className="text-sm text-muted-foreground">No. KK: {kk.nomorKK} · Rumah: {kk.nomorRumah}</div>
                      <div className="text-sm text-muted-foreground">Anggota: {kk.wargaCount ?? 0} jiwa</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" data-testid={`button-edit-kk-${kk.id}`} onClick={() => openEditKK(kk as KartuKeluarga)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" className="text-destructive" data-testid={`button-delete-kk-${kk.id}`} onClick={() => { if (confirm("Hapus KK ini?")) deleteKK.mutate({ id: kk.id }); }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Warga Dialog */}
      <Dialog open={showWargaDialog} onOpenChange={setShowWargaDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editWarga ? "Edit Data Warga" : "Tambah Warga Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>KK (Kartu Keluarga)</Label>
              <select data-testid="select-kk" className="w-full border rounded-md p-2 mt-1 bg-background text-sm" value={wargaForm.kkId} onChange={e => setWargaForm(p => ({ ...p, kkId: Number(e.target.value) }))}>
                <option value={0}>-- Pilih KK --</option>
                {kkList?.map(kk => <option key={kk.id} value={kk.id}>{kk.namaKepalaKeluarga} - Rumah {kk.nomorRumah}</option>)}
              </select>
            </div>
            <div><Label>Nama Lengkap *</Label><Input data-testid="input-nama-warga" value={wargaForm.namaLengkap} onChange={e => setWargaForm(p => ({ ...p, namaLengkap: e.target.value }))} /></div>
            <div><Label>NIK *</Label><Input data-testid="input-nik" value={wargaForm.nik} onChange={e => setWargaForm(p => ({ ...p, nik: e.target.value }))} maxLength={16} /></div>
            <div><Label>Nomor Rumah *</Label><Input data-testid="input-nomor-rumah" value={wargaForm.nomorRumah} onChange={e => setWargaForm(p => ({ ...p, nomorRumah: e.target.value }))} /></div>
            <div><Label>Tempat Lahir</Label><Input data-testid="input-tempat-lahir" value={wargaForm.tempatLahir} onChange={e => setWargaForm(p => ({ ...p, tempatLahir: e.target.value }))} /></div>
            <div><Label>Tanggal Lahir</Label><Input data-testid="input-tanggal-lahir" type="date" value={wargaForm.tanggalLahir} onChange={e => setWargaForm(p => ({ ...p, tanggalLahir: e.target.value }))} /></div>
            <div><Label>Nama Orang Tua</Label><Input data-testid="input-nama-ortu" value={wargaForm.namaOrangTua} onChange={e => setWargaForm(p => ({ ...p, namaOrangTua: e.target.value }))} /></div>
            <div><Label>Nomor Telepon</Label><Input data-testid="input-nomor-telepon" value={wargaForm.nomorTelepon} onChange={e => setWargaForm(p => ({ ...p, nomorTelepon: e.target.value }))} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowWargaDialog(false)}>Batal</Button>
            <Button data-testid="button-simpan-warga" onClick={submitWarga} disabled={createWarga.isPending || updateWarga.isPending}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KK Dialog */}
      <Dialog open={showKKDialog} onOpenChange={setShowKKDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editKK ? "Edit Kartu Keluarga" : "Tambah Kartu Keluarga"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nomor KK *</Label><Input data-testid="input-nomor-kk" value={kkForm.nomorKK} onChange={e => setKKForm(p => ({ ...p, nomorKK: e.target.value }))} maxLength={16} /></div>
            <div><Label>Nomor Rumah *</Label><Input data-testid="input-nomor-rumah-kk" value={kkForm.nomorRumah} onChange={e => setKKForm(p => ({ ...p, nomorRumah: e.target.value }))} /></div>
            <div><Label>Nama Kepala Keluarga *</Label><Input data-testid="input-kepala-kk" value={kkForm.namaKepalaKeluarga} onChange={e => setKKForm(p => ({ ...p, namaKepalaKeluarga: e.target.value }))} /></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowKKDialog(false)}>Batal</Button>
            <Button data-testid="button-simpan-kk" onClick={submitKK} disabled={createKK.isPending || updateKK.isPending}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Clerk User Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tautkan Akun ke Warga</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Warga: <strong>{linkWarga?.namaLengkap}</strong></p>
          <div><Label>Clerk User ID</Label><Input data-testid="input-clerk-id" value={linkClerkId} onChange={e => setLinkClerkId(e.target.value)} placeholder="user_xxxxxxx" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Batal</Button>
            <Button data-testid="button-tautkan" onClick={() => { if (linkWarga) linkUser.mutate({ data: { wargaId: linkWarga.id, clerkUserId: linkClerkId } }); }} disabled={linkUser.isPending}>Tautkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
