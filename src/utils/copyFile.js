const axios = require('axios')
const functions = require('../functions')
const checkExist = require('./checkExist')

const copyFile = async path => {
   try {
      const { data } = await axios.get(
         `https://test.dailykit.org/template/files${path}`
      )

      const url = await checkExist(path)
      console.log(url)
      await functions.files.createFile(
         `${process.env.FS_PATH}${process.env.MARKET_PLACE_PATH}${url}`,
         data
      )
      const fileId = await functions.database.createFileRecord(
         `${process.env.MARKET_PLACE_PATH}${path}`
      )
      const {
         linkedCssFiles,
         linkedJsFiles
      } = await functions.database.getLinkedFiles(path)
      console.log({
         linkedCssFiles,
         linkedJsFiles
      })
      if (linkedCssFiles.length) {
         linkedCssFiles.forEach(async cssPath => {
            await copyFile(cssPath.path)
            const cssId = await functions.database.getFileId(
               `${process.env.MARKET_PLACE_PATH}${cssPath.path}`
            )
            await functions.database.createCsslinkRecord({
               guiFileId: fileId,
               cssFileId: cssId,
               position: cssPath.position
            })
         })
      }
      if (linkedJsFiles.length) {
         linkedJsFiles.forEach(async jsPath => {
            await copyFile(jsPath.path)
            const jsId = await functions.database.getFileId(
               `${process.env.MARKET_PLACE_PATH}${jsPath.path}`
            )
            await functions.database.createJslinkRecord({
               guiFileId: fileId,
               jsFileId: jsId,
               position: jsPath.position
            })
         })
      }
   } catch (error) {
      console.log(error)
   }
}

module.exports = copyFile
