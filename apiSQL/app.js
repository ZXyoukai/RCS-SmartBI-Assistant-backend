import express from 'express'
import dotenv from "dotenv";
import {GoogleGenAI} from '@google/genai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

dotenv.config();

async function iaRequest() {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });
  const config = {
  };
  const model = 'gemini-2.0-flash-lite';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `Você é um especialista em bancos de dados. Converta a descrição em linguagem natural para uma consulta SQL válida.\n"
"Retorne apenas o código SQL, sem explicações adicionais.\n"
"Use a sintaxe SQL padrão e evite funções específicas de banco de dados, a menos que solicitado.
nos prompts vou especificar que tipo de base de dados estou utilizando. por exemplo: mysql, mariadb, postgree, etc.`,
        },
      ],
    },
  ];

  try {
    
    const response = await ai.models.generateContentStream({
      model,
      // config,
      contents,
    });
    let fileIndex = 0;
    for await (const chunk of response) {
      console.log(chunk.text);
    }
  } catch (error) {
    console.log("Error interno ao gerar resposta")
    // console.error(`${Prettyjson.render(error)}`);
    return false;
  }
  return true;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  let tentativas = 0;
  let sucesso = false;

  while (!sucesso && tentativas < 5) {
    try {
      const status = await iaRequest();
      if (status === true) {
        sucesso = true;
      }
    } catch (err) {
      console.error("Erro na requisição:", err.message);
    }

    if (!sucesso) {
      tentativas++;
      const delay = 1000 * tentativas;
      console.log(`Tentando novamente em ${delay}ms...`);
      await sleep(delay);
    }
  }

  if (!sucesso) {
    console.error("Falhou após várias tentativas.");
  }
}


main();


import express from "express";

const app = express();
const port = process.env.PORT || 3500;

app.post("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});