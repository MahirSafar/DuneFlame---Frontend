'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { ArrowLeft, MapPin, Package, CreditCard, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { getOrderById } from '@/lib/services/orders'

const STEPS = ['Pending', 'Paid', 'Shipped', 'Delivered']

export default function OrderDetailsPage() {
  const params = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getOrderById(params.id as string)
        console.log('Order Data:', data)
        setOrder(data)
      } catch (err: any) {
        console.error('Error fetching order:', err)
        if (err?.status === 403) {
          setError('Unauthorized. Please login again.')
        } else if (err?.status === 404) {
          setError('Order not found.')
        } else {
          setError(err?.message || 'Failed to load order details.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchOrder()
    }
  }, [params.id])

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={48} className="mx-auto text-orange-600 mb-4 animate-spin" />
            <p className="text-lg text-zinc-600 dark:text-zinc-400">Loading order...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
        <Navbar />
        <div className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboard
            </Link>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <p className="text-red-700 dark:text-red-300 font-semibold">{error || 'Order not found'}</p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  // Status-u string-dən indeksinə çevirək
  const statusIndex = STEPS.indexOf(order.status)
  const isCancelled = order.status === 'Cancelled'

  return (
    <main className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Order #{order.id.slice(0, 8)}</h1>
                <p className="text-zinc-500 mt-1">
                  Created: {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-500 mb-2">Status</p>
                <span
                  className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                    order.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : order.status === 'Paid'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : order.status === 'Shipped'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : order.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Tracking Bar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 mb-8 shadow-sm">
            {isCancelled ? (
              <div className="flex items-center justify-center gap-3 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <XCircle size={32} />
                <div>
                  <h3 className="font-bold text-lg">Order Cancelled</h3>
                  <p className="text-sm opacity-80">This order has been cancelled.</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute top-5 left-0 w-full h-1 bg-zinc-200 dark:bg-zinc-800 -z-0 rounded-full"></div>
                <div
                  className="absolute top-5 left-0 h-1 bg-green-500 -z-0 transition-all duration-500 rounded-full"
                  style={{ width: `${statusIndex >= 0 ? (statusIndex / (STEPS.length - 1)) * 100 : 0}%` }}
                ></div>

                <div className="relative z-10 flex justify-between w-full">
                  {STEPS.map((step, index) => {
                    const isCompleted = index <= statusIndex
                    const isCurrent = index === statusIndex
                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle size={18} /> : <div className="w-2 h-2 rounded-full bg-zinc-300" />}
                        </div>
                        <span
                          className={`mt-3 text-sm font-medium ${
                            isCurrent ? 'text-green-600' : isCompleted ? 'text-zinc-900 dark:text-zinc-200' : 'text-zinc-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left: Items List */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Package size={20} className="text-orange-500" />
                  Products
                </h3>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.productName}</p>
                        <p className="text-sm text-zinc-500">
                          {item.quantity} qty × {item.unitPrice} {order.currency}
                        </p>
                      </div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">
                        {(item.quantity * item.unitPrice).toFixed(2)} {order.currency}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <span className="font-medium text-zinc-500">Total</span>
                  <span className="text-xl font-bold text-orange-600">
                    {order.totalAmount} {order.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Summary & Address */}
            <div className="space-y-6">
              {/* Address Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-blue-500" />
                  Shipping Address
                </h3>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{order.customerName}</p>
                <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{order.shippingAddress}</p>
                <div className="mt-4 text-xs text-zinc-400 space-y-1">
                  <p>{order.customerEmail}</p>
                  <p>{order.customerPhone}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-green-500" />
                  Payment
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Method:</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">Stripe / Card</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Status:</span>
                    <span className="font-medium text-green-600">{order.status}</span>
                  </div>
                  {order.paymentTransactionId && (
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">Transaction ID:</p>
                      <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 break-all">
                        {order.paymentTransactionId}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
