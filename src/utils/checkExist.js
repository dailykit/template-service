const fs = require('fs')
let count = 0
const copyName = async url => {
   try {
      const isExist = fs.existsSync(
         `${process.env.FS_PATH}${process.env.MARKET_PLACE_PATH}${url}`
      )
      if (isExist) {
         count += 1
         let newPath = url.replace(/^\//g, '').split(/\//g)[0]
         if (count <= 1) {
            newPath = newPath.concat(`_${count}`)
         } else {
            newPath = newPath.split('_')[0].concat(`_${count}`)
         }

         console.log(`before if`, newPath, count)
         const result = await copyName(`/${newPath}`)
         console.log(`after if`, newPath, count)
         return result
         //  const checkAgain = copyName()
      } else {
         console.log(`else`, url)
         count = 0
         return url
      }
   } catch (err) {
      return new Error(err)
   }
}

module.exports = copyName
