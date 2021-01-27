require('dotenv').config()
import fs from 'fs'
import express from 'express'
import puppeteer from 'puppeteer'
import axios from 'axios'
const app = express()
const { ApolloServer } = require('apollo-server-express')
const cors = require('cors')
const depthLimit = require('graphql-depth-limit')
// const http = require('http')

// Import Schema
const flatten = require('./src/utils/flatten')
const checkExist = require('./src/utils/checkExist')
const copyFolder = require('./src/utils/copyFolder')
const schema = require('./src/schema/schema')
const functions = require('./src/functions')
const PORT = process.env.PORT || 4000
const isProd = process.env.NODE_ENV === 'production' ? true : false

const apolloserver = new ApolloServer({
   schema,
   playground: {
      endpoint: `${process.env.ENDPOINT}/graphql`
   },
   introspection: true,
   validationRules: [depthLimit(11)],
   formatError: err => {
      console.log(err)
      if (err.message.includes('ENOENT'))
         return isProd ? new Error('No such folder or file exists!') : err
      return isProd ? new Error(err) : err
   },
   debug: true,
   context: {
      root: process.env.FS_PATH,
      media: process.env.MEDIA_PATH
   }
})

apolloserver.applyMiddleware({ app })

// const httpServer = http.createServer(app)
// apolloserver.installSubscriptionHandlers(httpServer)

app.use(cors({ origin: '*' }))
app.use('/files', express.static('templates'))

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

app.get('/download/template/:path(*)', async (req, res) => {
   try {
      const src = `/${req.params.path}`
      const dest = await checkExist(src)
      const result = await copyFolder(src, dest)
      res.send(result)
   } catch (err) {
      console.log(err)
   }
})

// app.get('/getfile/:path(*)', async (req, res) => {
//    try {
//       const filePath = req.params.path
//       console.log(filePath)
//       const method = fs.readFileSync(`./templates/${filePath}`, 'utf-8')
//       return res.send(method)
//    } catch (err) {
//       return res.send(err)
//    }
// })

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))
