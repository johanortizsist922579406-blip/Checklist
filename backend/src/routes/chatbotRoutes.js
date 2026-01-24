const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/chatbot', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Mensaje vacío' });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Eres el asistente del sistema web "Checklist" de Sanilab. ' +
            'Respondes en español, en máximo 3 frases. ' +
            'Guía al usuario usando las secciones reales del sistema: Inicio, Asistencia, Autoevaluación, Evaluación de Compañeros, Perfil, Rankings, Resultados.',
        },
        { role: 'user', content: message },
      ],
    });

    const answer = completion.choices[0].message.content;
    res.json({ answer });
  } catch (err) {
    console.error('Error en chatbot:', err);
    res.status(500).json({ error: 'Error en el chatbot' });
  }
});

module.exports = router;