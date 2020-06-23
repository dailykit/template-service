import fs from 'fs'
import express from 'express'
import puppeteer from 'puppeteer'
const app = express()

const createImage = async function (html, nameOfImage = 'image') {
   nameOfImage = './output/' + nameOfImage + '.jpeg'
   await nodeHtmlToImage({
      output: nameOfImage,
      html: html
   })
      .then(() => console.log('The image was created successfully!'))

}

const createVideo = async function (html) {
   const images = getFiles('./output');
   await videoshow(images)
      .save('video.mp4')
      .on('start', function () {
         console.log("started")
      })
      .on('error', function (err, stdout, stderr) {
         console.error('Error:', err)
         console.error('ffmpeg stderr:', stderr)
      })
      .on('end', function (output) {
         console.error('Video created in:', output)
      })
}

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
            await page.setContent(result, { waitUntil: 'networkidle0' })
            const buffer = await page.pdf({
               width: parsed.size.width,
               height: parsed.size.height,
               // width: "29.7cm",
               // height: "21cm",
               path: `${parsed.type}.pdf`
            })
            await browser.close()
            fs.unlinkSync(`${parsed.type}.pdf`)
            res.type('application/pdf')
            return res.send(buffer)
         }
         case 'image':
            createImage(result);
            break;
         case 'video':
            createVideo(result);
            break;
         default:
            throw Error('Invalid Format')
      }
   } catch (error) {
      return res.status(400).json({ success: false, error: error.message })
   }
})

const PORT = process.env.PORT || 4000

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))
