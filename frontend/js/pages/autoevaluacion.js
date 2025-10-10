// Variables globales
let preguntasGlobales = [];
let respuestas = {};

window.onload = async function() {
  const areaId = localStorage.getItem('areaid');
  const token = localStorage.getItem('token');

  try {
    // Cargar preguntas desde el backend
    const preguntasRes = await fetch(`/api/preguntas?areaid=${areaId}`, {
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

function showSuccessModal(msg, score) {
  document.getElementById('successMessage').textContent = msg;
  document.getElementById('successScore').textContent = score ? ("Puntuación: " + score) : "";
  document.getElementById('successModal').classList.add('active');
}
function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('active');
}

// ========= MODIFICADO: siempre enviando quincena ===========
async function enviarRespuestas() {
  const total = preguntasGlobales.length;
  const respondidas = Object.keys(respuestas).length;

  if (respondidas < total) {
    alert(`Por favor responde todas las preguntas. Te faltan ${total - respondidas} pregunta(s).`);
    return;
  }

  const usuario_id = localStorage.getItem('usuarioid');
  const area_id = localStorage.getItem('areaid');
  const token = localStorage.getItem('token');
  const quincena = "1ra"; // Puedes hacerlo dinámico según lógica

  let puntaje = 0;
  Object.values(respuestas).forEach(valor => {
    if (valor === 'SI') puntaje += 100;
  });

  const puntaje_total = Math.round(puntaje / total);
  const respuestasArray = [];
  for (let pregunta_id in respuestas) {
    respuestasArray.push({
      pregunta_id: parseInt(pregunta_id),
      respuesta: respuestas[pregunta_id]
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
        usuario_id: parseInt(usuario_id),
        area_id: parseInt(area_id),
        puntaje_total: puntaje_total,
        quincena: quincena,    // <<------ SIEMPRE ENVÍA LA QUINCENA!
        respuestas: respuestasArray
      })
    });

    if (res.ok) {
      const resultado = await res.json();
      showSuccessModal('¡Autoevaluación guardada correctamente!', puntaje_total + '/100');
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

// ... el resto del archivo (historial, detalles, etc. igual que ya tienes) ...
function cargarHistorial(usuarioId, token) { /* ... */ }
function renderHistorial(historial) { /* ... */ }
function verDetalles(autoevaluacionId) { /* ... */ }
function goToRanking() { window.location.href = "/pages/ranking/ranking.html"; }
