require('dotenv').config()

import { GraphQLClient } from 'graphql-request'

export default new GraphQLClient(process.env.DATAHUB, {
   headers: {
      'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET
   }
})
