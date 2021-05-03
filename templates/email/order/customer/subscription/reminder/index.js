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
      console.log(data, typeof data.subscriptionOccurenceId)
      const { subscriptionOccurences } = await client.request(
         SUBSCRIPTION_DETAILS,
         {
            id: data.subscriptionOccurenceId
         }
      )

      if (subscriptionOccurences.length === 0)
         return res.status(200).json({
            success: false,
            message: `No subscription occurence linked to id ${subscriptionOccurenceId}`
         })

      const [occurence] = subscriptionOccurences
      const {
         fulfillmentDate,
         cutoffTimeStamp,
         subscription: {
            subscriptionItemCount: {
               count,
               subscriptionServing: {
                  servingSize,
                  subscriptionTitle: { title } = {}
               } = {}
            } = {}
         } = {}
      } = occurence

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
            brand: { contact, brand },
            customer: {
               platform_customer: {
                  firstName,
                  lastName,
                  defaultCustomerAddress = {}
               }
            }
         }
      } = await client.request(CUSTOMER_DETAILS, {
         id: parseInt(data.brand_customerId)
      })

      if (contact.length === 0)
         return res.status(200).json({
            success: false,
            message: `No contact details linked to brand customer id ${data.brand_customerId}`
         })

      const [{ contactDetails }] = contact

      if (brand.length === 0)
         return res.status(200).json({
            success: false,
            message: `No brand details linked to brand customer id ${data.brand_customerId}`
         })

      const [{ brandSiteDetails }] = brand

      const customerDetails = {
         name: firstName + ' ' + lastName,
         address: normalizeAddress(defaultCustomerAddress)
      }

      const brandDetails = {
         name: brandSiteDetails.name,
         logo: brandSiteDetails.logo.url,
         email: contactDetails.email,
         phone: contactDetails.phoneNo
      }

      if (readVar === true) {
         return JSON.stringify({
            subscriptionDetails,
            customerDetails,
            brandDetails
         })
      }

      if (readAlias === true) {
         return `{
            subscriptionDetails {
               deliveryDate,
               cutOffTimeStamp,
               count,
               servingSize,
               title,
               siteUrl
            }
            customerDetails{
               name,
               address
            }
            brandDetails {
               name,
               logo,
               email,
               phone
            }
         }`
      }

      const compiler = await pug.compileFile(
         __dirname + `/${data.emailTemplateFileName}.pug`
      )

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
