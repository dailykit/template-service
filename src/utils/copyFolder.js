const fs = require('fs')
const copyFile = require('./copyFile')
const functions = require('../functions')
const copyFolder = async url => {
   console.log(url)
   try {
      const children = await functions.database.getFolderWithFile(url)
      const result = await Promise.all(
         children.map(async child => {
            console.log(child)
            const path = child.path.replace(process.env.FS_PATH, '')
            if (child.type === 'folder') {
               await copyFolder(path)
            } else {
               await copyFile(path)
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
