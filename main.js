import fs from 'fs'
import express from 'express'
import puppeteer from 'puppeteer'
const videoshow = require('videoshow')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
var ffprobe = require('ffprobe-static');
ffmpeg.setFfprobePath(ffprobe.path);
const nodeHtmlToImage = require('node-html-to-image')
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
   //const images = getFiles('./output');
   const images = [
      './assets/images/page1.png',
      './assets/images/page2.png',
   ]
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
               // width: parsed.size.width,
               // height: parsed.size.height,
               width: "10cm",
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
            return res.send(result)
            break;
         case 'video':
            createVideo(result);
            return res.send(result)
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
