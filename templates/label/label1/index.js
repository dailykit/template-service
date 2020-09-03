import pug from 'pug'
import QR from 'qrcode'

const label = async data => {
   try {
      const parsed = await JSON.parse(data)

      const qrCode = await QR.toDataURL(
         JSON.stringify({
            sachet: { id: parsed.id },
            product: { id: parsed.product.id }
         })
      )

      const compiler = await pug.compileFile(__dirname + '/index.pug')

      const response = await compiler({
         ...parsed,
         qrCode
      })
      return response
   } catch (error) {
      throw Error(error.message)
   }
}

export default label
