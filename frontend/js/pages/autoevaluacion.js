// Variables globales
let preguntasGlobales = [];
let respuestas = {};

window.onload = async function() {
  const areaid = localStorage.getItem('areaid');
  const token = localStorage.getItem('token');

  try {
    // Cargar preguntas desde el backend
    const preguntasRes = await fetch(`/api/preguntas?areaid=${areaid}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const preguntas = await preguntasRes.json();

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

function renderPreguntas(preguntas) {
  const container = document.getElementById('preguntasContainer');
  container.innerHTML = '';

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

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options-container';

    // Opción SÍ
    const optionSiDiv = document.createElement('div');
    optionSiDiv.className = 'option-item';
    const inputSi = document.createElement('input');
    inputSi.type = 'radio';
    inputSi.name = `pregunta_${pregunta.id}`;
    inputSi.id = `pregunta_${pregunta.id}_si`;
    inputSi.value = 'SI';
    inputSi.addEventListener('change', () => {
      respuestas[pregunta.id] = 'SI';
      updateProgress();
      document.querySelectorAll(`input[name="pregunta_${pregunta.id}"]`).forEach(radio => {
        radio.closest('.option-item').classList.remove('selected');
      });
      optionSiDiv.classList.add('selected');
    });
    const labelSi = document.createElement('label');
    labelSi.htmlFor = `pregunta_${pregunta.id}_si`;
    labelSi.textContent = 'Sí';
    optionSiDiv.appendChild(inputSi);
    optionSiDiv.appendChild(labelSi);

    // Opción NO
    const optionNoDiv = document.createElement('div');
    optionNoDiv.className = 'option-item';
    const inputNo = document.createElement('input');
    inputNo.type = 'radio';
    inputNo.name = `pregunta_${pregunta.id}`;
    inputNo.id = `pregunta_${pregunta.id}_no`;
    inputNo.value = 'NO';
    inputNo.addEventListener('change', () => {
      respuestas[pregunta.id] = 'NO';
      updateProgress();
      document.querySelectorAll(`input[name="pregunta_${pregunta.id}"]`).forEach(radio => {
        radio.closest('.option-item').classList.remove('selected');
      });
      optionNoDiv.classList.add('selected');
    });
    const labelNo = document.createElement('label');
    labelNo.htmlFor = `pregunta_${pregunta.id}_no`;
    labelNo.textContent = 'No';
    optionNoDiv.appendChild(inputNo);
    optionNoDiv.appendChild(labelNo);

    optionsDiv.appendChild(optionSiDiv);
    optionsDiv.appendChild(optionNoDiv);
    questionDiv.appendChild(optionsDiv);

    container.appendChild(questionDiv);
  });
}

function updateProgress() {
  const total = preguntasGlobales.length;
  const respondidas = Object.keys(respuestas).length;
  const porcentaje = total > 0 ? Math.round((respondidas / total) * 100) : 0;

  document.getElementById('progressText').textContent = `${respondidas} de ${total} preguntas respondidas`;
  document.getElementById('progressPercent').textContent = `${porcentaje}%`;
  document.getElementById('progressFill').style.width = `${porcentaje}%`;

  const btnEnviar = document.getElementById('enviarRespuestas');
  btnEnviar.disabled = !(respondidas === total && total > 0);
}

function showSuccessModal(msg, score, mensajeMotivacional) {
  document.getElementById('successMessage').textContent = msg;
  document.getElementById('successScore').textContent = score ? ("Puntuación: " + score) : "";
  document.getElementById('motivationalMessage').textContent = mensajeMotivacional || "";
  document.getElementById('successModal').classList.add('active');
  
  // Asigna el evento solo si el botón existe
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

// ========= MODIFICADO: sin guión bajo ===========
async function enviarRespuestas() {
  const total = preguntasGlobales.length;
  const respondidas = Object.keys(respuestas).length;

  if (respondidas < total) {
    alert(`Por favor responde todas las preguntas. Te faltan ${total - respondidas} pregunta(s).`);
    return;
  }

  const usuarioid = localStorage.getItem('usuarioid');
  const areaid = localStorage.getItem('areaid');
  const token = localStorage.getItem('token');
  const quincena = "1ra";

  let puntaje = 0;
  Object.values(respuestas).forEach(valor => {
    if (valor === 'SI') puntaje += 100;
  });
  const puntajetotal = Math.round(puntaje / total);

  let mensajeMotivacional = '';
  if (puntajetotal === 0) {
    mensajeMotivacional = '¡No te desanimes! Cada oportunidad es un nuevo comienzo. ¡Tú puedes mejorar!';
  } else if (puntajetotal >= 180) {
    mensajeMotivacional = 'Buen desempeño, sigue así.';
  } else if (puntajetotal >= 150) {
    mensajeMotivacional = 'Puedes mejorar en puntualidad.';
  } else {
    mensajeMotivacional = 'Excelente rendimiento.';
  }

  const respuestasArray = [];
  for (let preguntaid in respuestas) {
    const valor = respuestas[preguntaid];
    respuestasArray.push({
      preguntaid: parseInt(preguntaid),
      respuesta: valor,
      puntaje: valor === "SI" ? 100 : 0
    });
  }

  const btnEnviar = document.getElementById('enviarRespuestas');
  const textoOriginal = btnEnviar.innerHTML;
  btnEnviar.innerHTML = '<span>Enviando...</span>';
  btnEnviar.disabled = true;

  try {
    const res = await fetch('/api/autoevaluaciones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        usuarioid: parseInt(usuarioid),
        areaid: parseInt(areaid),
        puntajetotal: puntajetotal,
        quincena: quincena,
        mensajemotivacional: mensajeMotivacional,
        respuestas: respuestasArray
      })
    });

    if (res.ok) {
      const resultado = await res.json();
      console.log("Mensaje motivacional:", mensajeMotivacional);
      showSuccessModal('¡Autoevaluación guardada correctamente!', puntajetotal + '/100', mensajeMotivacional);

      // --- RECALCULA RANKING Y ACTUALIZA TABLA ---
      try {
        await fetch('/api/rankings/recalcular?quincena=1ra', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const resRanking = await fetch('/api/rankings?quincena=actual', { cache: "no-store" });
        const rankingActualizado = await resRanking.json();
        if (typeof renderRanking === 'function') {
          renderRanking(rankingActualizado);
        }
      } catch (error) {
        console.error('Error al recalcular/actualizar ranking:', error);
      }
      // --------------------------------------------

      const estadoSpan = document.getElementById('estadoAutoevaluacion');
      if (estadoSpan) {
        estadoSpan.textContent = 'Enviado';
        estadoSpan.classList.remove('status-pending');
        estadoSpan.classList.add('status-completed');
      }
      respuestas = {};
      document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.checked = false;
        input.closest('.option-item').classList.remove('selected');
      });
      updateProgress();
      btnEnviar.innerHTML = textoOriginal;
      btnEnviar.disabled = true;
    } else {
      const error = await res.json();
      alert('Error al guardar la autoevaluación: ' + (error.message || 'Error desconocido'));
      btnEnviar.innerHTML = textoOriginal;
      btnEnviar.disabled = false;
    }
  } catch (error) {
    console.error('Error al enviar:', error);
    alert('Error de conexión. Por favor, intenta nuevamente.');
    btnEnviar.innerHTML = textoOriginal;
    btnEnviar.disabled = false;
  }
}
