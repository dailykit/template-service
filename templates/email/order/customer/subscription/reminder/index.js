import pug from 'pug'
import moment from 'moment-timezone'
import client from '../../../../../../lib/graphql'

const normalizeAddress = address => {
   if (!address) return ''
   let result = ''
   if (address.line1) result += `${address.line1}, `
   if (address.line2) result += `${address.line2}, `
   if (address.city) result += `${address.city}, `
   if (address.state) result += `${address.state}, `
   if (address.country) result += `${address.country}, `
   if (address.zipcode) result += `${address.zipcode}`
   return result
}

const reminder_email = async data => {
   try {
      const parsed = await JSON.parse(data)
      const {
         subscriptionOccurences: [
            {
               fulfillmentDate,
               cutoffTimeStamp,
               subscription: {
                  subscriptionItemCount: {
                     count,
                     subscriptionServing: {
                        servingSize,
                        subscriptionTitle: { title }
                     }
                  }
               }
            }
         ]
      } = await client.request(SUBSCRIPTION_DETAILS, {
         id: parsed.subscriptionOccurenceId
      })

      const subscriptionDetails = {
         deliveryDate: moment(fulfillmentDate).format('ddd, DD MMM, YYYY'),
         cutOffTimeStamp: moment(cutoffTimeStamp).format(
            'ddd, DD MMM, YYYY HH:MMA'
         ),
         count,
         servingSize,
         title
      }

      const {
         brandCustomer: {
            customer: {
               platform_customer: {
                  firstName,
                  lastName,
                  defaultCustomerAddress = {}
               }
            }
         }
      } = await client.request(CUSTOMER_DETAILS, {
         id: parsed.brand_customerId
      })

      const customerDetails = {
         name: firstName + lastName,
         address: normalizeAddress(defaultCustomerAddress)
      }

      const compiler = await pug.compileFile(__dirname + '/index.pug')

      const response = await compiler({
         subscriptionDetails,
         customerDetails
      })
      return response
   } catch (error) {
      throw error
   }
}

export default reminder_email

const CUSTOMER_DETAILS = `query CustomerDetails($id: Int!) {
  brandCustomer(id: $id) {
    customer {
      platform_customer {
        firstName
        lastName
        defaultCustomerAddress {
          city
          country
          additionalInfo
          landmark
          line1
          line2
          state
          zipcode
          lng
          notes
          lat
          label
          id
        }
      }
    }
  }
}`

const SUBSCRIPTION_DETAILS = `query SubscriptionDetails($id: Int!) {
  subscriptionOccurences(where: {id: {_eq: $id}}) {
   fulfillmentDate
    cutoffTimeStamp
    subscription {
      subscriptionItemCount {
        count
        subscriptionServing {
          servingSize
          subscriptionTitle {
            title
          }
        }
      }
    }
  }
}
`
