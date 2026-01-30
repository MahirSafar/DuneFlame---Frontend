"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { sliderService } from "@/lib/services/sliderService";

interface SliderFormProps {
  slider?: any;
  onClose?: (refresh?: boolean) => void;
}

export default function SliderForm({ slider, onClose }: SliderFormProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title_az: slider?.translations?.[0]?.title || "",
      subtitle_az: slider?.translations?.[0]?.subtitle || "",
      button_text_az: slider?.translations?.[0]?.buttonText || "",
      image: undefined,
    },
  });

  useEffect(() => {
    if (slider) {
      reset({
        title_az: slider.translations?.[0]?.title || "",
        subtitle_az: slider.translations?.[0]?.subtitle || "",
        button_text_az: slider.translations?.[0]?.buttonText || "",
        image: undefined,
      });
    } else {
      reset({ title_az: "", subtitle_az: "", button_text_az: "", image: undefined });
    }
  }, [slider, reset]);

  const onSubmit = async (data: any) => {
    const formData = new FormData();
    if (data.image && data.image[0]) formData.append("image", data.image[0]);
    formData.append("translations[0].title", data.title_az);
    formData.append("translations[0].subtitle", data.subtitle_az);
    formData.append("translations[0].buttonText", data.button_text_az);
    formData.append("translations[0].languageCode", "az");
    try {
      if (slider?.id) {
        await sliderService.update(slider.id, formData);
      } else {
        await sliderService.create(formData);
      }
      if (onClose) onClose(true);
    } catch (e) {
      // Xəta mesajı göstərin
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 bg-white shadow rounded">
      <div>
        <label className="block text-sm font-medium">Slider Şəkli</label>
        <input type="file" {...register("image", { required: !slider })}
          className="mt-1 block w-full border rounded" />
        {errors.image && <span className="text-red-500 text-xs">Şəkil tələb olunur</span>}
      </div>
      <div>
        <label className="block text-sm font-medium">Başlıq (AZ)</label>
        <input {...register("title_az", { required: true })}
          className="mt-1 block w-full border p-2 rounded" placeholder="Başlıq daxil edin" />
        {errors.title_az && <span className="text-red-500 text-xs">Başlıq tələb olunur</span>}
      </div>
      <div>
        <label className="block text-sm font-medium">Alt Başlıq (AZ)</label>
        <input {...register("subtitle_az")}
          className="mt-1 block w-full border p-2 rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium">Düymə Mətni (AZ)</label>
        <input {...register("button_text_az")}
          className="mt-1 block w-full border p-2 rounded" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {slider ? "Yenilə" : "Yadda Saxla"}
        </button>
        {onClose && (
          <button type="button" onClick={() => onClose()} className="bg-gray-200 px-4 py-2 rounded">Bağla</button>
        )}
      </div>
    </form>
  );
}
