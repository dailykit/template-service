const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const createMoonlightHTML = async data => {
   try {
      const parsed = await JSON.parse(data)
      const { width, height } = parsed;
      const filepath = path.join(__dirname, '/index' + width + 'x' + height + '.html');
      const htmlInput = parsed;
      const templateHtml = fs.readFileSync(filepath, 'utf8');
      const template = handlebars.compile(templateHtml);
      const html = template(htmlInput);
      return html;
   } catch (error) {
      throw Error(error.message)
   }
}

export default createMoonlightHTML;