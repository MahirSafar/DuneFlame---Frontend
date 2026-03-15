/**
 * Express Checkout Types (Apple Pay / Google Pay)
 */

export interface ExpressCheckoutShippingAddress {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
}

export interface ShippingOption {
  id: string
  label: string
  detail: string
  amount: number
}

export interface ExpressCheckoutPayload {
  basketId: string
  shippingAddress: ExpressCheckoutShippingAddress
  currency: string
  email: string
  name: string
  shipping: {
    addressId: string
    amount: number
    label: string
  }
  languageCode: string
}

export interface ExpressCheckoutError {
  type: 'shipping' | 'payment' | 'validation' | 'network'
  message: string
  code?: string
}
