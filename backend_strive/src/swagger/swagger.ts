import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Strive Fitness API",
      version: "1.0.0",
      description: "Documentação da API do sistema de gestão de personal trainers e clientes.",
    },
    servers: [
      {
        url: "https://strive-po0s.onrender.com",
        description: "Servidor de Produção (Render)",
      },
      {
        url: "http://localhost:3500",
        description: "Servidor local",
      },
    ],
  },
  apis: [path.join(__dirname, "../routes/*.ts")],
};

export const swaggerSpec = swaggerJsdoc(options);
