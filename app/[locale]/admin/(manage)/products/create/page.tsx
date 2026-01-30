"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Loader2, ArrowLeft, Upload, X, Save, ImageIcon, DollarSign, Package } from "lucide-react";
import { getMasterData, createProductV2 } from "@/lib/services/products";
import type { FlavourNoteDto } from "@/lib/types/flavour-note";
import type { MasterData, ProductPricePayload } from "@/lib/types";
import toast from "react-hot-toast";

interface WeightPrice {
  weightId: string;
  enabled: boolean;
  price: string;
}

// Flavour note form state
type FlavourNoteForm = {
  name: string;
  displayOrder: number;
  translations: { languageCode: string; name: string }[];
};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [masterData, setMasterData] = useState<MasterData | null>(null);

  // Form state
  const [flavourNotes, setFlavourNotes] = useState<FlavourNoteForm[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stockInKg, setStockInKg] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [originId, setOriginId] = useState("");
  const [selectedRoasts, setSelectedRoasts] = useState<string[]>([]);
  const [selectedGrinds, setSelectedGrinds] = useState<string[]>([]);
  const [weightPrices, setWeightPrices] = useState<WeightPrice[]>([]);
  const [images, setImages] = useState<File[]>([]);

  // Fetch master data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getMasterData();
        setMasterData(data);

        // Initialize weight prices
        const initialWeightPrices = data.weights.map((w) => ({
          weightId: w.id,
          enabled: false,
          price: "",
        }));
        setWeightPrices(initialWeightPrices);
      } catch (error) {
        console.error("Failed to fetch master data:", error);
        toast.error("Failed to load form data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handle roast level checkbox
  const toggleRoast = (id: string) => {
    setSelectedRoasts((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  // Handle grind type checkbox
  const toggleGrind = (id: string) => {
    setSelectedGrinds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  // Handle weight price changes
  const updateWeightPrice = (
    weightId: string,
    field: "enabled" | "price",
    value: boolean | string
  ) => {
    setWeightPrices((prev) =>
      prev.map((wp) =>
        wp.weightId === weightId ? { ...wp, [field]: value } : wp
      )
    );
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files);
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (!stockInKg || parseFloat(stockInKg) <= 0) {
      toast.error("Stock in KG must be greater than 0");
      return;
    }
    if (selectedRoasts.length === 0) {
      toast.error("Please select at least one roast level");
      return;
    }
    if (selectedGrinds.length === 0) {
      toast.error("Please select at least one grind type");
      return;
    }

    // Build prices array
    const prices: ProductPricePayload[] = weightPrices
      .filter((wp) => wp.enabled && wp.price && parseFloat(wp.price) > 0)
      .map((wp) => ({
        productWeightId: wp.weightId,
        price: parseFloat(wp.price),
      }));

    if (prices.length === 0) {
      toast.error("Please enable at least one weight with a valid price");
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    // Append FlavourNotes (multi-language)
    flavourNotes.forEach((note, i) => {
      formData.append(`FlavourNotes[${i}].Name`, note.name);
      formData.append(`FlavourNotes[${i}].DisplayOrder`, note.displayOrder.toString());
      note.translations.forEach((tr, j) => {
        formData.append(`FlavourNotes[${i}].Translations[${j}].LanguageCode`, tr.languageCode);
        formData.append(`FlavourNotes[${i}].Translations[${j}].Name`, tr.name);
      });
    });

    // Build FormData (PascalCase keys to match backend DTOs)
            {/* Section F: Flavour Notes (Multi-language) */}
            <Card>
              <CardHeader>
                <CardTitle>Flavour Notes (Multi-language)</CardTitle>
                <CardDescription>Add flavour notes and their translations for this product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {flavourNotes.map((note, i) => (
                  <div key={i} className="border rounded-md p-4 space-y-2">
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Flavour Note Name (default)"
                        value={note.name}
                        onChange={e => {
                          const updated = [...flavourNotes];
                          updated[i].name = e.target.value;
                          setFlavourNotes(updated);
                        }}
                      />
                      <Input
                        type="number"
                        min={0}
                        placeholder="Order"
                        value={note.displayOrder}
                        onChange={e => {
                          const updated = [...flavourNotes];
                          updated[i].displayOrder = Number(e.target.value);
                          setFlavourNotes(updated);
                        }}
                        className="w-24"
                      />
                      <Button type="button" variant="destructive" onClick={() => {
                        setFlavourNotes(flavourNotes.filter((_, idx) => idx !== i));
                      }}>Remove</Button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {note.translations.map((tr, j) => (
                        <div key={j} className="flex gap-1 items-center border rounded px-2 py-1">
                          <Input
                            placeholder="Lang (e.g. en)"
                            value={tr.languageCode}
                            onChange={e => {
                              const updated = [...flavourNotes];
                              updated[i].translations[j].languageCode = e.target.value;
                              setFlavourNotes(updated);
                            }}
                            className="w-16"
                          />
                          <Input
                            placeholder="Translation"
                            value={tr.name}
                            onChange={e => {
                              const updated = [...flavourNotes];
                              updated[i].translations[j].name = e.target.value;
                              setFlavourNotes(updated);
                            }}
                          />
                          <Button type="button" size="sm" variant="outline" onClick={() => {
                            const updated = [...flavourNotes];
                            updated[i].translations.splice(j, 1);
                            setFlavourNotes(updated);
                          }}>Remove</Button>
                        </div>
                      ))}
                      <Button type="button" size="sm" onClick={() => {
                        const updated = [...flavourNotes];
                        updated[i].translations.push({ languageCode: '', name: '' });
                        setFlavourNotes(updated);
                      }}>Add Translation</Button>
                    </div>
                  </div>
                ))}
                <Button type="button" onClick={() => setFlavourNotes([...flavourNotes, { name: '', displayOrder: 0, translations: [] }])}>
                  Add Flavour Note
                </Button>
              </CardContent>
            </Card>
    const formData = new FormData();
    formData.append("Name", name);
    formData.append("Description", description);
    formData.append("StockInKg", stockInKg);
    formData.append("CategoryId", categoryId);
    if (originId) {
      formData.append("OriginId", originId);
    }

    // Append array items individually so backend model binding receives multiple values
    selectedRoasts.forEach((id) => {
      formData.append("RoastLevelIds", id);
    });

    selectedGrinds.forEach((id) => {
      formData.append("GrindTypeIds", id);
    });

    prices.forEach((p, index) => {
      formData.append(`Prices[${index}].ProductWeightId`, p.productWeightId);
      formData.append(`Prices[${index}].Price`, p.price.toString());
    });

    // Append images
    images.forEach((image, index) => {
      formData.append(`images`, image);
    });

    // Submit
    setSubmitting(true);
    try {
      await createProductV2(formData);
      toast.success("Product created successfully!");
      router.push("/admin/products");
    } catch (error: any) {
      console.error("Failed to create product:", error);
      toast.error(error?.response?.data?.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!masterData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load form data</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create New Product</h1>
        <p className="text-muted-foreground mt-2">
          Add a new coffee product to your inventory using Silo v2
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section A: Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Ethiopian Yirgacheffe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the coffee's flavor profile, origin story, and unique characteristics..."
                rows={5}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterData.categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="origin">Origin (Optional)</Label>
                <Select value={originId || undefined} onValueChange={(val) => setOriginId(val || "")}>
                  <SelectTrigger id="origin">
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterData.origins.map((origin) => (
                      <SelectItem key={origin.id} value={origin.id}>
                        {origin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section B: Inventory (The Silo) */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory - The Silo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="stockInKg">Central Stock (kg) *</Label>
              <Input
                id="stockInKg"
                type="number"
                step="0.01"
                min="0"
                value={stockInKg}
                onChange={(e) => setStockInKg(e.target.value)}
                placeholder="e.g., 100"
                required
              />
              <p className="text-sm text-muted-foreground">
                Total coffee beans available in kilograms
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section C: Attributes */}
        <Card>
          <CardHeader>
            <CardTitle>Product Attributes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Roast Levels */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Roast Levels *
              </Label>
              <p className="text-sm text-muted-foreground">
                Select all roast levels this product is available in
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {masterData.roastLevels.map((roast) => (
                  <div
                    key={roast.id}
                    className="flex items-center space-x-2 border rounded-md p-3 hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      id={`roast-${roast.id}`}
                      checked={selectedRoasts.includes(roast.id)}
                      onCheckedChange={() => toggleRoast(roast.id)}
                    />
                    <Label
                      htmlFor={`roast-${roast.id}`}
                      className="cursor-pointer flex-1"
                    >
                      {roast.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Grind Types */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Grind Options *
              </Label>
              <p className="text-sm text-muted-foreground">
                Select all grind types available for this product
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {masterData.grindTypes.map((grind) => (
                  <div
                    key={grind.id}
                    className="flex items-center space-x-2 border rounded-md p-3 hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      id={`grind-${grind.id}`}
                      checked={selectedGrinds.includes(grind.id)}
                      onCheckedChange={() => toggleGrind(grind.id)}
                    />
                    <Label
                      htmlFor={`grind-${grind.id}`}
                      className="cursor-pointer flex-1"
                    >
                      {grind.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section D: Pricing Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Enable the weights you want to sell and set their prices
            </p>
            <div className="space-y-3">
              {masterData.weights.map((weight) => {
                const weightPrice = weightPrices.find(
                  (wp) => wp.weightId === weight.id
                );
                return (
                  <div
                    key={weight.id}
                    className="flex items-center gap-4 p-3 border rounded-md hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      id={`weight-${weight.id}`}
                      checked={weightPrice?.enabled || false}
                      onCheckedChange={(checked) =>
                        updateWeightPrice(weight.id, "enabled", !!checked)
                      }
                    />
                    <Label
                      htmlFor={`weight-${weight.id}`}
                      className="cursor-pointer w-24 font-medium"
                    >
                      {weight.label}
                    </Label>
                    <div className="flex-1 max-w-xs">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        value={weightPrice?.price || ""}
                        onChange={(e) =>
                          updateWeightPrice(
                            weight.id,
                            "price",
                            e.target.value
                          )
                        }
                        disabled={!weightPrice?.enabled}
                        className="w-full"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-16">
                      ({weight.grams}g)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Section E: Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="images">Upload Images</Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                Upload product images (JPG, PNG, WebP)
              </p>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {image.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Product"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
