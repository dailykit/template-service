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

const ORGANIZATION = `
   query restaurant{
      address: storeSettings(where: {identifier: {_eq: "Location"}}) {
         value
      }
      contact: storeSettings(where: {identifier: {_eq: "Contact"}}) {
         value
      }
      title: storeSettings(where: {identifier: {_eq: "Brand Name"}}) {
         value
      }
   }
`

const bill = async data => {
   try {
      const parsed = await JSON.parse(data)
      const { order } = await client.request(ORDER, {
         id: parsed.id.toString()
      })
      const { address, contact, title } = await client.request(ORGANIZATION)
      const { address: orgAddress } = address[0].value
      const { phoneNo: orgPhoneNo } = contact[0].value
      const { name: orgName } = title[0].value

      const {
         customerPhone,
         customerAddress
      } = order.deliveryInfo.dropoff.dropoffInfo
      const compiler = await pug.compileFile(__dirname + '/index.pug')
      const response = await compiler({
         id: parsed.id,
         restaurant: orgName,
         orgPhone: orgPhoneNo,
         tax: `$${order.tax}`,
         customerPhone: customerPhone,
         discount: `$${order.discount}`,
         amountPaid: `$${order.amountPaid}`,
         deliveryPrice: `$${order.deliveryPrice}`,
         orgAddress: `${orgAddress.line1}, ${orgAddress.line2}, ${orgAddress.city}, ${orgAddress.state}, ${orgAddress.zip}`,
         customerAddress: `${customerAddress.line1}, ${customerAddress.line2}, ${customerAddress.city}, ${customerAddress.state}, ${customerAddress.country}, ${customerAddress.zipcode}`,
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
      throw Error(error.message)
   }
}

export default bill
