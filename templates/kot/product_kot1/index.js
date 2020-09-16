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
         id: id,
         assemblyStationId: {
            _in: station.ids
         }
      })

      const inventories = order.orderInventory.nodes.map(node => {
         const object = {
            name: node.inventoryProduct.name,
            quantity: node.quantity * node.inventoryProductOption.quantity
         }

         if (node.comboProductId) {
            object.name += ` - ${node.comboProduct.name}`
         }
         if (node.comboProductComponentId) {
            object.name += ` (${node.comboProductComponent.label})`
         }
         if (node.inventoryProductOption.label) {
            object.name += ` - ${node.inventoryProductOption.label}`
         }

         if (node.assemblyStationId) {
            object.station = node.assemblyStation.name
         }

         if (node.inventoryProduct.supplierItemId) {
            if (node.inventoryProduct.supplierItem.supplierId) {
               object.supplier = {
                  name: node.inventoryProduct.supplierItem.supplier.name
               }
            }
            object.supplier = {
               ...object.supplier,
               item: {
                  name: node.inventoryProduct.supplierItem.name
               }
            }
         }

         if (node.inventoryProduct.sachetItemId && object.supplier.item.name) {
            object.supplier.item.name += ` - ${node.inventoryProduct.sachetItem.unitSize}${node.inventoryProduct.sachetItem.unit}`
         }

         return object
      })

      const mealKits = order.orderMealKit.nodes.map(node => {
         let name = node.simpleRecipeProduct.name
         if (node.comboProductId) {
            name += ` - ${node.comboProduct.name}`
         }
         if (node.comboProductComponentId) {
            name += ` (${node.comboProductComponent.label})`
         }
         return {
            name,
            quantity: node.quantity,
            serving: node.simpleRecipeProductOption.yield.serving,
            ...(node.assemblyStationId && {
               station: node.assemblyStation.name
            })
         }
      })

      const readyToEats = order.orderReadyToEat.nodes.map(node => {
         let name = node.simpleRecipeProduct.name
         if (node.comboProductId) {
            name += ` - ${node.comboProduct.name}`
         }
         if (node.comboProductComponentId) {
            name += ` (${node.comboProductComponent.label})`
         }
         return {
            name,
            quantity: node.quantity,
            serving: node.simpleRecipeProductOption.yield.serving,
            ...(node.assemblyStationId && {
               station: node.assemblyStation.name
            })
         }
      })

      let productType = ''

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
         mealKits,
         inventories,
         readyToEats,
         productType,
         fulfillmentType,
         customer: order.customer
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

const ORDER = `
   query order($id: oid!, $assemblyStationId: Int_comparison_exp!) {
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
