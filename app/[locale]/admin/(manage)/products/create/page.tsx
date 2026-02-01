"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, X, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { getMasterData, createProductV2 } from "@/lib/services/products";
import type { MasterData } from "@/lib/types";
import toast from "react-hot-toast";

type FlavourNoteForm = {
  name: string;
  displayOrder: number;
  translations: { languageCode: string; name: string }[];
};

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [masterData, setMasterData] = useState<MasterData | null>(null);

  // --- Form States ---
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [stockInKg, setStockInKg] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [originId, setOriginId] = useState("");
  const [selectedRoasts, setSelectedRoasts] = useState<string[]>([]);
  const [selectedGrinds, setSelectedGrinds] = useState<string[]>([]);
  const [priceMatrix, setPriceMatrix] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0);
  const [flavourNotes, setFlavourNotes] = useState<FlavourNoteForm[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getMasterData();
        setMasterData(data);
      } catch (error) {
        toast.error("Məlumatlar yüklənmədi.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const updateMatrix = (weightId: string, currency: string, value: string) => {
    setPriceMatrix(prev => ({ ...prev, [`${weightId}_${currency}`]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Dublikat kliklərin qarşısını alırıq

    if (!selectedRoasts.length || !selectedGrinds.length || !images.length) {
      toast.error("Atributlar və Şəkillər mütləqdir!");
      return;
    }

    const formData = new FormData();

    // Backend-in top-level [Required] sahələri
    formData.append("Name", nameEn);
    formData.append("Description", descEn);
    formData.append("StockInKg", stockInKg);
    formData.append("CategoryId", categoryId);
    if (originId) formData.append("OriginId", originId);

    // 1. Translations (EN & AR)
    const translations = [
      { languageCode: "en", name: nameEn, description: descEn },
      { languageCode: "ar", name: nameAr, description: descAr }
    ];
    translations.forEach((tr, i) => {
      formData.append(`Translations[${i}].LanguageCode`, tr.languageCode);
      formData.append(`Translations[${i}].Name`, tr.name);
      formData.append(`Translations[${i}].Description`, tr.description);
    });

    // 2. Attributes (Repeated keys)
    selectedRoasts.forEach(id => formData.append("RoastLevelIds", id));
    selectedGrinds.forEach(id => formData.append("GrindTypeIds", id));

    // 3. Qiymətlər (USD və AED üçün tam sinxronizasiya)
    let pIdx = 0;
    const seenKeys = new Set();
    Object.entries(priceMatrix).forEach(([key, price]) => {
      // Qiymət boşdursa və ya 0-dırsa, göndərmirik
      if (!price || parseFloat(price) <= 0) return;

      // Composite key (Weight + Currency) təkrarını yoxlayırıq
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      const [wId, curr] = key.split("_"); // "guid_USD" -> ["guid", "USD"]

      formData.append(`Prices[${pIdx}].ProductWeightId`, wId);
      formData.append(`Prices[${pIdx}].Price`, price);
      formData.append(`Prices[${pIdx}].CurrencyCode`, curr); // Backend-dəki yeni sahəyə uyğun
      pIdx++;
    });

    // 4. Flavour Notes
    flavourNotes.forEach((fn, i) => {
      formData.append(`FlavourNotes[${i}].Name`, fn.name);
      formData.append(`FlavourNotes[${i}].DisplayOrder`, fn.displayOrder.toString());
      fn.translations.forEach((tr, ti) => {
        formData.append(`FlavourNotes[${i}].Translations[${ti}].LanguageCode`, tr.languageCode);
        formData.append(`FlavourNotes[${i}].Translations[${ti}].Name`, tr.name);
      });
    });

    // 5. Images
    images.forEach((img) => formData.append("Images", img));
    formData.append("MainImageIndex", mainImageIndex.toString());

    // FormData-nı göndərməzdən əvvəl konsola çıxarırıq
    // eslint-disable-next-line no-console
    console.log('--- FormData Payload ---');
    for (let pair of formData.entries()) {
      // eslint-disable-next-line no-console
      console.log(pair[0] + ': ' + pair[1]);
    }
    setSubmitting(true);
    try {
      await createProductV2(formData);
      toast.success("Məhsul uğurla yaradıldı!");
      router.push("/admin/products");
    } catch (error: any) {
      const errs = error?.response?.data?.errors;
      if (errs) Object.values(errs).flat().forEach((m: any) => toast.error(m));
      else toast.error("Server xətası baş verdi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Geri</Button>
        <h1 className="text-3xl font-bold">Yeni Məhsul Yaradın</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Ad və Təsvir (Çoxdilli)</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Badge>English (EN)</Badge>
              <div className="grid gap-2"><Label>Name *</Label><Input value={nameEn} onChange={e => setNameEn(e.target.value)} required /></div>
              <div className="grid gap-2"><Label>Description *</Label><Textarea value={descEn} onChange={e => setDescEn(e.target.value)} rows={3} required /></div>
            </div>
            <div className="space-y-4 text-right" dir="rtl">
              <Badge variant="secondary">العربية (AR)</Badge>
              <div className="grid gap-2"><Label>اسم المنتج *</Label><Input value={nameAr} onChange={e => setNameAr(e.target.value)} required /></div>
              <div className="grid gap-2"><Label>وصف المنتج *</Label><Textarea value={descAr} onChange={e => setDescAr(e.target.value)} rows={3} required /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Atributlar</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="grid gap-2">
                <Label>Kateqoriya *</Label>
                <Select onValueChange={setCategoryId} value={categoryId}>
                  <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                  <SelectContent>{masterData?.categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Stok (kq) *</Label><Input type="number" step="0.1" value={stockInKg} onChange={e => setStockInKg(e.target.value)} required /></div>
              <div className="grid gap-2">
                <Label>Mənşə (Origin)</Label>
                <Select onValueChange={setOriginId} value={originId}>
                  <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                  <SelectContent>{masterData?.origins.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-4 border-t">
              <div className="space-y-3">
                <Label className="font-bold">Roast Levels *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {masterData?.roastLevels.map(r => (
                    <div key={r.id} className="flex items-center space-x-2 border p-2 rounded">
                      <Checkbox id={`r-${r.id}`} checked={selectedRoasts.includes(r.id)} onCheckedChange={c => setSelectedRoasts(p => c ? [...p, r.id] : p.filter(x => x !== r.id))} />
                      <Label htmlFor={`r-${r.id}`} className="text-xs cursor-pointer">{r.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="font-bold">Grind Options *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {masterData?.grindTypes.map(g => (
                    <div key={g.id} className="flex items-center space-x-2 border p-2 rounded">
                      <Checkbox id={`g-${g.id}`} checked={selectedGrinds.includes(g.id)} onCheckedChange={c => setSelectedGrinds(p => c ? [...p, g.id] : p.filter(x => x !== g.id))} />
                      <Label htmlFor={`g-${g.id}`} className="text-xs cursor-pointer">{g.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Qiymət Matrisi (USD & AED)</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Çəki</th>
                  <th className="py-2">USD ($)</th>
                  <th className="py-2">AED (د.إ)</th>
                </tr>
              </thead>
              <tbody>
                {masterData?.weights.map(w => (
                  <tr key={w.id} className="border-b">
                    <td className="py-3 font-medium">{w.label}</td>
                    <td className="py-3 pr-2"><Input type="number" step="0.01" value={priceMatrix[`${w.id}_USD`] || ""} onChange={e => updateMatrix(w.id, "USD", e.target.value)} /></td>
                    <td className="py-3"><Input type="number" step="0.01" value={priceMatrix[`${w.id}_AED`] || ""} onChange={e => updateMatrix(w.id, "AED", e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Flavour Notes (Dad Notları) */}
        <Card>
          <CardHeader><CardTitle>Dad Notları (Flavour Notes)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {flavourNotes.map((note, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg space-y-4 relative bg-white text-gray-900 shadow-sm">
                <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2" onClick={() => setFlavourNotes(flavourNotes.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Not Adı (EN)</Label><Input value={note.name} onChange={e => { const u = [...flavourNotes]; u[i].name = e.target.value; setFlavourNotes(u); }} /></div>
                  <div className="grid gap-2"><Label>Sıra</Label><Input type="number" value={note.displayOrder} onChange={e => { const u = [...flavourNotes]; u[i].displayOrder = parseInt(e.target.value) || 0; setFlavourNotes(u); }} /></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Tərcümələr</Label>
                  {note.translations.map((tr, j) => (
                    <div key={j} className="flex gap-2">
                      <Input className="w-20" placeholder="en" value={tr.languageCode} onChange={e => { const u = [...flavourNotes]; u[i].translations[j].languageCode = e.target.value; setFlavourNotes(u); }} />
                      <Input className="flex-1" placeholder="Tərcümə" value={tr.name} onChange={e => { const u = [...flavourNotes]; u[i].translations[j].name = e.target.value; setFlavourNotes(u); }} />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => { const u = [...flavourNotes]; u[i].translations.push({ languageCode: "", name: "" }); setFlavourNotes(u); }}>Tərcümə əlavə et</Button>
                </div>
              </div>
            ))}
            <Button type="button" onClick={() => setFlavourNotes([...flavourNotes, { name: "", displayOrder: 0, translations: [] }])}><Plus className="mr-2 h-4 w-4" /> Yeni Not Əlavə Et</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Qalereya (Şəkillər)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" multiple accept="image/*" onChange={e => e.target.files && setImages([...images, ...Array.from(e.target.files)])} />
            <div className="flex flex-wrap gap-4">
              {images.map((img, idx) => (
                <div key={idx} className={`relative border-2 rounded-lg p-1 ${mainImageIndex === idx ? 'border-primary' : 'border-slate-200'}`}>
                  <img src={URL.createObjectURL(img)} className="w-24 h-24 object-cover rounded" alt="thumb" />
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button type="button" onClick={() => setMainImageIndex(idx)} className={`p-1 rounded-full ${mainImageIndex === idx ? 'bg-primary text-white' : 'bg-white shadow-sm'}`}><CheckCircle2 size={12} /></button>
                    <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="bg-destructive text-white p-1 rounded-full"><X size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-14 text-xl" disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin mr-2" /> : "Məhsulu Yaradın"}
        </Button>
      </form>
    </div>
  );
}