"use client";

import { useEffect, useState, useCallback } from "react";
import { Link, useRouter } from "@/i18n/routing";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getAdminProducts,
  deleteAdminProduct,
} from "@/lib/services/adminProducts";
import { PagedResult } from "@/lib/services/products";
import type { AdminProductResponse } from "@/lib/types/product";
import { getErrorMessage, getImageUrl } from "@/lib/utils";
import { API_URL } from "@/lib/config";
import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Eye,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function AdminProductListPage() {
  const router = useRouter();

  // State management
  const [products, setProducts] = useState<AdminProductResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<AdminProductResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageNumber(1);
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load products
  const loadProducts = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const result = await getAdminProducts({
          pageNumber: page,
          pageSize: PAGE_SIZE,
          search: debouncedSearch || undefined,
        });
        setProducts(result.items);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch]
  );

  useEffect(() => {
    loadProducts(pageNumber);
  }, [pageNumber, debouncedSearch, loadProducts]);

  // Delete product
  const handleDelete = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      await deleteAdminProduct(productToDelete.id);
      toast.success("Product deleted successfully");
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      loadProducts(pageNumber);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  // Get main image
  const getMainImage = (product: AdminProductResponse): string | null => {
    const mainImg = product.images?.find((img) => img.isMain)?.imageUrl;
    return mainImg ? getImageUrl(mainImg) : null;
  };

  // Get minimum price
  const getMinPrice = (product: AdminProductResponse): number => {
    if (!product.availablePrices || product.availablePrices.length === 0) {
      return 0;
    }
    return Math.min(...product.availablePrices.map((p) => p.price));
  };

  // Render product row
  const renderProductRow = (product: AdminProductResponse) => {
    const minPrice = getMinPrice(product);
    const mainImage = getMainImage(product);
    const stockColor =
      product.stockInKg === 0
        ? "bg-destructive/10 text-destructive"
        : "bg-green-500/10 text-green-600";

    return (
      <TableRow key={product.id} className="hover:bg-white/5 transition-colors group">
        {/* Image & Name */}
        <TableCell className="cursor-pointer" onClick={() => router.push(`/admin/products/${product.id}`)}>
          <div className="flex items-center gap-3">
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-xs text-muted-foreground">
                No image
              </div>
            )}
            <div>
              <div className="font-semibold text-foreground group-hover:text-accent transition-colors">
                {product.name}
              </div>
              <div className="text-xs text-muted-foreground">{product.id.substring(0, 8)}...</div>
            </div>
          </div>
        </TableCell>

        {/* Category */}
        <TableCell>
          <Badge variant="outline" className="bg-white/10 border-border/60">
            {product.categoryName || "—"}
          </Badge>
        </TableCell>

        {/* Stock */}
        <TableCell>
          <Badge className={stockColor}>
            {product.stockInKg} kg
          </Badge>
        </TableCell>

        {/* Price */}
        <TableCell>
          {minPrice > 0 ? (
            <span className="font-semibold">from {currency.format(minPrice)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Actions */}
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent/10 hover:text-accent"
              asChild
              title="Edit Product"
            >
              <Link href={`/admin/products/${product.id}`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-destructive/10 text-destructive"
              onClick={() => {
                setProductToDelete(product);
                setDeleteDialogOpen(true);
              }}
              title="Delete Product"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-background to-background/80 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-accent/80">Dashboard</p>
            <h1 className="text-4xl font-bold text-primary dark:text-secondary mt-2">Products</h1>
            <p className="text-muted-foreground mt-1">Manage your coffee catalog</p>
          </div>
          <Button
            className="bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl w-full sm:w-auto"
            asChild
          >
            <Link href="/admin/products/create">
              <Plus className="size-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="glass-dark dark:glass rounded-2xl border border-border/60 p-4 shadow-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by name..."
              className="pl-10 bg-white/60 dark:bg-white/5 border-border/60"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="glass-dark dark:glass rounded-2xl border border-border/60 p-6 shadow-lg overflow-hidden">
          {loading && products.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="size-8 animate-spin text-accent" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertCircle className="size-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">
                {searchTerm ? "Try adjusting your search" : "Add your first product to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => renderProductRow(product))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {products.length > 0 ? (pageNumber - 1) * PAGE_SIZE + 1 : 0} to{" "}
              {Math.min(pageNumber * PAGE_SIZE, totalCount)} of {totalCount} products
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                disabled={pageNumber <= 1 || loading}
                className="glass"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageNumber((prev) => prev + 1)}
                disabled={pageNumber >= totalPages || loading}
                className="glass"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-dark dark:glass border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{productToDelete?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
