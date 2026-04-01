'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { useLocale, useTranslations } from 'next-intl'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { ArrowLeft, MapPin, Package, CreditCard, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { getOrderById } from '@/lib/services/orders'
import { getProduct } from '@/lib/services/products'
import { useAuthStore } from '@/lib/auth-store'
import { setApiClientLocale } from '@/lib/axios'

const TEAL_COLOR = '#1F6F78'

export default function OrderDetailsPage() {
  const params = useParams()
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const t = useTranslations('dashboard')
  
  const STEPS = [
    t('orderSteps.pending'),
    t('orderSteps.paid'),
    t('orderSteps.shipped'),
    t('orderSteps.delivered'),
  ]
  const STEPS_ENUM = ['Pending', 'Paid', 'Shipped', 'Delivered']
  const { user, accessToken, refreshToken } = useAuthStore()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ensure locale is set in API client before any requests
  useEffect(() => {
    setApiClientLocale(locale)
  }, [locale])

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getOrderById(params.id as string)
        setOrder(data)
      } catch (err: any) {
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

  // Refresh product names when order loads or locale changes
  useEffect(() => {
    const refreshProductNames = async () => {
      if (!order || !order.items || order.items.length === 0) {
        return
      }

      try {
        // Ensure locale is set right before fetching
        setApiClientLocale(locale)
        
        // Small delay to ensure header is set
        await new Promise(resolve => setTimeout(resolve, 50))
        
        
        // Try to refetch each product to get translated names, but don't fail if unavailable
        const updatedItems = await Promise.all(
          order.items.map(async (item: any) => {
            if (item.productId) {
              try {
                const productDb = await getProduct(item.productId)
                if (productDb && productDb.name) {
                  return { ...item, productName: productDb.name }
                }
              } catch (err) {
              }
            }
            return item
          })
        )

        setOrder((prev: any) => ({
          ...prev,
          items: updatedItems
        }))

      } catch (error) {
        console.error('Failed to refresh product names:', error)
        // Silently fail - order data will show original product names
      }
    }

    refreshProductNames()
  }, [order?.id, locale])


  if (loading) {
    return (
      <main className="min-h-screen flex flex-col bg-white dark:bg-zinc-950" dir={isArabic ? "rtl" : "ltr"}>
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
      <main className="min-h-screen flex flex-col bg-white dark:bg-zinc-950" dir={isArabic ? "rtl" : "ltr"}>
        <Navbar />
        <div className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
              href="/dashboard"
              className={`inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-4 ${isArabic ? "flex-row-reverse" : ""}`}
            >
              <ArrowLeft size={16} className={isArabic ? "ml-2" : "mr-2"} />
              Back to Dashboard
            </Link>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <p className="text-red-700 dark:text-red-300 font-semibold" style={{ textAlign: isArabic ? "right" : "left" }}>{error || 'Order not found'}</p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  // Status-u string-dən indeksinə çevirək
  const statusIndex = STEPS_ENUM.indexOf(order.status)
  const isCancelled = order.status === 'Cancelled'

  return (
    <main className="min-h-screen flex flex-col bg-white dark:bg-zinc-950" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className={`inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-4 ${isArabic ? "flex-row-reverse" : ""}`}
            >
              <ArrowLeft size={16} className={isArabic ? "ml-2" : "mr-2"} />
              {t('backToDashboard')}
            </Link>
            <div className={`flex items-start gap-8 ${isArabic ? "flex-row-reverse text-right" : "justify-between"}`}>
              <div style={{ textAlign: isArabic ? "right" : "left" }}>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{t('orderPrefix')} #{order.id.slice(0, 8)}</h1>
                <p className="text-zinc-500 mt-1">
                  {t('created')}: {new Date(order.createdAt).toLocaleDateString(isArabic ? 'ar' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div style={{ textAlign: isArabic ? "left" : "right" }}>
                <p className="text-sm text-zinc-500 mb-2">{t('status')}</p>
                <span
                  className="inline-block px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{
                    backgroundColor:
                      order.status === 'Pending'
                        ? '#e2a56e'
                        : order.status === 'Paid'
                          ? '#1f6f78'
                          : order.status === 'Shipped'
                            ? '#2b1b13'
                            : order.status === 'Delivered'
                              ? '#3e4b3a'
                              : order.status === 'Cancelled'
                                ? '#a3291c'
                                : '#cccccc',
                  }}
                >
                  {t(`orderStatus.${order.status.toLowerCase()}`)}
                </span>
              </div>
            </div>
          </div>

          {/* Tracking Bar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 mb-8 shadow-sm overflow-visible">
            {isCancelled ? (
              <div className={`flex items-center justify-center gap-3 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg ${isArabic ? "flex-row-reverse" : ""}`}>
                <XCircle size={32} />
                <div style={{ textAlign: isArabic ? "right" : "left" }}>
                  <h3 className="font-bold text-lg">{t('orderTracking.orderCancelled')}</h3>
                  <p className="text-sm opacity-80">{t('orderTracking.orderCancelledDesc')}</p>
                </div>
              </div>
            ) : (
              <div className="relative py-12 px-2">
                {/* Background line */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                
                {/* Progress line */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-1 transition-all duration-500 rounded-full"
                  style={{
                    backgroundColor: TEAL_COLOR,
                    [isArabic ? "right" : "left"]: 0,
                    width: `${statusIndex >= 0 ? (statusIndex / (STEPS.length - 1)) * 100 : 0}%`,
                  }}
                ></div>

                {/* Steps */}
                <div className={`relative z-10 flex ${isArabic ? "flex-row-reverse" : ""} justify-between w-full`}>
                  {STEPS.map((step, index) => {
                    const isCompleted = index <= statusIndex
                    const isCurrent = index === statusIndex
                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 text-white bg-white dark:bg-zinc-900 relative z-20`}
                          style={{
                            backgroundColor: isCompleted ? TEAL_COLOR : '#ffffff',
                            borderColor: isCompleted ? TEAL_COLOR : '#e5e7eb',
                            color: isCompleted ? '#ffffff' : '#a3a3a3',
                          }}
                        >
                          {isCompleted ? <CheckCircle size={18} /> : <div className="w-2 h-2 rounded-full bg-zinc-300" />}
                        </div>
                        <span
                          className="mt-3 text-sm font-medium text-center"
                          style={{
                            color: isCurrent ? TEAL_COLOR : isCompleted ? '#1f2937' : '#a3a3a3',
                            maxWidth: '80px',
                            wordWrap: 'break-word',
                          }}
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
                  <Package size={20} style={{ color: '#1f6f78' }} />
                  {order.items?.length === 1 ? t('products') : t('productsPlural')}
                </h3>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className={`py-4 flex items-start gap-4 first:pt-0 last:pb-0 ${isArabic ? "flex-row-reverse" : ""}`}>
                      <div style={{ textAlign: isArabic ? "right" : "left", flex: 1 }}>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.productName}</p>
                        <p className="text-sm text-zinc-500">
                          {item.quantity} {t('qty')} × {item.unitPrice} {order.currency}
                        </p>
                      </div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {(item.quantity * item.unitPrice).toFixed(2)} {order.currency}
                      </p>
                    </div>
                  ))}
                </div>
                <div className={`mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4 ${isArabic ? "flex-row-reverse" : ""}`}>
                  <span className="font-medium text-zinc-500" style={{ textAlign: isArabic ? "right" : "left" }}>{t('total')}</span>
                  <span className="text-xl font-bold" style={{ color: '#2b1b13', marginLeft: isArabic ? "auto" : "0", marginRight: isArabic ? "0" : "auto" }}>
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
                  <MapPin size={20} style={{ color: '#1f6f78' }} />
                  {t('shippingAddress')}
                </h3>
                <div style={{ textAlign: isArabic ? "right" : "left" }}>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{order.customerName}</p>
                  <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{order.shippingAddress}</p>
                  <div className="mt-4 text-xs text-zinc-400 space-y-1">
                    <p>{order.customerEmail}</p>
                    <p>{order.customerPhone === 'No Phone' ? t('noPhone') : order.customerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CreditCard size={20} style={{ color: '#1f6f78' }} />
                  {t('payment')}
                </h3>
                <div className="space-y-3">
                  <div className={`flex items-center gap-4 text-sm ${isArabic ? "flex-row-reverse" : ""}`}>
                    <span className="text-zinc-500">{t('method')}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100" style={{ marginLeft: isArabic ? "auto" : "0", marginRight: isArabic ? "0" : "auto" }}>Stripe / Card</span>
                  </div>
                  <div className={`flex items-center gap-4 text-sm ${isArabic ? "flex-row-reverse" : ""}`}>
                    <span className="text-zinc-500">{t('status')}:</span>
                    <span className="font-medium" style={{ color: '#2b1b13', marginLeft: isArabic ? "auto" : "0", marginRight: isArabic ? "0" : "auto" }}>{t(`orderStatus.${order.status.toLowerCase()}`)}</span>
                  </div>
                  {order.paymentTransactionId && (
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800" style={{ textAlign: isArabic ? "right" : "left" }}>
                      <p className="text-xs text-zinc-500 mb-1">{t('transactionId')}</p>
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
