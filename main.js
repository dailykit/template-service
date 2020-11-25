require('dotenv').config()
import fs from 'fs'
import express from 'express'
import puppeteer from 'puppeteer'
const app = express()

const { ApolloServer } = require('apollo-server-express')
const cors = require('cors')
const depthLimit = require('graphql-depth-limit')
// const http = require('http')

// Import Schema
const schema = require('./src/schema/schema')

const PORT = process.env.PORT || 4000
const isProd = process.env.NODE_ENV === 'production' ? true : false

const apolloserver = new ApolloServer({
   schema,
   playground: {
      endpoint: `${process.env.ENDPOINT}:${PORT}/graphql`
   },
   introspection: isProd ? false : true,
   validationRules: [depthLimit(11)],
   formatError: err => {
      if (err.message.includes('ENOENT'))
         return isProd ? new Error('No such folder or file exists!') : err
      return isProd ? new Error(err) : err
   },
   debug: isProd ? false : true,
   context: {
      root: process.env.FS_PATH,
      media: process.env.MEDIA_PATH
   }
})

apolloserver.applyMiddleware({ app })

// const httpServer = http.createServer(app)
// apolloserver.installSubscriptionHandlers(httpServer)

app.use(cors({ origin: '*' }))

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
            const browser = await puppeteer.launch({
               args: ['--no-sandbox', '--disable-setuid-sandbox']
            })
            const page = await browser.newPage()
            await page.setContent(result)
            const buffer = await page.pdf({
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
