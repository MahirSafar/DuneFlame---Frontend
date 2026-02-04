"use client";
import { useEffect, useState } from "react";
import SliderForm from "@/components/admin/sliders/slider-form";
import { sliderService } from "@/lib/services/sliderService";
import { getImageUrl } from "@/lib/utils";

export default function AdminSlidersPage() {
  const [sliders, setSliders] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editSlider, setEditSlider] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSliders = async () => {
    setLoading(true);
    try {
      const data = await sliderService.getAll();
      // Backend PagedResult qaytardığı üçün data.items-a baxırıq
      if (typeof data === "object" && data !== null && "items" in data) {
        setSliders((data as { items: any[] }).items || []);
      } else if (Array.isArray(data)) {
        setSliders(data);
      } else {
        setSliders([]);
      }
    } catch (error) {
      console.error("Slider loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const handleAdd = () => {
    setEditSlider(null);
    setShowForm(true);
  };

  const handleEdit = (slider: any) => {
    setEditSlider(slider);
    setShowForm(true);
  };

  const handleFormClose = (refresh = false) => {
    setShowForm(false);
    setEditSlider(null);
    if (refresh) fetchSliders();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bu slideri silməyə əminsiniz?")) {
      await sliderService.delete(id);
      fetchSliders();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Sliderlər</h1>
        <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Əlavə et</button>
      </div>
      {showForm && (
        <SliderForm slider={editSlider} onClose={handleFormClose} />
      )}
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr>
              <th className="px-4 py-2 border">#</th>
              <th className="px-4 py-2 border">Başlıq</th>
              <th className="px-4 py-2 border">Şəkil</th>
              <th className="px-4 py-2 border">Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center p-4">Yüklənir...</td></tr>
            ) : sliders.length === 0 ? (
              <tr><td colSpan={4} className="text-center p-4">Slider yoxdur</td></tr>
            ) : (
              Array.isArray(sliders) ? (
                sliders.map((slider, idx) => (
                  <tr key={slider.id}>
                    <td className="border px-4 py-2">{idx + 1}</td>
                    <td className="border px-4 py-2">{slider.translations?.[0]?.title || "-"}</td>
                    <td className="border px-4 py-2">
                      {slider.imageUrl && (
                        <img 
                          src={getImageUrl(slider.imageUrl) || ""}
                          alt="slider"
                          className="h-12 w-auto rounded object-cover" 
                        />
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      <button onClick={() => handleEdit(slider)} className="text-blue-600 hover:underline mr-2">Redaktə</button>
                      <button onClick={() => handleDelete(slider.id)} className="text-red-600 hover:underline">Sil</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="text-center p-4">Slider məlumatı düzgün gəlmədi</td></tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
