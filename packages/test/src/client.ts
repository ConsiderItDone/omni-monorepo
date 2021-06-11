import { GraphQLClient } from 'graphql-request'

export const client = new GraphQLClient(process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql', { headers: {} })
