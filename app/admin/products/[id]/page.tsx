"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminProductById } from "@/lib/services/adminProducts";
import type { AdminProductResponse } from "@/lib/types/product";
import { getErrorMessage } from "@/lib/utils";
import toast from "react-hot-toast";

/**
 * Edit Product Page
 * 
 * This page fetches a product by ID and displays an edit form.
 * It transforms the backend DTO into a format suitable for the product form.
 * 
 * You can integrate your CreateProductForm component here by replacing
 * the placeholder with your actual form component.
 */
export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<AdminProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminProductById(productId);
        setProduct(data);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Transform product data for form
  const getFormInitialData = () => {
    if (!product) return null;

    const minPrice = product.availablePrices?.[0]?.price || 0;

    return {
      id: product.id,
      name: product.name,
      description: product.description || "",
      categoryId: product.categoryId || "",
      categoryName: product.categoryName,
      originId: product.originId || "",
      originName: product.originName || "",
      stockInKg: product.stockInKg,
      roastLevelIds: product.roastLevelIds || [],
      grindTypeIds: product.grindTypeIds || [],
      prices: product.availablePrices || [],
      images: product.images || [],
      minPrice: minPrice,
    };
  };

  const initialData = getFormInitialData();

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="size-12 animate-spin text-accent mx-auto mb-4" />
              <p className="text-muted-foreground">Loading product...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ChevronLeft className="size-4 mr-2" />
            Go Back
          </Button>

          <div className="glass-dark dark:glass rounded-2xl border border-border/60 p-8 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "Unable to load the product. Please try again."}
            </p>
            <Button asChild>
              <Link href="/admin/products-list">Back to Products</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ChevronLeft className="size-4 mr-2" />
              Back
            </Button>
            <h1 className="text-4xl font-bold text-primary dark:text-secondary">
              Edit Product
            </h1>
            <p className="text-muted-foreground mt-1">
              {product.name}
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="glass-dark dark:glass rounded-2xl border border-border/60 p-6 md:p-8 shadow-lg">
          {/* 
            Replace this with your CreateProductForm component
            Example usage:
            <CreateProductForm 
              initialData={initialData}
              isEdit={true}
              onSuccess={() => router.push('/admin/products-list')}
            />
          */}
          <div className="space-y-6">
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Product Data Loaded:</strong>
              </p>
              <div className="space-y-2 text-sm">
                <p><span className="text-accent">Name:</span> {product.name}</p>
                <p><span className="text-accent">Category:</span> {product.categoryName}</p>
                <p><span className="text-accent">Stock (kg):</span> {product.stockInKg}</p>
                <p><span className="text-accent">Prices Available:</span> {product.availablePrices?.length || 0}</p>
                <p><span className="text-accent">Images:</span> {product.images?.length || 0}</p>
                <p><span className="text-accent">Roast Levels:</span> {product.roastLevelIds?.length || 0}</p>
                <p><span className="text-accent">Grind Types:</span> {product.grindTypeIds?.length || 0}</p>
              </div>
            </div>

            <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-200">
                💡 <strong>Next Step:</strong> Import your CreateProductForm component and replace the placeholder above.
                Pass the transformed initialData and set isEdit=true.
              </p>
              <pre className="mt-4 text-xs bg-black/20 p-3 rounded overflow-auto text-white/70">
{`<CreateProductForm 
  initialData={{
    ...${JSON.stringify(initialData, null, 2).split('\n').slice(0, 3).join('\n')}
    ...
  }}
  isEdit={true}
  onSuccess={() => router.push('/admin/products-list')}
/>`}
              </pre>
            </div>

            <Button asChild className="w-full bg-linear-to-r from-amber-500 to-orange-600">
              <Link href="/admin/products-list">
                Return to Products List
              </Link>
            </Button>
          </div>
        </div>

        {/* Data Reference */}
        <details className="glass-dark dark:glass rounded-2xl border border-border/60 p-6">
          <summary className="cursor-pointer text-sm font-semibold text-accent hover:text-accent/80 transition-colors">
            View Transformed Product Data
          </summary>
          <pre className="mt-4 bg-black/20 p-4 rounded overflow-auto text-xs text-white/70">
            {JSON.stringify(initialData, null, 2)}
          </pre>
        </details>
      </div>
    </main>
  );
}
