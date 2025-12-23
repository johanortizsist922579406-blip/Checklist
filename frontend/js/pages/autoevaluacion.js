let preguntasGlobales = [];
let respuestas = {};

window.onload = async function() {
  const areaid = localStorage.getItem('areaid');
  const token = localStorage.getItem('token');

  try {
    const preguntasRes = await axios.get(`/api/preguntas`, {
      params: { areaid },
      headers: { Authorization: `Bearer ${token}` }
    });

    const preguntas = preguntasRes.data;
    preguntasGlobales = preguntas;
    renderPreguntas(preguntas);
    updateProgress();
  } catch (error) {
    console.error('Error al cargar preguntas:', error);
    alert('Error al cargar las preguntas. Por favor, intenta nuevamente.');
  }

  document.getElementById('enviarRespuestas').onclick = enviarRespuestas;

  const btnVolver = document.getElementById('btnVolver');
  if (btnVolver) {
    btnVolver.onclick = function(e) {
      e.preventDefault();
      window.location.href = "/pages/home/index.html";
    };
  }
};

function actualizarSliderVisual(input) {
  const min = Number(input.min);
  const max = Number(input.max);
  const val = Number(input.value);
  const percent = ((val - min) / (max - min)) * 100;
  input.style.background = `linear-gradient(to right, #22c55e ${percent}%, #e5e7eb ${percent}%)`;
}

function getEstadoTexto(valor) {
  if (valor < 2) return '😞 Mal';
  if (valor < 3.5) return '😐 Regular';
  if (valor < 4.5) return '🙂 Bien';
  return '😄 Excelente';
}

function renderPreguntas(preguntas) {
  const container = document.getElementById('preguntasContainer');
  container.innerHTML = '';
  respuestas = {};

  preguntas.forEach((pregunta, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.style.animationDelay = `${index * 0.1}s`;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'question-header';

    const numberSpan = document.createElement('span');
    numberSpan.className = 'question-number';
    numberSpan.textContent = index + 1;

    const textDiv = document.createElement('div');
    textDiv.className = 'question-text';
    textDiv.textContent = pregunta.pregunta;

    headerDiv.appendChild(numberSpan);
    headerDiv.appendChild(textDiv);
    questionDiv.appendChild(headerDiv);

    const sliderWrapper = document.createElement('div');
    sliderWrapper.className = 'slider-row';

    const inputRange = document.createElement('input');
    inputRange.type = 'range';
    inputRange.min = '1';
    inputRange.max = '5';
    inputRange.step = '0.5';
    inputRange.value = '3';
    inputRange.className = 'score-slider';
    inputRange.dataset.preguntaId = pregunta.id;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'slider-value';
    valueSpan.textContent = Number(inputRange.value).toFixed(1);

    const moodSpan = document.createElement('span');
    moodSpan.className = 'slider-mood';
    moodSpan.textContent = getEstadoTexto(Number(inputRange.value));

    actualizarSliderVisual(inputRange);

    inputRange.addEventListener('input', () => {
      const v = Number(inputRange.value);
      valueSpan.textContent = v.toFixed(1);
      moodSpan.textContent = getEstadoTexto(v);
      respuestas[pregunta.id] = v;
      actualizarSliderVisual(inputRange);
      updateProgress();
    });

    sliderWrapper.appendChild(inputRange);
    sliderWrapper.appendChild(valueSpan);
    sliderWrapper.appendChild(moodSpan);
    questionDiv.appendChild(sliderWrapper);

    container.appendChild(questionDiv);

    respuestas[pregunta.id] = Number(inputRange.value);
  });

  updateProgress();
}

function updateProgress() {
  const total = preguntasGlobales.length;
  const respondidas = Object.keys(respuestas).length;
  const porcentaje = total > 0 ? Math.round((respondidas / total) * 100) : 0;

  const btnEnviar = document.getElementById('enviarRespuestas');
  btnEnviar.disabled = !(total > 0);
}

function showSuccessModal(msg, score, mensajeMotivacional) {
  document.getElementById('successMessage').textContent = msg;
  document.getElementById('successScore').textContent = score ? ("Puntuación: " + score) : "";
  document.getElementById('motivationalMessage').textContent = mensajeMotivacional || "";
  document.getElementById('successModal').classList.add('active');

  const btnAceptar = document.getElementById('btnAceptarModal');
  if (btnAceptar) {
    btnAceptar.onclick = function() {
      window.location.href = '/pages/ranking/ranking.html';
    };
  }
}

function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('active');
}

async function enviarRespuestas() {
  const total = preguntasGlobales.length;

  if (total === 0) {
    alert('No hay preguntas para responder.');
    return;
  }

  const usuarioid = localStorage.getItem('usuarioid');
  const areaid = localStorage.getItem('areaid');
  const token = localStorage.getItem('token');
  const quincena = "1ra";

  let suma = 0;
  Object.values(respuestas).forEach(valor => {
    suma += Number(valor);
  });

  const puntajetotal = suma;

  let mensajeMotivacional = '';
  const promedio = puntajetotal / total;
  if (promedio < 2) {
    mensajeMotivacional = '¡No te desanimes! Cada oportunidad es un nuevo comienzo. ¡Tú puedes mejorar!';
  } else if (promedio < 3.5) {
    mensajeMotivacional = 'Buen desempeño, sigue así.';
  } else if (promedio < 4.5) {
    mensajeMotivacional = 'Muy buen rendimiento, casi excelente.';
  } else {
    mensajeMotivacional = 'Excelente rendimiento.';
  }

  const respuestasArray = [];
  for (let preguntaid in respuestas) {
    const valor = Number(respuestas[preguntaid]);
    respuestasArray.push({
      preguntaid: parseInt(preguntaid),
      respuesta: null,
      puntaje: valor
    });
  }

  const btnEnviar = document.getElementById('enviarRespuestas');
  const textoOriginal = btnEnviar.innerHTML;
  btnEnviar.innerHTML = '<span>Enviando...</span>';
  btnEnviar.disabled = true;

  try {
    const res = await axios.post('/api/autoevaluaciones', {
      usuarioid: parseInt(usuarioid),
      areaid: parseInt(areaid),
      puntajetotal: puntajetotal,
      quincena: quincena,
      mensajemotivacional: mensajeMotivacional,
      respuestas: respuestasArray
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    const resultado = res.data;

    showSuccessModal(
      '¡Autoevaluación guardada correctamente!',
      puntajetotal.toFixed(2),
      mensajeMotivacional
    );

    const estadoSpan = document.getElementById('estadoAutoevaluacion');
    if (estadoSpan) {
      estadoSpan.textContent = 'Enviado';
      estadoSpan.classList.remove('status-pending');
      estadoSpan.classList.add('status-completed');
    }

    btnEnviar.innerHTML = textoOriginal;
    btnEnviar.disabled = true;
  } catch (error) {
    if (error.response) {
      const errData = error.response.data;
      alert('Error al guardar la autoevaluación: ' + (errData?.message || errData?.error || 'Error desconocido'));
    } else {
      alert('Error de conexión. Por favor, intenta nuevamente.');
    }
    console.error('Error al enviar:', error);
    btnEnviar.innerHTML = textoOriginal;
    btnEnviar.disabled = false;
  }
}
