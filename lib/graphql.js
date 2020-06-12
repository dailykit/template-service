require('dotenv').config()

import { GraphQLClient } from 'graphql-request'

export default new GraphQLClient(process.env.DATAHUB)
