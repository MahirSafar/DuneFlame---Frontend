"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { sliderService, type AdminSlider } from "@/lib/services/sliderService";
import toast from "react-hot-toast";

interface SliderFormProps {
  slider?: AdminSlider;
  onClose?: (refresh?: boolean) => void;
}

interface FormValues {
  order: number;
  isActive: boolean;
  // EN
  title_en: string;
  subtitle_en: string;
  buttonText_en: string;
  linkUrl_en: string;
  // AR
  title_ar: string;
  subtitle_ar: string;
  buttonText_ar: string;
  linkUrl_ar: string;
  image: FileList | undefined;
}

function getTranslation(slider: AdminSlider | undefined, lang: string) {
  return slider?.translations?.find((t) => t.languageCode === lang);
}

export default function SliderForm({ slider, onClose }: SliderFormProps) {
  const isEdit = Boolean(slider?.id);
  const en = getTranslation(slider, "en");
  const ar = getTranslation(slider, "ar");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      order: slider?.order ?? 1,
      isActive: slider?.isActive ?? true,
      title_en: en?.title ?? "",
      subtitle_en: en?.subtitle ?? "",
      buttonText_en: en?.buttonText ?? "",
      linkUrl_en: en?.linkUrl ?? "",
      title_ar: ar?.title ?? "",
      subtitle_ar: ar?.subtitle ?? "",
      buttonText_ar: ar?.buttonText ?? "",
      linkUrl_ar: ar?.linkUrl ?? "",
      image: undefined,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    const en = getTranslation(slider, "en");
    const ar = getTranslation(slider, "ar");
    reset({
      order: slider?.order ?? 1,
      isActive: slider?.isActive ?? true,
      title_en: en?.title ?? "",
      subtitle_en: en?.subtitle ?? "",
      buttonText_en: en?.buttonText ?? "",
      linkUrl_en: en?.linkUrl ?? "",
      title_ar: ar?.title ?? "",
      subtitle_ar: ar?.subtitle ?? "",
      buttonText_ar: ar?.buttonText ?? "",
      linkUrl_ar: ar?.linkUrl ?? "",
      image: undefined,
    });
  }, [slider, reset]);

  const onSubmit = async (data: FormValues) => {
    const formData = new FormData();

    if (data.image && data.image[0]) {
      formData.append("image", data.image[0]);
    }
    formData.append("order", String(data.order));

    if (isEdit) {
      formData.append("isActive", String(data.isActive));
    }

    // EN translation (index 0)
    formData.append("translations[0].languageCode", "en");
    formData.append("translations[0].title", data.title_en);
    if (data.subtitle_en)    formData.append("translations[0].subtitle", data.subtitle_en);
    if (data.buttonText_en)  formData.append("translations[0].buttonText", data.buttonText_en);
    if (data.linkUrl_en)     formData.append("translations[0].linkUrl", data.linkUrl_en);

    // AR translation (index 1)
    formData.append("translations[1].languageCode", "ar");
    formData.append("translations[1].title", data.title_ar);
    if (data.subtitle_ar)    formData.append("translations[1].subtitle", data.subtitle_ar);
    if (data.buttonText_ar)  formData.append("translations[1].buttonText", data.buttonText_ar);
    if (data.linkUrl_ar)     formData.append("translations[1].linkUrl", data.linkUrl_ar);

    try {
      if (isEdit && slider?.id) {
        await sliderService.update(slider.id, formData);
        toast.success("Slider updated");
      } else {
        await sliderService.create(formData);
        toast.success("Slider created");
      }
      onClose?.(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Image */}
      <div className="space-y-1.5">
        <Label>Slider Image {!isEdit && <span className="text-red-500">*</span>}</Label>
        <Input
          type="file"
          accept="image/*"
          {...register("image", { required: !isEdit })}
        />
        {errors.image && <p className="text-xs text-red-500">Image is required</p>}
        {isEdit && slider?.imageUrl && (
          <img
            src={slider.imageUrl}
            alt="Current"
            className="mt-2 h-24 w-auto rounded object-cover border"
          />
        )}
      </div>

      {/* Order */}
      <div className="space-y-1.5">
        <Label>Order <span className="text-red-500">*</span></Label>
        <Input
          type="number"
          min={1}
          {...register("order", { required: true, valueAsNumber: true, min: 1 })}
          placeholder="1"
        />
        {errors.order && <p className="text-xs text-red-500">Order is required</p>}
      </div>

      {/* isActive (edit only) */}
      {isEdit && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="isActive"
            checked={isActive}
            onCheckedChange={(val) => setValue("isActive", Boolean(val))}
          />
          <Label htmlFor="isActive" className="cursor-pointer">Active (visible on storefront)</Label>
        </div>
      )}

      {/* Language Tabs */}
      <Tabs defaultValue="en">
        <TabsList className="w-full">
          <TabsTrigger value="en" className="flex-1">🇬🇧 English</TabsTrigger>
          <TabsTrigger value="ar" className="flex-1">🇸🇦 Arabic</TabsTrigger>
        </TabsList>

        {/* EN */}
        <TabsContent value="en" className="space-y-3 pt-3">
          <div className="space-y-1.5">
            <Label>Title <span className="text-red-500">*</span></Label>
            <Input {...register("title_en", { required: true })} placeholder="Discover Our Collection" />
            {errors.title_en && <p className="text-xs text-red-500">Required</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Subtitle</Label>
            <Input {...register("subtitle_en")} placeholder="Premium coffee from around the world" />
          </div>
          <div className="space-y-1.5">
            <Label>Button Text</Label>
            <Input {...register("buttonText_en")} placeholder="Shop Now" />
          </div>
          <div className="space-y-1.5">
            <Label>Target Link (Optional)</Label>
            <Input {...register("linkUrl_en")} placeholder="e.g. /products/coffee or https://..." />
          </div>
        </TabsContent>

        {/* AR */}
        <TabsContent value="ar" className="space-y-3 pt-3" dir="rtl">
          <div className="space-y-1.5">
            <Label>العنوان <span className="text-red-500">*</span></Label>
            <Input {...register("title_ar", { required: true })} placeholder="اكتشف مجموعتنا" />
            {errors.title_ar && <p className="text-xs text-red-500">مطلوب</p>}
          </div>
          <div className="space-y-1.5">
            <Label>العنوان الفرعي</Label>
            <Input {...register("subtitle_ar")} placeholder="قهوة مميزة من حول العالم" />
          </div>
          <div className="space-y-1.5">
            <Label>نص الزر</Label>
            <Input {...register("buttonText_ar")} placeholder="تسوق الآن" />
          </div>
          <div className="space-y-1.5">
            <Label>رابط الهدف (اختياري)</Label>
            <Input {...register("linkUrl_ar")} placeholder="e.g. /products/coffee or https://..." />
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Update Slider" : "Create Slider"}
        </Button>
        {onClose && (
          <Button type="button" variant="outline" onClick={() => onClose()}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
