const fs = require('fs')
const copyFile = require('./copyFile')
const functions = require('../functions')
const copyFolder = async (src, dest) => {
   console.log(src, dest)
   try {
      const children = await functions.themeStoreDb.getFolderWithFile(src)
      const result = await Promise.all(
         children.map(async child => {
            // console.log(child)
            const path = child.path.replace(process.env.FS_PATH, '')
            if (child.type === 'folder') {
               await copyFolder(path, `${path.replace(src, dest)}`)
            } else {
               await copyFile(path, `${path.replace(src, dest)}`)
            }
         })
      )
      return result
      // console.log(children)
   } catch (error) {
      return new Error(error)
   }
}

module.exports = copyFolder
