function agregarMensaje(origen, texto) {
  const cont = document.getElementById('chatbot-messages');
  const div = document.createElement('div');
  div.className = 'msg ' + origen;
  div.textContent = texto;
  cont.appendChild(div);
  cont.scrollTop = cont.scrollHeight;
}

async function enviarMensaje() {
  const input = document.getElementById('chatbot-input');
  const texto = input.value.trim();
  if (!texto) return;

  agregarMensaje('user', texto);
  input.value = '';

  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      '/api/chatbot',
      { message: texto },
      token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {}
    );

    agregarMensaje('bot', res.data.answer || 'No recibí respuesta.');
  } catch (err) {
    console.error(err);
    agregarMensaje('bot', 'Ocurrió un error al consultar el asistente.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnSend = document.getElementById('chatbot-send');
  const input = document.getElementById('chatbot-input');
  const toggle = document.getElementById('chatbot-toggle');
  const widget = document.getElementById('chatbot-widget');

  if (!btnSend || !input || !toggle || !widget) return;

  btnSend.addEventListener('click', enviarMensaje);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') enviarMensaje();
  });

  toggle.addEventListener('click', () => {
    widget.classList.toggle('chatbot-closed');
  });

  agregarMensaje(
    'bot',
    'Hola, soy el asistente del Checklist. Pregúntame cosas como "¿Dónde marco mi asistencia?" o "¿Cómo hago mi autoevaluación?".'
  );
});