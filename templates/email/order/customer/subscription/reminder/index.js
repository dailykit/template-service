require('dotenv').config()
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
         id: parseInt(parsed.subscriptionOccurenceId)
      })

      const subscriptionDetails = {
         deliveryDate: moment(fulfillmentDate).format('ddd, DD MMM, YYYY'),
         cutOffTimeStamp: moment(cutoffTimeStamp).format(
            'ddd, DD MMM, YYYY HH:MMA'
         ),
         count,
         servingSize,
         title,
         siteUrl:
            new URL(process.env.DATAHUB).origin + '/subscription/select-menu'
      }

      const {
         brandCustomer: {
            brand: {
               contact: [{ contactDetails }],
               brand: [{ brandSiteDetails }]
            },
            customer: {
               platform_customer: {
                  firstName,
                  lastName,
                  defaultCustomerAddress = {}
               }
            }
         }
      } = await client.request(CUSTOMER_DETAILS, {
         id: parseInt(parsed.brand_customerId)
      })

      const customerDetails = {
         name: firstName + lastName,
         address: normalizeAddress(defaultCustomerAddress)
      }

      const brandDetails = {
         name: brandSiteDetails.name,
         logo: brandSiteDetails.logo.url,
         email: contactDetails.email,
         phone: contactDetails.phoneNo
      }
      const compiler = await pug.compileFile(__dirname + '/index.pug')

      const response = await compiler({
         subscriptionDetails,
         customerDetails,
         brandDetails
      })
      return response
   } catch (error) {
      throw error
   }
}

export default reminder_email

const CUSTOMER_DETAILS = `query CustomerDetails($id: Int!) {
  brandCustomer(id: $id) {
    brand {
      contact: subscriptionStoreSettings(where: {subscriptionStoreSetting: {identifier: {_eq: "Contact"}, type: {_eq: "brand"}}}) {
        contactDetails: value
      }
      brand: subscriptionStoreSettings(where: {subscriptionStoreSetting: {identifier: {_eq: "theme-brand"}, type: {_eq: "brand"}}}) {
        brandSiteDetails: value
      }
    }
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
