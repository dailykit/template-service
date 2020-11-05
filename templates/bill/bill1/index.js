import pug from 'pug'
import client from '../../../lib/graphql'

const ORDER = `
   query order($id: oid!) {
      order(id: $id) {
         id
         tax
         discount
         currency
         itemTotal
         created_at
         amountPaid
         deliveryInfo
         deliveryPrice
         orderCart {
            cartSource
            brandId
         }
         orderInventoryProducts {
            price
            inventoryProduct {
               name
            }
         }
         orderReadyToEatProducts {
            price
            simpleRecipeProduct {
               name
            }
         }
         orderMealKitProducts {
            price
            simpleRecipeProduct {
               name
            }
         }
      }
   }
`

const BRAND_ON_DEMAND_SETTING = `
   query brand($id: Int!) {
      brand(id: $id) {
         brand: onDemandSettings(
            where: { onDemandSetting: { identifier: { _eq: "Brand Name" } } }
         ) {
            value
         }
         address: onDemandSettings(
            where: { onDemandSetting: { identifier: { _eq: "Location" } } }
         ) {
            value
         }
         contact: onDemandSettings(
            where: { onDemandSetting: { identifier: { _eq: "Contact" } } }
         ) {
            value
         }
      }
   }
`

export const BRAND_SUBSCRIPTION_SETTING = `
   query brand($id: Int!) {
      brand(id: $id) {
         brand: subscriptionStoreSettings(
            where: {
               subscriptionStoreSetting: { identifier: { _eq: "theme-brand" } }
            }
         ) {
            name: value(path: "name")
         }
         address: subscriptionStoreSettings(
            where: {
               subscriptionStoreSetting: { identifier: { _eq: "Location" } }
            }
         ) {
            value
         }
         contact: subscriptionStoreSettings(
            where: {
               subscriptionStoreSetting: { identifier: { _eq: "Contact" } }
            }
         ) {
            value
         }
      }
   }
`

const normalizeAddress = address => {
   if (!address) return ''
   let result = ''
   if (address.line1) result += `${address.line1}, `
   if (address.line2) result += `${address.line2}, `
   if (address.city) result += `${address.city}, `
   if (address.state) result += `${address.state}, `
   if (address.country) result += `${address.country}, `
   if (address.zipcode) result += `${address.zipcode}, `
   return result
}

const bill = async data => {
   try {
      const parsed = await JSON.parse(data)

      const { order } = await client.request(ORDER, {
         id: parsed.id.toString()
      })

      const settings = {
         brand: {
            name: ''
         },
         address: {},
         contact: {
            phoneNo: '',
            email: ''
         }
      }
      if (order.orderCart.cartSource === 'a-la-carte') {
         const { brand = {} } = client.request(BRAND_ON_DEMAND_SETTING, {
            id: order.orderCart.brandId
         })
         if ('brand' in brand) {
            settings.brand = brand.brand.length > 0 ? brand.brand[0].value : {}
         }
         if ('contact' in brand) {
            settings.contact =
               brand.contact.length > 0 ? brand.contact[0].value : {}
         }
         if ('address' in brand) {
            const address =
               brand.address.length > 0 ? brand.address[0].value : {}
            if ('address' in address) {
               settings.address = address
            }
         }
      } else if (order.orderCart.cartSource === 'subscription') {
         const { brand = {} } = client.request(BRAND_SUBSCRIPTION_SETTING, {
            id: order.orderCart.brandId
         })
         if ('brand' in brand) {
            settings.brand = brand.brand.length > 0 ? brand.brand[0].value : {}
         }
         if ('contact' in brand) {
            settings.contact =
               brand.contact.length > 0 ? brand.contact[0].value : {}
         }
         if ('address' in brand) {
            settings.address =
               brand.address.length > 0 ? brand.address[0].value : {}
         }
      }

      const {
         customerPhone,
         customerAddress
      } = order.deliveryInfo.dropoff.dropoffInfo

      const compiler = await pug.compileFile(__dirname + '/index.pug')

      const response = await compiler({
         id: parsed.id,
         tax: `$${order.tax}`,
         customerPhone: customerPhone,
         discount: `$${order.discount}`,
         restaurant: settings.brand.name,
         orgPhone: settings.contact.phoneNo,
         amountPaid: `$${order.amountPaid || ''}`,
         deliveryPrice: `$${order.deliveryPrice}`,
         orgAddress: normalizeAddress(settings.address),
         customerAddress: normalizeAddress(customerAddress),
         items: [
            ...order.orderMealKitProducts.map(product => ({
               title: product.simpleRecipeProduct.name,
               price: `$${product.price}`
            })),
            ...order.orderInventoryProducts.map(product => ({
               title: product.inventoryProduct.name,
               price: `$${product.price}`
            })),
            ...order.orderReadyToEatProducts.map(product => ({
               title: product.simpleRecipeProduct.name,
               price: `$${product.price}`
            }))
         ]
      })
      return response
   } catch (error) {
      console.log('error', error)
      throw Error(error.message)
   }
}

export default bill
