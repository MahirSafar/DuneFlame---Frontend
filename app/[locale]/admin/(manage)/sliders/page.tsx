"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Loader2, Pencil, Plus, Trash2, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { sliderService, type AdminSlider } from "@/lib/services/sliderService";
import SliderForm from "@/components/admin/sliders/slider-form";

const PAGE_SIZE = 10;

export default function AdminSlidersPage() {
  const [sliders, setSliders] = useState<AdminSlider[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Sheet (create / edit)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSlider, setSelectedSlider] = useState<AdminSlider | undefined>(undefined);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sliderToDelete, setSliderToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSliders = useCallback(async (page = pageNumber) => {
    setLoading(true);
    try {
      const data = await sliderService.getAll(page, PAGE_SIZE);
      setSliders(data.items ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.totalCount ?? 0);
    } catch {
      toast.error("Failed to load sliders");
    } finally {
      setLoading(false);
    }
  }, [pageNumber]);

  useEffect(() => {
    fetchSliders(pageNumber);
  }, [pageNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setSelectedSlider(undefined);
    setSheetOpen(true);
  };

  const openEdit = (slider: AdminSlider) => {
    setSelectedSlider(slider);
    setSheetOpen(true);
  };

  const openDelete = (id: string) => {
    setSliderToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleFormClose = (refresh?: boolean) => {
    setSheetOpen(false);
    setSelectedSlider(undefined);
    if (refresh) fetchSliders(pageNumber);
  };

  const handleDelete = async () => {
    if (!sliderToDelete) return;
    setDeleting(true);
    try {
      await sliderService.delete(sliderToDelete);
      toast.success("Slider deleted");
      setDeleteDialogOpen(false);
      setSliderToDelete(null);
      // if last item on page, go back one
      const newPage = sliders.length === 1 && pageNumber > 1 ? pageNumber - 1 : pageNumber;
      setPageNumber(newPage);
      fetchSliders(newPage);
    } catch {
      toast.error("Failed to delete slider");
    } finally {
      setDeleting(false);
    }
  };

  const getTitle = (slider: AdminSlider) =>
    slider.translations?.find((t) => t.languageCode === "en")?.title ||
    slider.translations?.[0]?.title ||
    "—";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hero Sliders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCount} slider{totalCount !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Slider
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Image</TableHead>
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Title (EN)</TableHead>
              <TableHead>Button</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : sliders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  No sliders yet. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              sliders.map((slider) => {
                const enTrans = slider.translations?.find((t) => t.languageCode === "en");
                return (
                  <TableRow key={slider.id}>
                    {/* Thumbnail */}
                    <TableCell>
                      {slider.imageUrl ? (
                        <div className="relative h-12 w-20 rounded overflow-hidden bg-muted">
                          <Image
                            src={slider.imageUrl}
                            alt={getTitle(slider)}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-20 items-center justify-center rounded bg-muted">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>

                    {/* Order */}
                    <TableCell className="font-mono font-medium">{slider.order}</TableCell>

                    {/* Title */}
                    <TableCell>
                      <p className="font-medium">{enTrans?.title || "—"}</p>
                      {enTrans?.subtitle && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {enTrans.subtitle}
                        </p>
                      )}
                    </TableCell>

                    {/* Button text */}
                    <TableCell className="text-sm text-muted-foreground">
                      {enTrans?.buttonText || "—"}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant={slider.isActive ? "default" : "secondary"}>
                        {slider.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(slider)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDelete(slider.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {pageNumber} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pageNumber <= 1 || loading}
              onClick={() => setPageNumber((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pageNumber >= totalPages || loading}
              onClick={() => setPageNumber((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) handleFormClose(); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-8">
          <SheetHeader className="mb-4">
            <SheetTitle>{selectedSlider ? "Edit Slider" : "New Slider"}</SheetTitle>
          </SheetHeader>
          <SliderForm slider={selectedSlider} onClose={handleFormClose} />
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slider?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The slider will be permanently removed from the storefront.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
