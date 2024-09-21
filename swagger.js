const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TECHNICAL TEST PT. EIGEN TRI MATHEMA BY BADRA',
    version: '1.0.0',
    description: '-',
  },
  components: {
    schemas: {
      Members: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier'
          },
          name: {
            type: 'string',
            description: 'Name of the member'
          },
          code: {
            type: 'string',
            description: 'Code of the member'
          }
        },
        required: ['name', 'code']
      },
      Books: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier'
          },
          title: {
            type: 'string',
            description: 'Title of the book'
          },
          author: {
            type: 'string',
            description: 'Author of the book'
          },
          stock: {
            type: 'number',
            description: 'Stock of the book'
          },
          code: {
            type: 'string',
            description: 'Code of the book'
          },
        },
        required: ['title', 'author', 'code', 'stock']
      },
      Borrow:{
        type: Object,
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier'
          },
          bookCode: {
            type: 'string',
            description: 'Code of book has borrowed by member'
          },
          memberCode: {
            type: 'string',
            description: 'Code of member has borrowed the book'
          }
        }
      }
    }
  }
};

const options = {
  definition: swaggerDefinition,
  apis: [`${__dirname}/routes/*.js`],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec
};
