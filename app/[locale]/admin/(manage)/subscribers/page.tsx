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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
} from "lucide-react"
import toast from "react-hot-toast"
import {
  type Subscriber,
  getAdminSubscribers,
  sendBulkEmail,
} from "@/lib/services/newsletter"
import { getErrorMessage } from "@/lib/utils"

const PAGE_SIZE = 10

export default function AdminSubscribersPage() {
  // ─── Data ───────────────────────────────────────────────────────────────────
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])

  // ─── Pagination & Search ─────────────────────────────────────────────────────
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // ─── UI State ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)

  // ─── Bulk Email Form ─────────────────────────────────────────────────────────
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [isSending, setIsSending] = useState(false)

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
    loadSubscribers()
  }, [pageNumber, debouncedSearch])

  // ─── Functions ────────────────────────────────────────────────────────────────
  const loadSubscribers = async () => {
    setLoading(true)
    try {
      const res = await getAdminSubscribers({
        pageNumber,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
      })
      setSubscribers(res.items)
      setTotalPages(res.totalPages)
      setTotalCount(res.totalCount)
      setHasNextPage(res.hasNextPage)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !content.trim()) return
    setIsSending(true)
    try {
      await sendBulkEmail({ subject: subject.trim(), content: content.trim() })
      toast.success("Bulk email sent successfully!")
      setSubject("")
      setContent("")
      setBulkDialogOpen(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSending(false)
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
          <h1 className="text-4xl md:text-5xl font-bold text-primary dark:text-secondary">Newsletter Subscribers</h1>
          <p className="text-muted-foreground mt-1">View subscribers and send bulk emails.</p>
        </div>
        <Button
          variant="outline"
          className="glass hover:glow-accent self-start md:self-auto"
          onClick={loadSubscribers}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          <span className="hidden sm:inline ml-2">Refresh</span>
        </Button>
      </div>

      {/* Search / count bar */}
      <div className="glass-dark dark:glass rounded-2xl border border-border/60 p-5 md:p-6 shadow-lg">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email…"
              className="pl-10 bg-white/60 dark:bg-white/5 border-border/60"
            />
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {totalCount} subscribers • Page {pageNumber} of {totalPages}
          </div>
          <Button
            onClick={() => setBulkDialogOpen(true)}
            className="flex items-center gap-2 bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30"
            variant="outline"
          >
            <Send className="size-4" />
            <span>Send Email to All</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-xl min-h-100 relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="size-8 animate-spin text-accent" />
          </div>
        )}

        {subscribers.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-75 text-muted-foreground">
            <Mail className="size-12 mb-4 opacity-20" />
            <p>No subscribers found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-border/60">
                <TableHead className="py-4 px-6">Status</TableHead>
                <TableHead className="py-4 px-4">Date</TableHead>
                <TableHead className="py-4 px-4">Email</TableHead>
                <TableHead className="py-4 px-4">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((subscriber) => (
                <TableRow
                  key={subscriber.id}
                  className="hover:bg-white/5 transition-colors group"
                >
                  <TableCell className="py-4 px-6">
                    {subscriber.isVerified ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-white/10 border-border/60 text-muted-foreground">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(subscriber.createdAt)}
                  </TableCell>
                  <TableCell className="py-4 px-4 font-medium">
                    {subscriber.email}
                  </TableCell>
                  <TableCell className="py-4 px-4 text-sm text-muted-foreground">
                    {subscriber.source ?? "—"}
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

      {/* Send Bulk Email Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={(open) => {
        if (!isSending) setBulkDialogOpen(open)
      }}>
        <DialogContent className="glass-dark dark:glass border-border/60 backdrop-blur-xl shadow-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Send Email to All Subscribers</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSendBulk} className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label htmlFor="bulk-subject">Subject</Label>
              <Input
                id="bulk-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Exclusive offer just for you"
                className="bg-white/60 dark:bg-white/5 border-border/60"
                required
                disabled={isSending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-content">Content</Label>
              <Textarea
                id="bulk-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your email body here…"
                rows={7}
                className="bg-white/60 dark:bg-white/5 border-border/60 resize-none"
                required
                disabled={isSending}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBulkDialogOpen(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSending || !subject.trim() || !content.trim()}
                className="bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30"
                variant="outline"
              >
                {isSending ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Send className="size-4 mr-2" />
                )}
                {isSending ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
