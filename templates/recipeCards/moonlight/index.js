import client from '../../../lib/graphql'

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const utils = require('util')
const readFile = utils.promisify(fs.readFile)

const filepath = path.join(__dirname, '/a4.html');
const GET_RECIPE = `
query MyQuery($simpleRecipeId: Int!, $simpleRecipeYieldId: Int!) {
   simpleRecipe(id: $simpleRecipeId) {
     assets
     author
     cookingTime
     cuisine
     description
     id
     name
     procedures
     type
     utensils
     simpleRecipeYields(where: {id: {_eq: $simpleRecipeYieldId}}) {
       ingredientSachets_aggregate {
         aggregate {
           count
         }
         nodes {
           slipName
         }
       }
     }
   }
 }
`
const tempData =
{
   assets: null,
   author: 'Rishi',
   cookingTime: '50',
   cuisine: 'El Salvadorian',
   description: 'Demoooo',
   id: 8,
   name: 'Test Recipe',
   procedures: [
      {
         steps: [{ title: 'Step 1', isVisible: false, description: 'Gather stuff' },
         { title: 'Step 2', isVisible: false, description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.' },
         { title: 'Step 3', isVisible: false, description: 'Gather stuff' }
         ], title: 'Procurementnn'
      },
      {
         steps: [{ title: 'Step 1', isVisible: true, description: 'Yeah' },
         { title: 'Step 2', isVisible: false, description: 'Gather stuff yeah' },
         { title: 'Step 3', isVisible: false, description: 'Gather stuff yeah' },
         { title: 'Step 4', isVisible: false, description: 'Gather stuff yeah' },
         { title: 'Step 2', isVisible: false, description: 'Gather stuff yeah' }
         ], title: 'Throw everything'
      },
      {
         steps: [{ title: 'Step 1', isVisible: true, description: 'Yeah' },

         ], title: 'Throw everything'
      }
   ],
   type: 'Vegetarian',
   utensils: ['Pan', 'Spoon', 'Plate'],
   simpleRecipeYields: [{
      ingredientSachets_aggregate:
      {
         aggregate: { count: 2 },
         nodes: [{ slipName: 'slip name 1' }, { slipName: 'slip name 2' }, { slipName: 'slip name 3' }, { slipName: 'slip name 4' },
         { slipName: 'slip name 1' }, { slipName: 'slip name 2' }, { slipName: 'slip name 3' }, { slipName: 'slip name 4' },
         { slipName: 'slip name 1' }, { slipName: 'slip name 2' }, { slipName: 'slip name 3' }, { slipName: 'slip name 4' },
         { slipName: 'slip name 1' }, { slipName: 'slip name 2' }, { slipName: 'slip name 3' }, { slipName: 'slip name 4' },
         { slipName: 'slip name 1' }, { slipName: 'slip name 2' }
         ]
      }

   }]
};


const createMoonlightHTML = async data => {
   try {
      const parsed = await JSON.parse(data)
      const htmlInput = await client.request(GET_RECIPE, {
         simpleRecipeId: parsed.simpleRecipeId.toString(),
         simpleRecipeYieldId: parsed.simpleRecipeYieldId.toString()
      });
      handlebars.registerHelper('json', function (context) {
         return JSON.stringify(context);
      });
      handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

         switch (operator) {
            case '==':
               return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
               return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
               return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
               return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
               return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
               return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
               return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
               return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
               return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
               return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
               return options.inverse(this);
         }
      });
      handlebars.registerHelper("math", function (lvalue, operator, rvalue, options) {
         lvalue = parseFloat(lvalue);
         rvalue = parseFloat(rvalue);

         return {
            "+": lvalue + rvalue
         }[operator];
      });

      const templateHtml = fs.readFileSync(filepath, 'utf8');
      //const template = handlebars.compile(templateHtml);
      const html = template(htmlInput.simpleRecipe);
      const html = template(tempData);
      return html;
   } catch (error) {
      throw Error(error.message)
   }
}

export default createMoonlightHTML;