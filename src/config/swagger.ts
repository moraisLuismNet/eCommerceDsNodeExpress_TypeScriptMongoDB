import swaggerJsdoc from "swagger-jsdoc";
const { version } = require("../../package.json");

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "eCommerceDsNodeExpressTypeScriptMongoDB API",
      version,
      description: "API documentation for the eCommerceDsNodeExpressTypeScriptMongoDB application",
      contact: {
        name: "API Support",
        email: "morais.luism.net@gmail.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        Group: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              format: "objectid",
              description: "Unique identifier for the group"
            },
            nameGroup: {
              type: "string",
              description: "Name of the musical group",
              minLength: 2,
              maxLength: 100
            },
            imageGroup: {
              type: "string",
              description: "URL or path to the group's image"
            },
            musicGenre: {
              type: "string",
              format: "objectid",
              description: "Reference to MusicGenre"
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the group was created"
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when the group was last updated"
            }
          },
          required: ["nameGroup", "musicGenre"],
          example: {
            "_id": "60d21b4667d0d8992e610c85",
            "nameGroup": "The Beatles",
            "imageGroup": "images/beatles.jpg",
            "musicGenre": "60d21b4667d0d8992e610c86",
            "createdAt": "2023-06-25T10:30:00Z",
            "updatedAt": "2023-06-25T10:30:00Z"
          }
        }
      },
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [],
  },
  apis: [
    "./src/routes/*.ts", 
  ],
};

const specs = swaggerJsdoc(options);

export default specs;
