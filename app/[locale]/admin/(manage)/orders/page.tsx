"use client"

import { useEffect, useState } from "react"
import { formatDate } from "date-fns"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Separator } from "@/components/ui/separator"
import { useLocale } from "next-intl"
import {
  Order,
  OrderStatus,
  OrderStatusLabels,
  PagedResult,
  cancelOrder,
  getOrders,
  updateOrderStatus,
} from "@/lib/services/orders"
import { getErrorMessage } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Search,
  RotateCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  CreditCard,
} from "lucide-react"
import toast from "react-hot-toast"

const PAGE_SIZE = 10

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-500",
  [OrderStatus.Paid]: "bg-blue-500/20 text-blue-600 dark:text-blue-500",
  [OrderStatus.Shipped]: "bg-purple-500/20 text-purple-600 dark:text-purple-500",
  [OrderStatus.Delivered]: "bg-green-500/20 text-green-600 dark:text-green-500",
  [OrderStatus.Cancelled]: "bg-red-500/20 text-red-600 dark:text-red-500",
}

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  [OrderStatus.Pending]: <AlertTriangle className="w-4 h-4" />,
  [OrderStatus.Paid]: <Package className="w-4 h-4" />,
  [OrderStatus.Shipped]: <Truck className="w-4 h-4" />,
  [OrderStatus.Delivered]: <CheckCircle className="w-4 h-4" />,
  [OrderStatus.Cancelled]: <XCircle className="w-4 h-4" />,
}

/**
 * Converts string status names to OrderStatus enum number OR returns the label directly.
 * Handles both string ("Paid", "Cancelled") and numeric (0, 1, 2, 3, 4) status values.
 */
function getStatusLabel(status: OrderStatus | string): string {
  // Map string status names to labels
  const stringLabels: Record<string, string> = {
    "Pending": OrderStatusLabels[OrderStatus.Pending],
    "Paid": OrderStatusLabels[OrderStatus.Paid],
    "Shipped": OrderStatusLabels[OrderStatus.Shipped],
    "Delivered": OrderStatusLabels[OrderStatus.Delivered],
    "Cancelled": OrderStatusLabels[OrderStatus.Cancelled],
  };
  
  const statusStr = String(status);
  
  // If it's a string name, return from stringLabels
  if (stringLabels[statusStr]) {
    return stringLabels[statusStr];
  }
  
  // If it's a numeric string or number, use OrderStatusLabels
  const numStatus = typeof status === 'number' ? status : parseInt(statusStr, 10);
  if (!isNaN(numStatus) && OrderStatusLabels[numStatus as OrderStatus]) {
    return OrderStatusLabels[numStatus as OrderStatus];
  }
  
  // Fallback: return the status as-is
  return statusStr;
}

/**
 * Returns the appropriate color class for a status (handles both string and numeric).
 */
function getStatusColor(status: OrderStatus | string): string {
  const stringToEnum: Record<string, OrderStatus> = {
    "Pending": OrderStatus.Pending,
    "Paid": OrderStatus.Paid,
    "Shipped": OrderStatus.Shipped,
    "Delivered": OrderStatus.Delivered,
    "Cancelled": OrderStatus.Cancelled,
  };
  
  const statusStr = String(status);
  let enumStatus = stringToEnum[statusStr] as OrderStatus;
  
  if (enumStatus === undefined) {
    const numStatus = typeof status === 'number' ? status : parseInt(statusStr, 10);
    enumStatus = isNaN(numStatus) ? OrderStatus.Pending : (numStatus as OrderStatus);
  }
  
  return statusColors[enumStatus] || statusColors[OrderStatus.Pending];
}

/**
 * Returns the appropriate icon for a status (handles both string and numeric).
 */
function getStatusIcon(status: OrderStatus | string): React.ReactNode {
  const stringToEnum: Record<string, OrderStatus> = {
    "Pending": OrderStatus.Pending,
    "Paid": OrderStatus.Paid,
    "Shipped": OrderStatus.Shipped,
    "Delivered": OrderStatus.Delivered,
    "Cancelled": OrderStatus.Cancelled,
  };
  
  const statusStr = String(status);
  let enumStatus = stringToEnum[statusStr] as OrderStatus;
  
  if (enumStatus === undefined) {
    const numStatus = typeof status === 'number' ? status : parseInt(statusStr, 10);
    enumStatus = isNaN(numStatus) ? OrderStatus.Pending : (numStatus as OrderStatus);
  }
  
  return statusIcons[enumStatus] || statusIcons[OrderStatus.Pending];
}

/**
 * Determines all allowed next statuses for an order based on backend state transitions.
 * Handles both string status names ("Pending", "Paid") and numeric values (0, 1, 2, 3, 4).
 * Returns empty array if no transitions are allowed.
 */
function getNextStatuses(currentStatus: OrderStatus | string): OrderStatus[] {
  // Convert incoming value to string for normalization (e.g., "Pending" or "0")
  const statusStr = String(currentStatus);
  
  
  // Check for string status names (from backend) OR numeric strings
  if (statusStr === "Pending" || statusStr === "0") {
    return [OrderStatus.Paid, OrderStatus.Cancelled];
  }
  if (statusStr === "Paid" || statusStr === "1") {
    return [OrderStatus.Shipped, OrderStatus.Cancelled];
  }
  if (statusStr === "Shipped" || statusStr === "2") {
    return [OrderStatus.Delivered, OrderStatus.Cancelled];
  }
  
  // Final statuses - no transitions allowed
  if (
    statusStr === "Delivered" || 
    statusStr === "3" || 
    statusStr === "Cancelled" || 
    statusStr === "4"
  ) {
    return [];
  }
  
  return [];
}

export default function OrdersPage() {
  const locale = useLocale()
  const isArabic = locale === "ar"
  const [data, setData] = useState<PagedResult<Order> | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageNumber, setPageNumber] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [statusChangeOrder, setStatusChangeOrder] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Debounce search input
  const debouncedSearch = useDebounce(searchTerm, 500)

  // Load orders when page, filters, or debounced search changes
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true)
        const result = await getOrders({
          pageNumber,
          pageSize: PAGE_SIZE,
          status: statusFilter || undefined,
          search: debouncedSearch || undefined,
        })
        setData(result)
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [pageNumber, debouncedSearch, statusFilter])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPageNumber(1)
  }, [statusFilter, debouncedSearch])

  const handleRefresh = async () => {
    try {
      setLoading(true)
      const result = await getOrders({
        pageNumber,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      })
      setData(result)
      toast.success("Orders refreshed")
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: string, newStatusValue: string) => {
    try {
      setActionLoading(orderId)
      const status = parseInt(newStatusValue, 10)
      await updateOrderStatus(orderId, status)
      
      // Update local data
      if (data) {
        setData({
          ...data,
          items: data.items.map((o) =>
            o.id === orderId ? { ...o, status: status as OrderStatus } : o
          ),
        })
      }
      
      toast.success("Order status updated")
      setStatusChangeOrder(null)
      setNewStatus("")
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      setActionLoading(orderId)
      
      await cancelOrder(orderId)
      
      // Update local data
      if (data) {
        const updatedData = {
          ...data,
          items: data.items.map((o) =>
            o.id === orderId ? { ...o, status: OrderStatus.Cancelled } : o
          ),
        };
        setData(updatedData)
      }
      
      toast.success("Order cancelled. Refunds and restocking processed.")
      setCancelConfirmOrder(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setActionLoading(null)
    }
  }

  const isCancelled = (order: Order) => order.status === OrderStatus.Cancelled

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  })

  const orders = data?.items ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer orders and track shipments
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
        {/* Search Input */}
        <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            type="text"
            placeholder="Search by Order ID..."
            className="bg-transparent border-0 focus-visible:ring-0 flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter || "all"}
          onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value={String(OrderStatus.Pending)}>
              {OrderStatusLabels[OrderStatus.Pending]}
            </SelectItem>
            <SelectItem value={String(OrderStatus.Paid)}>
              {OrderStatusLabels[OrderStatus.Paid]}
            </SelectItem>
            <SelectItem value={String(OrderStatus.Shipped)}>
              {OrderStatusLabels[OrderStatus.Shipped]}
            </SelectItem>
            <SelectItem value={String(OrderStatus.Delivered)}>
              {OrderStatusLabels[OrderStatus.Delivered]}
            </SelectItem>
            <SelectItem value={String(OrderStatus.Cancelled)}>
              {OrderStatusLabels[OrderStatus.Cancelled]}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Info */}
      {data && (
        <div className="text-sm text-muted-foreground">
          Showing {orders.length} of {data.totalCount} orders
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order, orderIndex) => {
                // DEBUG: Log order status details
                const nextStatuses = getNextStatuses(order.status);
                
                return (
                <TableRow key={`order-${orderIndex}-${order.id}`} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm">
                    <div>
                      <p className="font-semibold">{order.id.slice(-8)}</p>
                      {order.customerName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.customerName}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(new Date(order.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge className={`gap-1.5 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {currency.format(order.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* View Details */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            title="View order details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center justify-between">
                              <span>Order Logistics</span>
                              <Badge className={`${getStatusColor(order.status)} gap-1.5`}>
                                {getStatusIcon(order.status)}
                                {getStatusLabel(order.status)}
                              </Badge>
                            </DialogTitle>
                            <DialogDescription>
                              Order ID: {order.id}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Row 1: Customer Name | Phone | Email */}
                            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                                    Customer Name
                                  </p>
                                  <p className="font-bold text-lg mt-1">
                                    {order.customerName || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Phone
                                  </p>
                                  <p className="font-semibold mt-1">
                                    {order.customerPhone || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                                    Email
                                  </p>
                                  <p className="font-semibold mt-1 text-sm break-all">
                                    {order.customerEmail || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Row 2: Shipping Address - Prominent for Courier */}
                            <div className="border-2 border-orange-300 dark:border-orange-700 rounded-lg p-4 bg-orange-50 dark:bg-orange-950/20">
                              <p className="text-xs text-orange-600 dark:text-orange-400 uppercase font-bold flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4" /> 
                                Shipping Address (for Courier)
                              </p>
                              <p className="text-sm font-semibold whitespace-pre-wrap leading-relaxed">
                                {order.shippingAddress || "N/A"}
                              </p>
                            </div>

                            <Separator />

                            {/* Row 3: Order Items List */}
                            <div>
                              <p className="font-semibold mb-3 text-base">Order Items</p>
                              <div className="space-y-2">
                                {order.items.map((item, itemIndex) => (
                                  <div
                                    key={`${order.id}-item-${itemIndex}`}
                                    className={`flex justify-between items-start p-3 bg-muted/50 rounded text-sm ${
                                      isArabic ? "border-r-4 flex-row-reverse" : "border-l-4"
                                    } border-muted-foreground/50`}
                                  >
                                    <div className="flex-1" style={{ textAlign: isArabic ? "right" : "left" }}>
                                      <p className="font-medium">
                                        {item.productName}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Qty: {item.quantity} × {currency.format(item.unitPrice)}
                                      </p>
                                    </div>
                                    <p className={`font-semibold ${isArabic ? "text-left mr-4" : "text-right ml-4"}`}>
                                      {currency.format(
                                        item.unitPrice * item.quantity
                                      )}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <Separator />

                            {/* Row 4: Payment Info */}
                            <div className="bg-slate-50 dark:bg-slate-950/30 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                              <p className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-2 mb-3">
                                <CreditCard className="w-4 h-4" /> Payment Details
                              </p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                                    Amount
                                  </p>
                                  <p className="font-bold text-lg mt-1">
                                    {currency.format(order.totalAmount)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                                    Status
                                  </p>
                                  <Badge className={`mt-1 ${getStatusColor(order.status)} gap-1.5`}>
                                    {getStatusIcon(order.status)}
                                    {getStatusLabel(order.status)}
                                  </Badge>
                                </div>
                                {order.paymentTransactionId && (
                                  <div className="col-span-2">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                                      💳 Transaction ID (Stripe)
                                    </p>
                                    <p className="font-mono text-xs mt-1 break-all bg-background p-2 rounded">
                                      {order.paymentTransactionId}
                                    </p>
                                  </div>
                                )}
                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                                    Order Date
                                  </p>
                                  <p className="font-semibold mt-1">
                                    {formatDate(
                                      new Date(order.createdAt),
                                      "MMM dd, yyyy HH:mm"
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Status Change */}
                      {!isCancelled(order) && getNextStatuses(order.status).length > 0 && (
                        <Dialog
                          open={statusChangeOrder === order.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setStatusChangeOrder(null)
                              setNewStatus("")
                            } else {
                              setStatusChangeOrder(order.id)
                              // Don't set a default; let user choose
                              setNewStatus("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              title="Change order status"
                            >
                              <Package className="w-4 h-4" />
                              <span className="hidden sm:inline">Change</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change Order Status</DialogTitle>
                              <DialogDescription>
                                Update the status for order {order.id.slice(-8)}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Next Status
                                </label>
                                <Select
                                  value={newStatus}
                                  onValueChange={setNewStatus}
                                >
                                  <SelectTrigger disabled={actionLoading === order.id}>
                                    <SelectValue 
                                      placeholder="Select status..."
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getNextStatuses(order.status).map((nextStatus) => (
                                      <SelectItem key={nextStatus} value={String(nextStatus)}>
                                        {OrderStatusLabels[nextStatus]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end gap-2 pt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setStatusChangeOrder(null)
                                    setNewStatus("")
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => {
                                    if (newStatus) {
                                      handleStatusChange(order.id, newStatus)
                                    }
                                  }}
                                  disabled={!newStatus || actionLoading === order.id}
                                >
                                  {actionLoading === order.id && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  )}
                                  Update
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Cancel Order */}
                      {!isCancelled(order) && order.status !== OrderStatus.Delivered && (
                        <AlertDialog
                          open={cancelConfirmOrder === order.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setCancelConfirmOrder(null)
                            } else {
                              setCancelConfirmOrder(order.id)
                            }
                          }}
                        >
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1"
                            onClick={() => setCancelConfirmOrder(order.id)}
                            title="Cancel order"
                          >
                            <XCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Cancel</span>
                          </Button>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="w-5 h-5" />
                                Action Irreversible
                              </AlertDialogTitle>
                              <AlertDialogDescription asChild>
                                <div className="space-y-4 text-sm">
                                  <p className="font-semibold text-foreground">
                                    This will automatically:
                                  </p>
                                  <ol className="space-y-2 ml-2">
                                    <li className="flex gap-3">
                                      <span className="font-bold text-destructive shrink-0">1.</span>
                                      <span>Refund the payment via Stripe</span>
                                    </li>
                                    <li className="flex gap-3">
                                      <span className="font-bold text-destructive shrink-0">2.</span>
                                      <span>Reverse earned reward points <span className="text-xs text-muted-foreground">(Fraud Protection)</span></span>
                                    </li>
                                    <li className="flex gap-3">
                                      <span className="font-bold text-destructive shrink-0">3.</span>
                                      <span>Restock inventory items</span>
                                    </li>
                                  </ol>
                                  <p className="text-xs text-muted-foreground italic pt-2 border-t">
                                    All changes are atomic and permanent. Are you sure you want to proceed?
                                  </p>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Order</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={actionLoading === order.id}
                                className="bg-destructive text-white hover:bg-destructive/90"
                              >
                                {actionLoading === order.id && (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                Cancel Order
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pageNumber} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={!data.hasPreviousPage || loading}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              disabled={!data.hasNextPage || loading}
              className="gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
