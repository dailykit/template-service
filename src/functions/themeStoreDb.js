const { GraphQLClient, gql } = require('graphql-request')
const database = require('./database')
const themeStoreGraphQLClient = new GraphQLClient(
   process.env.THEME_STORE_DATAHUB,
   {
      headers: {
         'x-hasura-admin-secret':
            process.env.THEME_STORE_HASURA_GRAPHQL_ADMIN_SECRET
      }
   }
)
const query = gql`
   query getFileId($path: String!) {
      editor_file(where: { path: { _eq: $path } }) {
         id
      }
   }
`
const queryGetFolderWithFile = gql`
   query getFolderWithFiles($path: String) {
      getFolderWithFiles(path: $path) {
         id
         name
         path
         type
         size
         createdAt
         children {
            id
            name
            path
            type
            size
            createdAt
         }
      }
   }
`
const queryGetLinkedFiles = gql`
   query getLinkedFiles($path: String!) {
      editor_file(where: { path: { _eq: $path } }) {
         linkedCssFiles(order_by: { position: desc_nulls_last }) {
            cssFile {
               path
               id
            }
            position
         }
         linkedJsFiles(order_by: { position: desc_nulls_last }) {
            jsFile {
               path
               id
            }
            position
         }
      }
   }
`

const getFileId = async path => {
   const variables = {
      path
   }

   const data = await themeStoreGraphQLClient.request(query, variables)
   if (
      // if fileId exist then return the file id
      Object.keys(data).length &&
      data.editor_file.length &&
      data.editor_file[0].id
   ) {
      return data.editor_file[0].id
   } else {
      // if fileId not exist save the file in datahub and then return the fileId
      const id = await database.createFileRecord(path)
      return id
   }
}
const getFolderWithFile = async path => {
   const variables = {
      path
   }

   const data = await themeStoreGraphQLClient.request(
      queryGetFolderWithFile,
      variables
   )
   if (
      // if children exist then return the children array
      Object.keys(data).length &&
      Object.keys(data.getFolderWithFiles).length &&
      data.getFolderWithFiles.children.length
   ) {
      return data.getFolderWithFiles.children
   } else {
      // if children doesn't exist then return null
      return []
   }
}

const getLinkedFiles = async path => {
   const variables = {
      path
   }
   const data = await themeStoreGraphQLClient.request(
      queryGetLinkedFiles,
      variables
   )
   if (Object.keys(data).length && data.editor_file.length) {
      const linkedCssFiles = data.editor_file[0].linkedCssFiles.map(file => {
         return {
            path: file.cssFile.path,
            id: file.cssFile.id,
            position: file.position
         }
      })
      const linkedJsFiles = data.editor_file[0].linkedJsFiles.map(file => {
         return {
            path: file.jsFile.path,
            id: file.jsFile.id,
            position: file.position
         }
      })
      return {
         linkedCssFiles,
         linkedJsFiles
      }
   } else {
      return {
         linkedCssFiles: [],
         linkedJsFiles: []
      }
   }
}

module.exports = {
   getFileId,
   getFolderWithFile,
   getLinkedFiles
}
