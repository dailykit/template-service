import pug from 'pug'
import client from '../../../lib/graphql'

const format_currency = (amount = 0) =>
   new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: process.env.CURRENCY
   }).format(amount)

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

const order_new = async data => {
   try {
      const parsed = await JSON.parse(data)

      const { order } = await client.request(ORDER, {
         id: parsed.id.toString()
      })

      const settings = {
         brand: {
            name: '',
            logo: ''
         },
         address: '',
         contact: {
            phoneNo: '',
            email: ''
         }
      }
      if (order.orderCart.cartSource === 'a-la-carte') {
         const { brand = {} } = await client.request(BRAND_ON_DEMAND_SETTING, {
            id: order.orderCart.brandId
         })
         if ('name' in brand) {
            settings.brand.name =
               brand.name.length > 0 ? brand.name[0].name : {}
         }
         if ('logo' in brand) {
            settings.brand.logo = brand.logo.length > 0 ? brand.logo[0].url : {}
         }
         if ('contact' in brand) {
            settings.contact =
               brand.contact.length > 0 ? brand.contact[0].value : {}
         }
         if ('address' in brand) {
            const address =
               brand.address.length > 0 ? brand.address[0].value : {}
            settings.address = normalizeAddress(address)
         }
      } else if (order.orderCart.cartSource === 'subscription') {
         const { brand = {} } = await client.request(
            BRAND_SUBSCRIPTION_SETTING,
            {
               id: order.orderCart.brandId
            }
         )
         if ('brand' in brand) {
            settings.brand = brand.brand.length > 0 ? brand.brand[0].value : {}
         }
         if ('contact' in brand) {
            settings.contact =
               brand.contact.length > 0 ? brand.contact[0].value : {}
         }
         if ('address' in brand) {
            settings.address =
               brand.address.length > 0
                  ? normalizeAddress(brand.address[0].value)
                  : {}
         }
      }

      const {
         customerPhone,
         customerAddress,
         customerFirstName,
         customerLastName
      } = order.deliveryInfo.dropoff.dropoffInfo

      const compiler = await pug.compileFile(__dirname + '/index.pug')

      const items = [
         ...order.orderMealKitProducts.map(product => ({
            title: product.simpleRecipeProduct.name,
            price: format_currency(Number(product.price) || 0)
         })),
         ...order.orderInventoryProducts.map(product => ({
            title: product.inventoryProduct.name,
            price: format_currency(Number(product.price) || 0)
         })),
         ...order.orderReadyToEatProducts.map(product => ({
            title: product.simpleRecipeProduct.name,
            price: format_currency(Number(product.price) || 0)
         }))
      ]

      const response = await compiler({
         items,
         id: parsed.id,
         restaurant: settings,
         customer: {
            phone: customerPhone,
            first_name: customerFirstName,
            last_name: customerLastName,
            address: normalizeAddress(customerAddress)
         },
         tax: format_currency(Number(order.tax) || 0),
         discount: format_currency(Number(order.discount) || 0),
         itemTotal: format_currency(Number(order.itemTotal) || 0),
         amountPaid: format_currency(Number(order.amountPaid) || 0),
         deliveryPrice: format_currency(Number(order.deliveryPrice) || 0),
         isPickup: ['PREORDER_PICKUP', 'ONDEMAND_PICKUP'].includes(
            order.fulfillmentType
         )
      })
      return response
   } catch (error) {
      throw Error(error.message)
   }
}

export default order_new

const ORDER = `
   query order($id: oid!) {
      order(id: $id) {
         id
         tax
         itemTotal
         discount
         currency
         itemTotal
         created_at
         amountPaid
         deliveryInfo
         deliveryPrice
         fulfillmentType
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
         name: onDemandSettings(where: {onDemandSetting: {identifier: {_eq: "Brand Name"}}}) {
            name: value(path:"name")
         }
         logo: onDemandSettings(where: {onDemandSetting: {identifier: {_eq: "Brand Logo"}}}) {
            url: value(path:"url")
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
            logo: value(path: "logo.url")
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
