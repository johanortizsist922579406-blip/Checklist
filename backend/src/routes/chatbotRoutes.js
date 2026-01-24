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
            'Además de responder en texto, debes detectar si el usuario quiere realizar una acción ' +
            '(registrar asistencia, ver autoevaluaciones, abrir página de autoevaluación, etc.). ' +
            'Cuando detectes una acción, devuelve AL FINAL de tu respuesta una línea JSON clara ' +
            'con la forma: ACTION: {"tipo":"...","datos":{...}}. ' +
            'Tipos posibles: "registrar_asistencia", "abrir_autoevaluacion", "ver_autoevaluaciones".'
        },
        { role: 'user', content: message },
      ],
    });

    const raw = completion.choices[0].message.content || '';
    let answer = raw;
    let action = null;

    const match = raw.match(/ACTION:\s*(\{.*\})/s);
    if (match) {
      try {
        action = JSON.parse(match[1]);
        answer = raw.replace(match[0], '').trim();
      } catch (e) {
        console.error('Error parsing ACTION JSON', e);
      }
    }

    res.json({ answer, action });
  } catch (err) {
    console.error('Error en chatbot:', err);
    res.status(500).json({ error: 'Error en el chatbot' });
  }
});

module.exports = router;
