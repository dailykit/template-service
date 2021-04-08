import pug from 'pug'

import client from '../../../lib/graphql'

const kot = async data => {
   try {
      const {
         order: { id } = {},
         station = {},
         product = {}
      } = await JSON.parse(data)

      const { order = {} } = await client.request(ORDER, {
         id: id
      })
      const { types = [] } = await client.request(TYPES, {
         id: id,
         ...(station.ids.length > 0 && {
            stationId: {
               _in: station.ids
            }
         })
      })

      let stationName = null

      const list = types.map(type => {
         const object = {
            name: type.title,
            products: []
         }
         object.products = type.cartItemViews_aggregate.nodes.map(item => {
            const result = {
               name: item.displayName.split('->').pop().trim() || '',
               quantity: item.displayUnitQuantity || 1,
               station: 'N/A',
               ...(item.displayServing && { serving: item.displayServing }),
               supplier: {
                  name: 'N/A',
                  item: {
                     name: 'N/A'
                  }
               }
            }

            if (item.operationConfigId) {
               if (item.operationConfig.stationId) {
                  result.station = item.operationConfig.station.name
                  if (station.ids.length === 1) {
                     stationName = item.operationConfig.station.name
                  }
               }
            }

            if (item.supplierItemId) {
               result.supplier.item.name = `${item.supplierItem.name} - ${item.supplierItem.unitSize}${item.supplierItem.unit}`
               if (item.supplierItem.supplierId) {
                  result.supplier.name = item.supplierItem.supplier.name
               }
            }
            return result
         })
         return object
      })

      let productType = 'multiple'

      if (station.ids.length === 1) {
         // if one station
         if (product.types.length === 1) {
            // if one product type
            const { types } = product
            productType = types[0]
         } else if (product.types.length > 1) {
            // if multiple product type
            productType = 'multiple'
         }
      } else if (station.ids.length > 1) {
         // if multiple station
         if (product.types.length === 1) {
            // if one product type
            const { types } = product
            productType = types[0]
         } else if (product.types.length > 1) {
            // if multiple product type
            productType = 'multiple'
         }
      }

      const compiler = await pug.compileFile(__dirname + '/index.pug')

      const readyBy =
         order.readyByTimestamp &&
         new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
         }).format(new Date(order.readyByTimestamp))

      const fulfillmentType = capitalize(
         capitalize(order.fulfillmentType.split('_').join(' '), true)
      )

      const response = await compiler({
         id,
         readyBy,
         productType,
         stationName,
         types: list,
         fulfillmentType,
         customer: order.cart.customer
      })
      return response
   } catch (error) {
      throw Error(error.message)
   }
}

export default kot

const capitalize = (str, lower = false) =>
   (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, match =>
      match.toUpperCase()
   )

const TYPES = `
   query types($id: Int!, $stationId: Int_comparison_exp) {
      types: productOptionTypes(
         where: { cartItemViews: { cart: { orderId: { _eq: $id } } } }
      ) {
         title
         cartItemViews_aggregate(
            where: {
               operationConfig: { stationId: $stationId }
               levelType: { _eq: "orderItem" }
               cart: { orderId: { _eq: $id } }
            }
         ) {
            aggregate {
               count
            }
            nodes {
               id
               displayName
               displayUnit
               displayServing
               displayUnitQuantity
               operationConfigId
               operationConfig {
                  stationId
                  station {
                     id
                     name
                  }
                  packagingId
                  packaging {
                     id
                     name
                  }
               }
               supplierItemId
               supplierItem {
                  supplierId
                  supplier {
                     id
                     name
                  }
                  name: supplierItemName
                  unitSize
                  unit
               }
            }
         }
      }
   }
`

const ORDER = `
   query order($id: oid!, $stationId: Int_comparison_exp) {
      order(id: $id) {
         fulfillmentType
         readyByTimestamp
         cart {
            customer: customerInfo
         }
      }
   }
`

const ORDER1 = `
   query order($id: oid!, $assemblyStationId: Int_comparison_exp) {
      order(id: $id) {
         fulfillmentType
         readyByTimestamp
         customer: deliveryInfo(path: "dropoff.dropoffInfo")
         orderInventory: orderInventoryProducts_aggregate(
            where: { assemblyStationId: $assemblyStationId }
         ) {
            aggregate {
               count(columns: id)
            }
            nodes {
               id
               quantity
               comboProductId
               assemblyStationId
               comboProductComponentId
               assemblyStation {
                 name
               }
               inventoryProduct {
                  id
                  name
                  sachetItemId
                  sachetItem {
                     unit
                     unitSize
                  }
                  supplierItemId
                  supplierItem {
                     id
                     name
                     supplierId
                     supplier {
                        id
                        name
                     }
                  }
               }
               comboProduct {
                  id
                  name
               }
               comboProductComponent {
                  id
                  label
               }
               inventoryProductOption {
                  id
                  label
                  quantity
               }
            }
         }
         orderMealKit: orderMealKitProducts_aggregate(
            where: { assemblyStationId: $assemblyStationId }
         ) {
            aggregate {
               count(columns: id)
            }
            nodes {
               id
               quantity
               comboProductId
               assemblyStationId
               comboProductComponentId
               assemblyStation {
                 name
               }
               simpleRecipeProduct {
                  id
                  name
               }
               comboProduct {
                  id
                  name
               }
               comboProductComponent {
                  id
                  label
               }
               simpleRecipeProductOption {
                  id
                  yield: simpleRecipeYield {
                     serving: yield(path: "serving")
                  }
               }
            }
         }
         orderReadyToEat: orderReadyToEatProducts_aggregate(
            where: { assemblyStationId: $assemblyStationId }
         ) {
            aggregate {
               count(columns: id)
            }
            nodes {
               id
               quantity
               comboProductId
               assemblyStationId
               comboProductComponentId
               assemblyStation {
                 name
               }
               simpleRecipeProduct {
                  id
                  name
               }
               comboProduct {
                  id
                  name
               }
               comboProductComponent {
                  id
                  label
               }
               simpleRecipeProductOption {
                  id
                  yield: simpleRecipeYield {
                     serving: yield(path: "serving")
                  }
               }
            }
         }
      }
   }
`
