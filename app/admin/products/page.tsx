"use client"

import { type DragEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  type Category,
  type Product,
  type Origin,
  createProduct,
  deleteProduct,
  getCategories,
  getOrigins,
  getProduct,
  getProducts,
  updateProduct,
} from "@/lib/services/products"
import { getErrorMessage } from "@/lib/utils"
import { API_URL } from "@/lib/config"
import {
  Filter,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Star,
  Layers,
  X
} from "lucide-react"
import toast from "react-hot-toast"

const PAGE_SIZE = 10

type ProductFormState = {
  name: string
  description: string
  basePrice: string
  discountPercent: string
  stockQuantity: string
  categoryId: string
  originId: string
  roastLevel: string
  weight: string
  flavorNotes: string
}

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  basePrice: "",
  discountPercent: "0",
  stockQuantity: "",
  categoryId: "",
  originId: "",
  roastLevel: "",
  weight: "",
  flavorNotes: "",
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

// Helper: Image URL Correction
const getImageUrl = (path: string | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const baseUrl = API_URL || "http://localhost:7190/api/v1"; 
  const rootUrl = baseUrl.replace("/api/v1", ""); 
  return `${rootUrl}/${path}`;
}

export default function AdminProductsPage() {
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  
  // Form Data
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [formState, setFormState] = useState<ProductFormState>(emptyForm)
  
  // Image Handling
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]) 
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [mainImageIndex, setMainImageIndex] = useState<number>(0)
  const [existingImages, setExistingImages] = useState<{url: string, isMain: boolean}[]>([])
  
  const [saving, setSaving] = useState(false)
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
    loadProducts()
  }, [pageNumber, debouncedSearch, categoryFilter])

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [previewUrls])

  // --- Functions ---

  const resetForm = () => {
    setFormState(emptyForm)
    setSelectedFiles([])
    setPreviewUrls([])
    setExistingImages([])
    setMainImageIndex(0)
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await getProducts({
        pageNumber,
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
    resetForm()
    setSelectedProduct(null)
    setSheetOpen(true)
  }

  const handleOpenEdit = async (productId: string) => {
    setSheetOpen(true)
    setLoadingProduct(true)
    try {
      const product = await getProduct(productId, { admin: true })
      setSelectedProduct(product)

      setFormState({
        name: product.name || "",
        description: product.description || "",
        basePrice: String(product.price),
        discountPercent: String(product.discountPercentage || 0),
        stockQuantity: String(product.stockQuantity ?? ""),
        categoryId: product.categoryId || "",
        originId: product.originId || "",
        roastLevel: String(product.roastLevel || ""),
        weight: String(product.weight || ""),
        flavorNotes: product.flavorNotes || "",
      })
      
      const fixedImages = product.images?.map((i) => ({
          url: getImageUrl(i.imageUrl)!,
          isMain: i.isMain
      })).filter(img => img.url) ?? []
      
      setExistingImages(fixedImages)
      setPreviewUrls([])
      setSelectedFiles([])
      setMainImageIndex(0)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setSheetOpen(false)
    } finally {
      setLoadingProduct(false)
    }
  }

  // --- Image Logic ---
  const handleFileSelect = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image"))
    
    // Yeni faylları əlavə edirik
    setSelectedFiles((prev) => [...prev, ...imageFiles])
    
    // Preview URL-ləri yaradırıq
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
      
      // Cleanup URL object
      URL.revokeObjectURL(newPreviews[index]);
      
      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);
      
      setSelectedFiles(newFiles);
      setPreviewUrls(newPreviews);
      
      // Əgər silinən şəkil Main idisə, 0-cı indeksi Main et
      if (index === mainImageIndex) setMainImageIndex(0);
      else if (index < mainImageIndex) setMainImageIndex(prev => prev - 1);
  }

  // --- Submit Logic ---
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.name || !formState.description || !formState.basePrice || !formState.stockQuantity || !formState.categoryId) {
      toast.error("Please fill in all required fields")
      return
    }

    const price = parseFloat(formState.basePrice);
    const discountPercentage = parseFloat(formState.discountPercent) || 0;

    const formData = new FormData()
    formData.append("name", formState.name)
    formData.append("description", formState.description)
    formData.append("price", price.toFixed(2))
    formData.append("discountPercentage", String(discountPercentage))
    formData.append("stockQuantity", formState.stockQuantity)
    formData.append("categoryId", formState.categoryId)
    
    if (formState.originId) {
        formData.append("originId", formState.originId)
    }
    
    if (formState.roastLevel) {
        formData.append("roastLevel", formState.roastLevel)
    }
    
    if (formState.weight) {
        formData.append("weight", formState.weight)
    }
    
    if (formState.flavorNotes) {
        formData.append("flavorNotes", formState.flavorNotes)
    }

    // --- Image Reordering Logic ---
    if (selectedFiles.length > 0) {
        const filesToSend = [...selectedFiles];
        const mainFile = filesToSend[mainImageIndex];
        const otherFiles = filesToSend.filter((_, idx) => idx !== mainImageIndex);
        const sortedFiles = [mainFile, ...otherFiles];

        sortedFiles.forEach((file) => {
            formData.append("images", file);
        });
    }

    setSaving(true)
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, formData)
        toast.success("Product updated")
      } else {
        await createProduct(formData)
        toast.success("Product created")
      }
      setSheetOpen(false)
      resetForm()
      loadProducts()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

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
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-accent/80">Dashboard</p>
          <h1 className="text-4xl font-bold text-primary dark:text-secondary">Products</h1>
          <p className="text-muted-foreground">Manage catalog, discounts, and inventory.</p>
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
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl"
            onClick={handleOpenCreate}
          >
            <Plus className="size-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-dark dark:glass rounded-2xl border border-border/60 p-4 shadow-lg">
        <div className="grid gap-3 sm:grid-cols-[1fr,220px] lg:grid-cols-[1fr,240px,200px] items-center">
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
      <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-xl min-h-[400px] relative">
        {loading && (
             <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                 <Loader2 className="size-8 animate-spin text-accent" />
             </div>
        )}
        
        {displayedProducts.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <Layers className="size-12 mb-4 opacity-20" />
            <p>No products found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-border/60">
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Roast</TableHead>
                <TableHead>Price Info</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-white/5 transition-colors group">
                  <TableCell className="cursor-pointer" onClick={() => handleOpenEdit(product.id)}>
                    <div className="flex items-center gap-3">
                      {renderImage(product)}
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground leading-tight group-hover:text-accent transition-colors">
                            {product.name}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                            {product.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-white/10 border-border/60">
                      {product.categoryName || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {product.originName || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border ${getRoastBadgeColor(product.roastLevel)}`}>
                      {getRoastLabel(product.roastLevel)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col">
                        {product.discountPercentage && product.discountPercentage > 0 ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="line-through text-muted-foreground decoration-destructive/50">
                                    {currency.format(product.price)}
                                </span>
                                <span className="font-bold text-accent">
                                    {currency.format(product.price * (1 - product.discountPercentage / 100))}
                                </span>
                              </div>
                              <Badge variant="destructive" className="w-fit text-[10px] mt-1">
                                  {product.discountPercentage}% OFF
                              </Badge>
                            </>
                        ) : (
                            <span className="font-bold">{currency.format(product.price)}</span>
                        )}
                      </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.stockQuantity < 10 ? "destructive" : "secondary"}>
                        {product.stockQuantity} in stock
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(product.id)}
                        className="hover:bg-accent/10 hover:text-accent"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(product.id)}
                        className="hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Fix */}
      <div className="flex items-center justify-between pb-8">
        <div className="text-sm text-muted-foreground">
          Page {pageNumber} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
            disabled={!hasPrevPage || loading}
            className="glass"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((prev) => prev + 1)}
            disabled={!hasNextPage || loading}
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
            resetForm()
          }
        }}
      >
        <SheetContent
          side="right"
          className="glass-dark dark:glass border-border/60 backdrop-blur-xl shadow-2xl w-full sm:max-w-xl overflow-y-auto p-8"
        >
          <SheetHeader className="mb-8">
            <SheetTitle className="text-2xl">{selectedProduct ? "Edit Product" : "New Product"}</SheetTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {selectedProduct
                ? "Update details, discounts, or visuals."
                : "Add a new item to your catalog."}
            </p>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent/70">Basic Info</div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Name *</label>
                  <Input
                    value={formState.name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Arabica Dark Roast"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description *</label>
                  <Textarea
                    value={formState.description}
                    onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Product details..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <Select
                    value={formState.categoryId}
                    onValueChange={(val) => setFormState((prev) => ({ ...prev, categoryId: val }))}
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
            </div>

            {/* Coffee Identity Section */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent/70">Coffee Identity</div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Origin</label>
                  <Select
                    value={formState.originId}
                    onValueChange={(val) => setFormState((prev) => ({ ...prev, originId: val }))}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Roast Level</label>
                    <Select
                      value={formState.roastLevel}
                      onValueChange={(val) => setFormState((prev) => ({ ...prev, roastLevel: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select roast..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Light</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">Medium-Dark</SelectItem>
                        <SelectItem value="4">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weight (g)</label>
                    <Input
                      type="number"
                      min="0"
                      value={formState.weight}
                      onChange={(e) => setFormState((prev) => ({ ...prev, weight: e.target.value }))}
                      placeholder="250"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Flavor Notes</label>
                  <Input
                    value={formState.flavorNotes}
                    onChange={(e) => setFormState((prev) => ({ ...prev, flavorNotes: e.target.value }))}
                    placeholder="e.g. Blueberry, Chocolate, Nutty"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Inventory Section */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent/70">Pricing & Inventory</div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-accent/5 p-4 rounded-xl border border-accent/10">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Base Price ($) *</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formState.basePrice}
                      onChange={(e) => setFormState((prev) => ({ ...prev, basePrice: e.target.value }))}
                      placeholder="100.00"
                      className="bg-white/80 dark:bg-black/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-accent">Discount (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formState.discountPercent}
                      onChange={(e) => setFormState((prev) => ({ ...prev, discountPercent: e.target.value }))}
                      placeholder="0"
                      className="bg-white/80 dark:bg-black/20"
                    />
                  </div>
                  <div className="col-span-2 text-center border-t border-dashed border-border/50 pt-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Final Selling Price</p>
                    <p className="text-2xl font-bold text-accent">
                        {currency.format(
                            parseFloat(formState.basePrice || "0") * (1 - (parseFloat(formState.discountPercent || "0") / 100))
                        )}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Quantity *</label>
                  <Input
                    type="number"
                    min="0"
                    value={formState.stockQuantity}
                    onChange={(e) => setFormState((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                    placeholder="0"
                  />
                </div>
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
                    
                    {/* Existing Images (Edit Mode - Read Only for now) */}
                    {existingImages.map((img, idx) => (
                      <div key={`exist-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-border/50 opacity-70">
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="existing" className="w-full h-full object-cover grayscale" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            {img.isMain && <Badge className="bg-accent text-white">Main (Saved)</Badge>}
                        </div>
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

                         {/* Main Badge */}
                         {idx === mainImageIndex && (
                             <div className="absolute bottom-1 left-1 bg-accent text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                 <Star size={8} fill="currentColor" /> Main
                             </div>
                         )}
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
              <Button type="submit" disabled={saving || loadingProduct} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white min-w-[120px]">
                {saving ? (
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
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}