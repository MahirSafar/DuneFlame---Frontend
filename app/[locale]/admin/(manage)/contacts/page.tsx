"use client"

import { useEffect, useState } from "react"
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
import {
  Eye,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import toast from "react-hot-toast"
import {
  type ContactMessage,
  deleteContact,
  getAdminContacts,
  markContactAsRead,
} from "@/lib/services/contact"
import { getErrorMessage } from "@/lib/utils"

const PAGE_SIZE = 10

export default function AdminContactsPage() {
  // ─── Data ───────────────────────────────────────────────────────────────────
  const [contacts, setContacts] = useState<ContactMessage[]>([])

  // ─── Pagination & Search ─────────────────────────────────────────────────────
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // ─── UI State ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [viewingContact, setViewingContact] = useState<ContactMessage | null>(null)
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Debounce search ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setPageNumber(1)
      setDebouncedSearch(searchTerm.trim())
    }, 400)
    return () => clearTimeout(t)
  }, [searchTerm])

  // ─── Fetch on deps change ─────────────────────────────────────────────────────
  useEffect(() => {
    loadContacts()
  }, [pageNumber, debouncedSearch])

  // ─── Functions ────────────────────────────────────────────────────────────────
  const loadContacts = async () => {
    setLoading(true)
    try {
      const res = await getAdminContacts({
        pageNumber,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
      })
      setContacts(res.items)
      setTotalPages(res.totalPages)
      setTotalCount(res.totalCount)
      setHasNextPage(res.hasNextPage)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (contact: ContactMessage) => {
    setViewingContact(contact)
    setViewDialogOpen(true)

    // Mark as read in background if not already read
    if (!contact.isRead) {
      try {
        await markContactAsRead(contact.id)
        // Optimistically update local state
        setContacts((prev) =>
          prev.map((c) => (c.id === contact.id ? { ...c, isRead: true } : c))
        )
        setViewingContact((prev) => (prev ? { ...prev, isRead: true } : prev))
      } catch {
        // Silently ignore — it's a background update
      }
    }
  }

  const confirmDelete = (id: string) => {
    setContactToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!contactToDelete) return
    setDeleting(true)
    try {
      await deleteContact(contactToDelete)
      toast.success("Message deleted.")
      setContacts((prev) => prev.filter((c) => c.id !== contactToDelete))
      setTotalCount((prev) => prev - 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setContactToDelete(null)
    }
  }

  const formatDate = (iso?: string) => {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-accent/80 font-semibold">Dashboard</p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-secondary">Contact Messages</h1>
          <p className="text-muted-foreground mt-1">View and manage customer enquiries.</p>
        </div>
        <Button
          variant="outline"
          className="glass hover:glow-accent self-start md:self-auto"
          onClick={loadContacts}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          <span className="hidden sm:inline ml-2">Refresh</span>
        </Button>
      </div>

      {/* Search / count bar */}
      <div className="glass-dark dark:glass rounded-2xl border border-border/60 p-5 md:p-6 shadow-lg">
        <div className="grid gap-4 sm:grid-cols-[1fr,auto] items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email or subject…"
              className="pl-10 bg-white/60 dark:bg-white/5 border-border/60"
            />
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {totalCount} messages • Page {pageNumber} of {totalPages}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-xl min-h-100 relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="size-8 animate-spin text-accent" />
          </div>
        )}

        {contacts.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-75 text-muted-foreground">
            <Mail className="size-12 mb-4 opacity-20" />
            <p>No messages found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-border/60">
                <TableHead className="py-4 px-6">Status</TableHead>
                <TableHead className="py-4 px-4">Date</TableHead>
                <TableHead className="py-4 px-4">Name</TableHead>
                <TableHead className="py-4 px-4">Email</TableHead>
                <TableHead className="py-4 px-4">Subject</TableHead>
                <TableHead className="text-right py-4 px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className={`hover:bg-white/5 transition-colors group ${!contact.isRead ? "font-medium" : ""}`}
                >
                  <TableCell className="py-4 px-6">
                    {contact.isRead ? (
                      <Badge variant="secondary" className="bg-white/10 border-border/60 text-muted-foreground">
                        Read
                      </Badge>
                    ) : (
                      <Badge className="bg-accent/20 text-accent border-accent/30">
                        Unread
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(contact.createdAt)}
                  </TableCell>
                  <TableCell className="py-4 px-4 font-medium">
                    {contact.name}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-sm text-muted-foreground">
                    {contact.email}
                  </TableCell>
                  <TableCell className="py-4 px-4 max-w-55">
                    <span className="line-clamp-1 text-sm">{contact.subject}</span>
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-accent/10 hover:text-accent"
                        onClick={() => handleView(contact)}
                        title="View message"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-destructive/10 text-destructive"
                        onClick={() => confirmDelete(contact.id)}
                        title="Delete message"
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

      {/* Pagination */}
      <div className="flex items-center justify-between py-6 px-2">
        <div className="text-sm text-muted-foreground font-medium">
          Page {pageNumber} of {totalPages}
        </div>
        <div className="flex gap-3">
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
            disabled={pageNumber >= totalPages || !hasNextPage || loading}
            className="glass"
          >
            Next
          </Button>
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="glass-dark dark:glass border-border/60 backdrop-blur-xl shadow-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Message Details</DialogTitle>
          </DialogHeader>

          {viewingContact && (
            <div className="space-y-5 mt-2">
              {/* Meta row */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-widest text-accent/70 mb-1">From</p>
                  <p className="font-semibold">{viewingContact.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-accent/70 mb-1">Date</p>
                  <p>{formatDate(viewingContact.createdAt)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-widest text-accent/70 mb-1">Email</p>
                  <a
                    href={`mailto:${viewingContact.email}`}
                    className="text-accent hover:underline"
                  >
                    {viewingContact.email}
                  </a>
                </div>
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-widest text-accent/70 mb-1">Subject</p>
                  <p className="font-medium">{viewingContact.subject}</p>
                </div>
              </div>

              {/* Message body */}
              <div>
                <p className="text-xs uppercase tracking-widest text-accent/70 mb-2">Message</p>
                <div className="bg-white/5 rounded-lg border border-border/40 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {viewingContact.message}
                </div>
              </div>

              {/* Status pill */}
              <div className="flex justify-end">
                {viewingContact.isRead ? (
                  <Badge variant="secondary" className="text-muted-foreground">Read</Badge>
                ) : (
                  <Badge className="bg-accent/20 text-accent border-accent/30">Unread</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-dark dark:glass border-border/60 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The message will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              onClick={() => {
                setDeleteDialogOpen(false)
                setContactToDelete(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
