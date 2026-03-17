"use client"

import { type DragEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "@/i18n/routing"
import { useRouter } from "@/i18n/routing"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

import {
  type Category,
  type Origin,
  createProduct,
  deleteProduct,
  restoreProduct,
  getCategories,
  getOrigins,
  getProduct,
  getAdminProducts,
  updateProduct,
  getMasterData,
} from "@/lib/services/products"
import type { 
  MasterData, 
  ProductPricePayload, 
  Product,
  ProductPriceDto,
  CurrencyOptionDto 
} from "@/lib/types"
import { getErrorMessage } from "@/lib/utils"
import { API_URL } from "@/lib/config"
import {
  Filter,
  Eye,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Star,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react"
import toast from "react-hot-toast"

const PAGE_SIZE = 10

interface WeightPrice {
  weightId: string
  currencyCode: string
  enabled: boolean
  price: string
}

type SiloEditFormState = {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  stockInKg: string;
  categoryId: string;
  originId: string;
  selectedRoasts: string[];
  selectedGrinds: string[];
  weightPrices: WeightPrice[];
  flavourNotes: { nameEn: string; nameAr: string }[];
}

const emptySiloForm: SiloEditFormState = {
  nameEn: "",
  nameAr: "",
  descriptionEn: "",
  descriptionAr: "",
  stockInKg: "",
  categoryId: "",
  originId: "",
  selectedRoasts: [],
  selectedGrinds: [],
  weightPrices: [],
  flavourNotes: [],
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

// Helper: Image URL Correction
const getImageUrl = (path: string | undefined) => {
  if (!path) return null
  if (path.startsWith("http")) return path
  const baseUrl = API_URL
  const rootUrl = baseUrl.replace("/api/v1", "")
  return `${rootUrl}/${path}`
}

export default function AdminProductsPage() {
  const router = useRouter();
  
  // --- Master Data ---
  const [masterData, setMasterData] = useState<MasterData | null>(null)
  const [masterDataLoading, setMasterDataLoading] = useState(false)
  
  // --- States ---
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [origins, setOrigins] = useState<Origin[]>([])
  
  // Pagination & Filter
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPrevPage, setHasPrevPage] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  
  // UI Actions
  const [loading, setLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  
  // Form Data (Silo v2)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [siloFormState, setSiloFormState] = useState<SiloEditFormState>(emptySiloForm)
  
  // Image Handling
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]) 
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [mainImageIndex, setMainImageIndex] = useState<number>(0)
  const [existingImages, setExistingImages] = useState<{id?: string, url: string, isMain: boolean}[]>([])
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])
  const [mainImageId, setMainImageId] = useState<string | null>(null)
  
  const [saving, setSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // --- Effects ---
  useEffect(() => {
    const t = setTimeout(() => {
        setPageNumber(1);
        setDebouncedSearch(searchTerm.trim())
    }, 400)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => toast.error(getErrorMessage(err)))
  }, [])

  useEffect(() => {
    getOrigins()
      .then(setOrigins)
      .catch((err) => toast.error(getErrorMessage(err)))
  }, [])

  useEffect(() => {
    loadProducts(pageNumber)
  }, [pageNumber, debouncedSearch, categoryFilter])

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [previewUrls])

  // --- Functions ---

  const resetSiloForm = () => {
    setSiloFormState(emptySiloForm)
    setSelectedFiles([])
    setPreviewUrls([])
    setExistingImages([])
    setMainImageIndex(0)
    setDeletedImageIds([])
    setMainImageId(null)
  }

  // Fetch master data for edit form
  const fetchMasterDataForEdit = async (): Promise<MasterData | null> => {
    if (masterData) return masterData
    setMasterDataLoading(true)
    try {
      const data = await getMasterData()
      setMasterData(data)
      return data
    } catch (error) {
      toast.error("Failed to load form options")
      return null
    } finally {
      setMasterDataLoading(false)
    }
  }

  const loadProducts = async (specificPage?: number) => {
    setLoading(true)
    const pageToFetch = specificPage ?? pageNumber
    try {
      const res = await getAdminProducts({
        pageNumber: pageToFetch,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        categoryId: categoryFilter || undefined,
      })
      setProducts(res.items)
      setTotalPages(res.totalPages)
      setTotalCount(res.totalCount)
      setHasNextPage(res.hasNextPage)
      setHasPrevPage(res.hasPreviousPage)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    router.push('/admin/products/create');
  }

  // View product details in modal
  const handleViewProduct = (product: Product) => {
    setViewingProduct(product)
    setViewDialogOpen(true)
  }

const handleOpenEdit = async (productId: string) => {
  setLoadingProduct(true);
  const currentMasterData = await fetchMasterDataForEdit();
  setSheetOpen(true);

  try {
    const product = await getProduct(productId, { admin: true });
    const p = product as any; // Yeni DTO (translations, activePrice və s. gəlir)
    setSelectedProduct(product);

    // --- Tərcümələr ---
    const getTrans = (lang: string) =>
      p.translations?.find(
        (t: any) => (t.languageCode || t.LanguageCode) === lang
      );

    const enTrans = getTrans("en");
    const arTrans = getTrans("ar");

    // --- Qiymət Matrisini Birləşdiririk ---
    const allPrices = [
      p.activePrice,
      ...(p.otherAvailableCurrencies || []),
      ...(p.availablePrices || []),
    ].filter(Boolean);
    const weightPrices: WeightPrice[] = [];

    if (currentMasterData) {
      currentMasterData.weights.forEach((weight) => {
        ["USD", "AED"].forEach((curr) => {
          const existing = allPrices.find(
            (price) => price.grams === weight.grams && price.currencyCode === curr
          );

          weightPrices.push({
            weightId: weight.id,
            currencyCode: curr,
            enabled: !!existing,
            price: existing ? existing.price.toString() : "",
          });
        });
      });
    }

    // --- Form State ---
    setSiloFormState({
      nameEn: enTrans?.name || p.name || "",
      nameAr: arTrans?.name || "",
      descriptionEn: enTrans?.description || p.description || "",
      descriptionAr: arTrans?.description || "",
      stockInKg: String(p.stockInKg || "0"),
      categoryId: p.categoryId || "",
      originId: p.originId || "",
      selectedRoasts: p.roastLevelIds || [],
      selectedGrinds: p.grindTypeIds || [],
      weightPrices,
      flavourNotes:
        p.flavourNotes?.map((fn: any) => ({
          nameEn:
            fn.translations?.find(
              (t: any) => (t.languageCode || t.LanguageCode) === "en"
            )?.name || fn.name || "",
          nameAr:
            fn.translations?.find(
              (t: any) => (t.languageCode || t.LanguageCode) === "ar"
            )?.name || "",
        })) || [],
    });

    // --- Şəkil hissəsi (birinci koddan) ---
    const fixedImages =
      p.images
        ?.map((i: any) => ({
          id: i.id,
          url: getImageUrl(i.imageUrl)!,
          isMain: i.isMain,
        }))
        .filter((img: any) => img.url) ?? [];

    const mainImg = fixedImages.find((img: any) => img.isMain);

    setExistingImages(fixedImages);
    setMainImageId(mainImg?.id || null);
    setDeletedImageIds([]);
    setPreviewUrls([]);
    setSelectedFiles([]);
    setMainImageIndex(0);

  } catch (err) {
    toast.error(getErrorMessage(err));
    setSheetOpen(false);
  } finally {
    setLoadingProduct(false);
  }
};


  // --- Image Logic ---
  const handleFileSelect = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image"))
    setSelectedFiles((prev) => [...prev, ...imageFiles])
    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file))
    setPreviewUrls((prev) => [...prev, ...newPreviews])
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.dataTransfer.files?.length) {
      handleFileSelect(Array.from(event.dataTransfer.files))
    }
  }

  const removeSelectedFile = (index: number) => {
      const newFiles = [...selectedFiles];
      const newPreviews = [...previewUrls];
      URL.revokeObjectURL(newPreviews[index]);
      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);
      setSelectedFiles(newFiles);
      setPreviewUrls(newPreviews);
      if (index === mainImageIndex) setMainImageIndex(0);
      else if (index < mainImageIndex) setMainImageIndex(prev => prev - 1);
  }

  const handleDeleteExistingImage = (imageId?: string, isMain?: boolean) => {
    if (isMain) {
      toast.error("Cannot delete the main image. Set another image as main first.")
      return
    }
    if (!imageId) return
    setDeletedImageIds(prev => [...prev, imageId])
    setExistingImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleSetMainImage = (imageId?: string) => {
    if (!imageId) return
    setMainImageId(imageId)
    setExistingImages(prev => prev.map(img => ({
      ...img,
      isMain: img.id === imageId
    })))
  }

  // Toggle roast level selection
  const toggleRoast = (id: string) => {
    setSiloFormState((prev) => ({
      ...prev,
      selectedRoasts: prev.selectedRoasts.includes(id)
        ? prev.selectedRoasts.filter((r) => r !== id)
        : [...prev.selectedRoasts, id],
    }))
  }

  // Toggle grind type selection
  const toggleGrind = (id: string) => {
    setSiloFormState((prev) => ({
      ...prev,
      selectedGrinds: prev.selectedGrinds.includes(id)
        ? prev.selectedGrinds.filter((g) => g !== id)
        : [...prev.selectedGrinds, id],
    }))
  }

  // Update weight price
  const updateWeightPrice = (
    weightId: string,
    currencyCode: string,
    field: "enabled" | "price",
    value: boolean | string
  ) => {
    setSiloFormState((prev) => ({
      ...prev,
      weightPrices: prev.weightPrices.map((wp) =>
        wp.weightId === weightId && wp.currencyCode === currencyCode
          ? { ...wp, [field]: value }
          : wp
      ),
    }))
  }

  // --- Submit Logic (Silo v2) ---
  const handleSiloSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Validation
      if (!siloFormState.nameEn.trim()) {
        toast.error("Product name (EN) is required");
        return;
      }
      if (!siloFormState.descriptionEn.trim()) {
        toast.error("Description (EN) is required");
        return;
      }
      if (!siloFormState.categoryId) {
        toast.error("Please select a category");
        return;
      }
      if (!siloFormState.stockInKg || parseFloat(siloFormState.stockInKg) <= 0) {
        toast.error("Stock in KG must be greater than 0");
        return;
      }
      if (siloFormState.selectedRoasts.length === 0) {
        toast.error("Please select at least one roast level");
        return;
      }
      if (siloFormState.selectedGrinds.length === 0) {
        toast.error("Please select at least one grind type");
        return;
      }

      // Build prices array (multi-currency)
      const prices = siloFormState.weightPrices
        .filter((wp) => wp.enabled && wp.price && parseFloat(wp.price) > 0)
        .map((wp) => ({
          productWeightId: wp.weightId,
          price: parseFloat(wp.price),
          currencyCode: wp.currencyCode,
        }));

      if (prices.length === 0) {
        toast.error("Please enable at least one weight/currency with a valid price");
        return;
      }

      if (selectedFiles.length === 0 && existingImages.length === 0) {
        toast.error("Please upload at least one image");
        return;
      }

      // Build FormData (PascalCase keys for backend)
      const formData = new FormData();
      // Translations array
      formData.append("Translations[0].LanguageCode", "en");
      formData.append("Translations[0].Name", siloFormState.nameEn);
      formData.append("Translations[0].Description", siloFormState.descriptionEn);
      formData.append("Translations[1].LanguageCode", "ar");
      formData.append("Translations[1].Name", siloFormState.nameAr);
      formData.append("Translations[1].Description", siloFormState.descriptionAr);
      // Fallback fields
      formData.append("Name", siloFormState.nameEn);
      formData.append("Description", siloFormState.descriptionEn);
      formData.append("StockInKg", siloFormState.stockInKg);
      formData.append("CategoryId", siloFormState.categoryId);
      if (siloFormState.originId) {
        formData.append("OriginId", siloFormState.originId);
      }

      // Append roast level IDs
      siloFormState.selectedRoasts.forEach((id) => {
        formData.append("RoastLevelIds", id);
      });

      // Append grind type IDs
      siloFormState.selectedGrinds.forEach((id) => {
        formData.append("GrindTypeIds", id);
      });

      // Append prices (multi-currency)
      prices.forEach((p, index) => {
        formData.append(`Prices[${index}].ProductWeightId`, p.productWeightId);
        formData.append(`Prices[${index}].Price`, p.price.toString());
        formData.append(`Prices[${index}].CurrencyCode`, p.currencyCode);
      });

      // Append Flavour Notes (Dad notlarını bazaya göndərmək üçün)
      siloFormState.flavourNotes.forEach((note, index) => {
        const enName = note.nameEn?.trim();
        const arName = note.nameAr?.trim();

        if (enName) {
          formData.append(`FlavourNotes[${index}].Name`, enName);
          formData.append(`FlavourNotes[${index}].DisplayOrder`, (index + 1).toString());
          formData.append(`FlavourNotes[${index}].Translations[0].LanguageCode`, "en");
          formData.append(`FlavourNotes[${index}].Translations[0].Name`, enName);
          formData.append(`FlavourNotes[${index}].Translations[1].LanguageCode`, "ar");
          formData.append(`FlavourNotes[${index}].Translations[1].Name`, arName || enName);
        }
      });

      // Handle image management for edit mode
      if (selectedProduct) {
        deletedImageIds.forEach((id) => {
          formData.append("deletedImageIds", id);
        });
        if (mainImageId) {
          formData.append("setMainImageId", mainImageId);
        }
      }

      // Append new images
      if (selectedFiles.length > 0) {
        const filesToSend = [...selectedFiles];
        const mainFile = filesToSend[mainImageIndex];
        const otherFiles = filesToSend.filter((_, idx) => idx !== mainImageIndex);
        const sortedFiles = [mainFile, ...otherFiles];
        sortedFiles.forEach((file) => {
          formData.append("images", file);
        });
      }

      setSaving(true);
      try {
        if (selectedProduct) {
          await updateProduct(selectedProduct.id, formData);
          toast.success("Product updated successfully!");
        } else {
          await createProduct(formData);
          toast.success("Product created successfully!");
        }
        setSheetOpen(false);
        resetSiloForm();
        setSelectedProduct(null);
        loadProducts();
      } catch (err: any) {
        if (err.response?.data?.errors) {
          const errors = err.response.data.errors;
          const errorMessages: string[] = [];
          Object.keys(errors).forEach((field) => {
            const fieldErrors = errors[field];
            if (Array.isArray(fieldErrors)) {
              errorMessages.push(...fieldErrors);
            } else if (typeof fieldErrors === 'string') {
              errorMessages.push(fieldErrors);
            }
          });
          if (errorMessages.length > 0) {
            errorMessages.forEach((msg) => toast.error(msg));
          } else {
            toast.error(getErrorMessage(err));
          }
        } else {
          toast.error(getErrorMessage(err));
        }
      } finally {
        setSaving(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Logic
  const confirmDelete = (id: string) => {
    setProductToDelete(id)
    setDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (!productToDelete) return
    try {
      await deleteProduct(productToDelete)
      toast.success("Product deleted")
      // Reset pagination if needed
      if (products.length === 1 && pageNumber > 1) {
          setPageNumber(prev => prev - 1)
      } else {
          loadProducts()
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
        setDeleteDialogOpen(false)
        setProductToDelete(null)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await restoreProduct(id)
      toast.success("Product restored successfully")
      loadProducts()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  // Render Helper
  const displayedProducts = useMemo(() => products, [products])

  const getRoastBadgeColor = (level?: number) => {
    switch (level) {
      case 1: return "bg-yellow-500/20 text-yellow-700 border-yellow-500/50"
      case 2: return "bg-orange-500/20 text-orange-700 border-orange-500/50"
      case 3: return "bg-amber-700/20 text-amber-600 border-amber-700/50"
      case 4: return "bg-amber-900/20 text-amber-100 border-amber-900/50"
      default: return "bg-gray-500/20 text-gray-700 border-gray-500/50"
    }
  }

  const getRoastLabel = (level?: number) => {
    switch (level) {
      case 1: return "Light"
      case 2: return "Medium"
      case 3: return "Medium-Dark"
      case 4: return "Dark"
      default: return "—"
    }
  }

  const renderImage = (product: Product) => {
    const mainImageObj = product.images?.find((i) => i.isMain) || product.images?.[0];
    const rawUrl = mainImageObj?.imageUrl;
    const fixedUrl = getImageUrl(rawUrl);
    const extraImagesCount = (product.images?.length || 0) - 1;

    return fixedUrl ? (
      <div className="relative h-14 w-14 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fixedUrl}
          alt={product.name}
          className="h-full w-full rounded-lg object-cover border border-border/60 transition-transform group-hover:scale-105"
        />
        {extraImagesCount > 0 && (
            <div className="absolute -bottom-1 -right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm border border-white/20">
                +{extraImagesCount}
            </div>
        )}
      </div>
    ) : (
      <div
        className="h-14 w-14 rounded-lg border border-border/50 flex items-center justify-center text-xl text-muted-foreground/50"
      >
        <ImageIcon size={20} />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-accent/80 font-semibold">Dashboard</p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-secondary">Coffee</h1>
          <p className="text-muted-foreground mt-1">Manage catalog, discounts, and inventory.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="glass hover:glow-accent"
            onClick={() => loadProducts()}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Layers />}
            <span className="hidden sm:inline ml-2">Refresh</span>
          </Button>
          <Button
            className="bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl"
            onClick={handleOpenCreate}
          >
            <Plus className="size-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-dark dark:glass rounded-2xl border border-border/60 p-5 md:p-6 shadow-lg">
        <div className="grid gap-4 sm:grid-cols-[1fr,220px] lg:grid-cols-[1fr,240px,200px] items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="pl-10 bg-white/60 dark:bg-white/5 border-border/60"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-muted-foreground" size={18} />
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val === "all" ? "" : val)
                setPageNumber(1)
              }}
            >
              <SelectTrigger className="w-full bg-white/60 dark:bg-white/5 border-border/60">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden lg:flex justify-end text-sm text-muted-foreground">
             <span>
                {totalCount} items • Page {pageNumber} of {totalPages}
             </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-xl min-h-125 relative">
        {loading && (
             <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                 <Loader2 className="size-8 animate-spin text-accent" />
             </div>
        )}
        
        {displayedProducts.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-100 text-muted-foreground">
            <Layers className="size-12 mb-4 opacity-20" />
            <p>No coffee found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-border/60">
                <TableHead className="py-4 px-6">Coffee</TableHead>
                <TableHead className="py-4 px-4">Category</TableHead>
                <TableHead className="py-4 px-4">Origin</TableHead>
                <TableHead className="py-4 px-4">Attributes</TableHead>
                <TableHead className="py-4 px-4">Price</TableHead>
                <TableHead className="py-4 px-4">Stock</TableHead>
                <TableHead className="text-right py-4 px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedProducts.map((product) => (
                <TableRow key={product.id} className={`hover:bg-white/5 transition-colors group ${!product.isActive ? 'opacity-50 bg-red-500/5' : ''}`}>
                  <TableCell className="cursor-pointer py-4 px-6" onClick={() => handleViewProduct(product)}>
                    <div className="flex items-center gap-3">
                      {renderImage(product)}
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground leading-tight group-hover:text-accent transition-colors flex items-center gap-2">
                            {product.name}
                            {!product.isActive && (
                              <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Deleted</Badge>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-50">
                            {product.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <Badge variant="outline" className="bg-white/10 border-border/60">
                      {product.categoryName || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <span className="text-sm">
                      {product.originName || "—"}
                    </span>
                  </TableCell>
                  {/* Attributes Column: Show roast levels and grind types */}
                  <TableCell className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {product.roastLevelNames?.length
                        ? product.roastLevelNames.map((name, idx) => (
                            <Badge key={`roast-${idx}`} variant="secondary" className="text-xs">
                              {name}
                            </Badge>
                          ))
                        : null}
                      {product.grindTypeNames?.length
                        ? product.grindTypeNames.map((name, idx) => (
                            <Badge key={`grind-${idx}`} variant="outline" className="text-xs bg-white/5">
                              {name}
                            </Badge>
                          ))
                        : null}
                      {!product.roastLevelNames?.length && !product.grindTypeNames?.length && (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  {/* Prices Column: Show all available prices (camelCase only, robust) */}
                  <TableCell className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      {[
                        product.activePrice,
                        ...(product.otherAvailableCurrencies || [])
                      ]
                        .filter(Boolean)
                        .map((price: any, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-mono py-0 px-1">
                              {price.weightLabel}
                            </Badge>
                            <span className={`text-sm font-semibold ${price.currencyCode === 'USD' ? 'text-green-600' : 'text-blue-600'}`}>
                              {price.currencyCode === 'USD' ? '$' : 'AED'} {price.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      {!product.activePrice && (!product.otherAvailableCurrencies || product.otherAvailableCurrencies.length === 0) && (
                        <span className="text-muted-foreground text-xs italic">No prices set</span>
                      )}
                    </div>
                  </TableCell>
                  {/* Stock Column: Display stock in kg */}
                  <TableCell className="py-4 px-4">
                    <Badge className={product.stockInKg === 0 ? "bg-destructive/20 text-destructive" : "bg-green-500/20 text-green-600"}>
                      {product.stockInKg || 0} kg
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-accent/10 hover:text-accent"
                        onClick={() => handleViewProduct(product)}
                        title="View Details"
                      >
                        <Eye className="size-4" />
                      </Button>
                      {product.isActive ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(product.id)}
                            className="hover:bg-accent/10 hover:text-accent"
                            title="Edit Coffee"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(product.id)}
                            className="hover:bg-destructive/10 text-destructive"
                            title="Delete Product"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestore(product.id)}
                          className="hover:bg-green-500/10 text-green-500"
                          title="Restore Product"
                        >
                          <RotateCcw className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Fix */}
      <div className="flex items-center justify-between py-6 px-2">
        <div className="text-sm text-muted-foreground font-medium">
          Page {pageNumber} of {totalPages}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPageNumber((prev) => Math.max(1, prev - 1))
            }}
            disabled={pageNumber <= 1 || loading}
            className="glass"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPageNumber((prev) => prev + 1)
            }}
            disabled={pageNumber >= totalPages || !hasNextPage || loading}
            className="glass"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Create/Edit Sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) {
            setSelectedProduct(null)
            resetSiloForm()
          }
        }}
      >
        <SheetContent
          side="right"
          className="glass-dark dark:glass border-border/60 backdrop-blur-xl shadow-2xl w-full sm:max-w-xl overflow-y-auto p-6 md:p-8"
        >
          <SheetHeader className="mb-10 pb-6 border-b border-border/30">
            <SheetTitle className="text-3xl">{selectedProduct ? "Edit Coffee" : "New Coffee"}</SheetTitle>
            <p className="text-sm text-muted-foreground mt-3">
              {selectedProduct
                ? "Update details, discounts, or visuals."
                : "Add a new item to your catalog."}
            </p>
          </SheetHeader>

          <form onSubmit={handleSiloSubmit} className="space-y-10">
            {masterDataLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-accent" />
              </div>
            )}
            {/* Basic Info Section */}
            <div className="space-y-5">
              <div className="text-xs font-bold uppercase tracking-wider text-accent/70 pb-2 border-b border-border/20">Basic Info</div>
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-accent">Product Name (EN)</label>
                  <Input 
                    value={siloFormState.nameEn} 
                    onChange={(e) => setSiloFormState({...siloFormState, nameEn: e.target.value})} 
                  />
                </div>
                <div className="space-y-2" dir="rtl">
                  <label className="text-xs font-bold text-accent">اسم المنتج (AR)</label>
                  <Input 
                    className="text-right font-arabic" 
                    value={siloFormState.nameAr} 
                    onChange={(e) => setSiloFormState({...siloFormState, nameAr: e.target.value})} 
                  />
                </div>
              </div>
              {/* Description Fields */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-accent">Description (EN)</label>
                  <Textarea 
                    value={siloFormState.descriptionEn} 
                    onChange={(e) => setSiloFormState({...siloFormState, descriptionEn: e.target.value})} 
                  />
                </div>
                <div className="space-y-2" dir="rtl">
                  <label className="text-xs font-bold text-accent">الوصف (AR)</label>
                  <Textarea 
                    className="text-right font-arabic" 
                    value={siloFormState.descriptionAr} 
                    onChange={(e) => setSiloFormState({...siloFormState, descriptionAr: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select
                  value={siloFormState.categoryId}
                  onValueChange={(val) => setSiloFormState((prev) => ({ ...prev, categoryId: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Origin Section */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent/70">Origin</div>
              <Select
                value={siloFormState.originId}
                onValueChange={(val) => setSiloFormState((prev) => ({ ...prev, originId: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select origin..." />
                </SelectTrigger>
                <SelectContent>
                  {origins.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stock Section */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent/70">Inventory</div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock in KG *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={siloFormState.stockInKg}
                  onChange={(e) => setSiloFormState((prev) => ({ ...prev, stockInKg: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Roast Levels Section */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent/70">Roast Levels *</div>
              <div className="space-y-2 bg-white/5 p-4 rounded-lg border border-border/30">
                {masterData?.roastLevels.map((roast) => (
                  <div key={roast.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`roast-${roast.id}`}
                      checked={siloFormState.selectedRoasts.includes(roast.id)}
                      onCheckedChange={() => toggleRoast(roast.id)}
                    />
                    <label htmlFor={`roast-${roast.id}`} className="text-sm cursor-pointer">
                      {roast.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Grind Types Section */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent/70">Grind Types *</div>
              <div className="space-y-2 bg-white/5 p-4 rounded-lg border border-border/30">
                {masterData?.grindTypes.map((grind) => (
                  <div key={grind.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`grind-${grind.id}`}
                      checked={siloFormState.selectedGrinds.includes(grind.id)}
                      onCheckedChange={() => toggleGrind(grind.id)}
                    />
                    <label htmlFor={`grind-${grind.id}`} className="text-sm cursor-pointer">
                      {grind.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Flavour Notes Section */}
            <div className="space-y-4 pt-6 border-t border-border/20">
              <div className="text-xs font-bold uppercase tracking-wider text-accent/70">Flavour Notes (EN / AR)</div>
              <div className="space-y-3">
                {siloFormState.flavourNotes.map((note, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-white/5 p-3 rounded-lg border border-border/10">
                    <div className="flex-1 space-y-2">
                      <Input 
                        placeholder="EN: e.g. Chocolate" 
                        value={note.nameEn} 
                        onChange={(e) => {
                          const newNotes = [...siloFormState.flavourNotes];
                          newNotes[idx].nameEn = e.target.value;
                          setSiloFormState(prev => ({ ...prev, flavourNotes: newNotes }));
                        }}
                      />
                      <Input 
                        dir="rtl"
                        placeholder="AR: شوكولاتة" 
                        className="text-right font-arabic"
                        value={note.nameAr} 
                        onChange={(e) => {
                          const newNotes = [...siloFormState.flavourNotes];
                          newNotes[idx].nameAr = e.target.value;
                          setSiloFormState(prev => ({ ...prev, flavourNotes: newNotes }));
                        }}
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setSiloFormState(prev => ({ ...prev, flavourNotes: prev.flavourNotes.filter((_, i) => i !== idx) }))}
                    >
                      <X size={14} className="text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-dashed"
                  onClick={() => setSiloFormState(prev => ({ ...prev, flavourNotes: [...prev.flavourNotes, { nameEn: "", nameAr: "" }] }))}
                >
                  <Plus size={14} className="mr-2" /> Add Flavour Note
                </Button>
              </div>
            </div>
              
            {/* Pricing Matrix Section */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent/70">Pricing Matrix *</div>
              <div className="space-y-3 bg-accent/5 p-4 rounded-lg border border-accent/20">
                {masterData?.weights.map((weight) => (
                  <div key={weight.id} className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                      {weight.label} ({weight.grams}g)
                    </div>
                    {['USD', 'AED'].map((curr) => {
                      const wp = siloFormState.weightPrices.find(
                        p => p.weightId === weight.id && p.currencyCode === curr
                      );
                      if (!wp) return null;
                      
                      return (
                        <div key={`${weight.id}-${curr}`} className="flex items-end gap-3">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              {curr}
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={wp.price}
                              onChange={(e) => updateWeightPrice(weight.id, curr, "price", e.target.value)}
                              placeholder="0.00"
                              disabled={!wp.enabled}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`price-${weight.id}-${curr}`}
                              checked={wp.enabled}
                              onCheckedChange={(checked) => updateWeightPrice(weight.id, curr, "enabled", !!checked)}
                            />
                            <label htmlFor={`price-${weight.id}-${curr}`} className="text-sm cursor-pointer">
                              Enable
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Media Section */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent/70">Media</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Click image to set as MAIN
                  </span>
                </div>
                
                <div
                  className="border-2 border-dashed border-border/70 rounded-xl p-6 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
                  />
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="p-3 bg-accent/10 rounded-full text-accent">
                        <ImageIcon className="size-6" />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
                    </div>
                  </div>
                </div>

                {/* Previews Grid */}
                {(previewUrls.length > 0 || existingImages.length > 0) && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    
                    {/* Existing Images (Smart Edit) */}
                    {existingImages.map((img, idx) => (
                      <div 
                        key={`exist-${idx}`} 
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all group ${
                            img.isMain ? 'border-accent ring-2 ring-accent/30' : 'border-border/50 hover:border-accent/50'
                        }`}
                        onClick={() => handleSetMainImage(img.id)}
                      >
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="existing" className="w-full h-full object-cover" />
                        
                        {/* Delete Button */}
                        <button 
                            type="button"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDeleteExistingImage(img.id, img.isMain); 
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                         >
                             <Trash2 size={12} />
                         </button>

                        {/* Main Badge */}
                        {img.isMain && (
                            <div className="absolute bottom-1 left-1 bg-accent text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Star size={8} fill="currentColor" /> Main
                            </div>
                        )}
                      </div>
                    ))}

                    {/* New Uploads */}
                    {previewUrls.map((url, idx) => (
                      <div 
                        key={`new-${idx}`} 
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all group ${
                            idx === mainImageIndex ? 'border-accent ring-2 ring-accent/30' : 'border-transparent hover:border-white/30'
                        }`}
                        onClick={() => setMainImageIndex(idx)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="preview" className="w-full h-full object-cover" />
                         
                         {/* Remove Button */}
                         <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeSelectedFile(idx); }}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                         >
                             <X size={12} />
                         </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <SheetFooter>
              <SheetClose asChild>
                <Button variant="ghost" type="button">Cancel</Button>
              </SheetClose>
              <Button type="submit" disabled={saving || loadingProduct || isSubmitting} className="bg-linear-to-r from-amber-500 to-orange-600 text-white min-w-30">
                {(saving || isSubmitting) ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : selectedProduct ? (
                  "Update Product"
                ) : (
                  "Create Product"
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Custom Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-dark dark:glass border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={executeDelete} 
                className="bg-destructive text-white hover:bg-destructive/90"
            >
                Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Product Details Modal */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="glass-dark dark:glass border-border/60 backdrop-blur-sm max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{viewingProduct?.name}</DialogTitle>
          </DialogHeader>
          
          {viewingProduct && (
            <div className="space-y-6 py-4">
              {/* Image Gallery */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-accent/80 uppercase tracking-wider">Images</h3>
                <div className="grid grid-cols-4 gap-2">
                  {viewingProduct.images && viewingProduct.images.length > 0 ? (
                    viewingProduct.images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                          img.isMain ? "border-accent ring-2 ring-accent/30" : "border-border/50"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getImageUrl(img.imageUrl) || ""}
                          alt={`${viewingProduct.name} ${idx}`}
                          className="w-full h-full object-cover"
                        />
                        {img.isMain && (
                          <div className="absolute bottom-1 left-1 bg-accent text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star size={8} fill="currentColor" /> Main
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-4 aspect-square rounded-lg bg-white/5 border border-border/30 flex items-center justify-center text-muted-foreground">
                      No images
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-accent/80 uppercase tracking-wider">Description</h3>
                <p className="text-sm leading-relaxed text-foreground">{viewingProduct.description}</p>
              </div>

              {/* Pricing Table */}
              {viewingProduct.availablePrices && viewingProduct.availablePrices.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-accent/80 uppercase tracking-wider">Pricing</h3>
                   <div className="glass rounded-lg p-3 border border-border/30 space-y-1">
                     {viewingProduct.availablePrices.map((p) => (
                       <div key={p.productPriceId || p.grams} className="flex justify-between text-sm">
                         <span className="text-muted-foreground">{(p.weightLabel || "").trim() || `${p.grams}g`}:</span>
                         <span className="font-semibold text-accent">{currency.format(p.price)}</span>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {/* Attributes */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-accent/80 uppercase tracking-wider">Attributes</h3>
                <div className="flex flex-wrap gap-2">
                   {viewingProduct.roastLevelNames?.length
                     ? viewingProduct.roastLevelNames.map((name, idx) => (
                         <Badge key={`roast-${idx}`} variant="secondary">{name}</Badge>
                       ))
                     : null}
                   {viewingProduct.grindTypeNames?.length
                     ? viewingProduct.grindTypeNames.map((name, idx) => (
                         <Badge key={`grind-${idx}`} variant="outline" className="bg-white/5">{name}</Badge>
                       ))
                     : null}
                  {!viewingProduct.roastLevelNames?.length && !viewingProduct.grindTypeNames?.length && (
                    <Badge variant="outline" className="bg-white/5">No attributes</Badge>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-accent/80 uppercase tracking-wider">Metadata</h3>
                <div className="glass rounded-lg p-3 border border-border/30 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{viewingProduct.categoryName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Origin:</span>
                    <span className="font-medium">{viewingProduct.originName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock:</span>
                     <span className="font-medium">{viewingProduct.stockInKg || 0} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{viewingProduct.id?.substring(0, 8) || "—"}...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
