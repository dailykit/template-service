import fs from 'fs'
import express from 'express'
import puppeteer from 'puppeteer'
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
            const browser = await puppeteer.launch({ignoreDefaultArgs: ['--disable-extensions']})
            const page = await browser.newPage()
            await page.setContent(result)
            const buffer = await page.pdf({
               width: '10cm',
               path: `${parsed.type}.pdf`
            })
            await browser.close()
            fs.unlinkSync(`${parsed.type}.pdf`)
            res.type('application/pdf')
            return res.send(buffer)
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
