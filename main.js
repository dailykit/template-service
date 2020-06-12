import fs from 'fs'
import express from 'express'
import pdf from 'html-pdf'
const app = express()

app.get('/', async (req, res) => {
   try {
      const { template, data } = req.query
      const parsed = await JSON.parse(template)
      const method = require(`./templates/${parsed.type}/${parsed.name}/index`)
      const result = await method.default(data, template)

      switch (parsed.format) {
         case 'html':
            return res.send(result)
         case 'pdf': {
            return pdf
               .create(result, { width: '5in', height: '6in' })
               .toBuffer((err, buffer) => {
                  if (err) throw Error(err.message)
                  res.type('application/pdf')
                  return res.send(buffer)
               })
         }
         default:
            throw Error('Invalid Format')
      }
   } catch (error) {
      return res.status(400).json({ success: false, error: error.message })
   }
})

const PORT = process.env.PORT || 4000

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))
