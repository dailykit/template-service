import pug from 'pug'
import QR from 'qrcode'

import client from '../../../lib/graphql'

const label = async data => {
   try {
      const parsed = await JSON.parse(data)

      const { cartItems = [] } = await client.request(SACHET, {
         id: { _eq: parsed.id }
      })

      if (cartItems.length === 0) return
      const [cartItem] = cartItems

      const qrCode = await QR.toDataURL(
         JSON.stringify({
            type: cartItem.productOptionType,
            sachet_id: parsed.id,
            product_id: cartItem.parentCartItemId,
            order_id: cartItem.cart.orderId
         })
      )

      const compiler = await pug.compileFile(__dirname + '/index.pug')

      const response = await compiler({
         ...cartItem,
         name: cartItem.displayName.split('->').pop().trim(),
         qrCode
      })
      return response
   } catch (error) {
      throw Error(error.message)
   }
}

export default label

const SACHET = `
   query cartItems($id: Int_comparison_exp!) {
      cartItems: order_cartItemView(where: { id: $id }) {
         id
         levelType
         displayName
         cartItemType
         displayUnit
         processingName
         productOptionType
         parentCartItemId
         displayUnitQuantity
         cart {
            orderId
         }
         product {
            id
            name
         }
         productOption {
            quantity
            label
         }
      }
   }
`
