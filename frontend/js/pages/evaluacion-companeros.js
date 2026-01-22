const evaluacionCompanerosService = {
  baseURL: `${window.location.origin}/api/evaluacion-companeros`,
  
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  },

  async puedeEvaluar() {
    const response = await fetch(`${this.baseURL}/puede-evaluar`, {
      headers: this.getAuthHeaders()
    });
    return await response.json();
  },

  async obtenerPersonasEvaluables() {
    const response = await fetch(`${this.baseURL}/personas-evaluables`, {
      headers: this.getAuthHeaders()
    });
    return await response.json();
  },

  async crearEvaluacion(evaluacionData) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(evaluacionData)
    });
    return await response.json();
  }
};

const preguntasEvaluacion = [
  "¿Cumple con sus responsabilidades de manera efectiva?",
  "¿Colabora bien con el equipo?",
  "¿Demuestra iniciativa en su trabajo?",
  "¿Mantiene una comunicación clara y respetuosa?",
  "¿Contribuye positivamente al ambiente laboral?"
];

async function verificarEstadoEvaluacion() {
  try {
    const resultado = await evaluacionCompanerosService.puedeEvaluar();
    const statusInfo = document.getElementById('statusInfo');
    const statusMessage = document.getElementById('statusMessage');
    
    if (!resultado.puedeEvaluar) {
      statusInfo.style.display = 'block';
      statusMessage.textContent = `Debes esperar ${resultado.diasRestantes} día(s) más para evaluar nuevamente.`;
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error verificando estado:', error);
    return false;
  }
}

async function cargarPersonasEvaluables() {
  try {
    const puedeEvaluar = await verificarEstadoEvaluacion();
    if (!puedeEvaluar) return;

    const resultado = await evaluacionCompanerosService.obtenerPersonasEvaluables();
    const container = document.getElementById('personasContainer');
    
    if (resultado.companeros.length === 0) {
      container.innerHTML = '<p>No hay compañeros disponibles para evaluar.</p>';
      return;
    }

    container.innerHTML = resultado.companeros.map(persona => `
      <div class="persona-card">
        <div class="persona-header">
          <div class="persona-info">
            <h3>${persona.nombre}</h3>
            <div class="persona-rol">${persona.rol}</div>
          </div>
          <button class="btn-evaluar" onclick="mostrarFormulario(${persona.id}, '${persona.nombre}', '${persona.rol}')">
            Evaluar
          </button>
        </div>
        <div id="form-${persona.id}" class="evaluacion-form">
          <h4>Evaluando a: ${persona.nombre}</h4>
          ${preguntasEvaluacion.map((pregunta, index) => `
            <div class="pregunta-eval">
              <label>${pregunta}</label>
              <div class="rating-group">
                ${[1,2,3,4,5].map(valor => `
                  <div class="rating-option">
                    <input type="radio" name="pregunta-${persona.id}-${index}" value="${valor}" id="p${persona.id}-${index}-${valor}">
                    <label for="p${persona.id}-${index}-${valor}">${valor}</label>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
          <div class="pregunta-eval">
            <label>Comentarios adicionales:</label>
            <textarea class="comentarios-area" id="comentarios-${persona.id}" placeholder="Escribe tus comentarios aquí..."></textarea>
          </div>
          <div style="margin-top: 15px;">
            <button class="btn btn-primary" onclick="enviarEvaluacion(${persona.id}, '${persona.rol}')">
              Enviar Evaluación
            </button>
            <button class="btn btn-secondary" onclick="ocultarFormulario(${persona.id})" style="margin-left: 10px;">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error cargando personas:', error);
    document.getElementById('personasContainer').innerHTML = '<p>Error cargando personas evaluables.</p>';
  }
}

function mostrarFormulario(personaId, nombre, rol) {
  document.getElementById(`form-${personaId}`).style.display = 'block';
}

function ocultarFormulario(personaId) {
  document.getElementById(`form-${personaId}`).style.display = 'none';
}

async function enviarEvaluacion(evaluadoId, rolEvaluado) {
  try {
    const respuestas = [];
    let todasRespondidas = true;

    preguntasEvaluacion.forEach((pregunta, index) => {
      const respuesta = document.querySelector(`input[name="pregunta-${evaluadoId}-${index}"]:checked`);
      if (respuesta) {
        respuestas.push({
          pregunta: pregunta,
          respuesta: parseInt(respuesta.value)
        });
      } else {
        todasRespondidas = false;
      }
    });

    if (!todasRespondidas) {
      alert('Por favor responde todas las preguntas.');
      return;
    }

    const comentarios = document.getElementById(`comentarios-${evaluadoId}`).value;
    const tipoEvaluacion = rolEvaluado.toLowerCase().includes('gerente') ? 'gerente' : 'companero';

    const evaluacionData = {
      evaluadoId,
      tipoEvaluacion,
      respuestas,
      comentarios
    };

    const resultado = await evaluacionCompanerosService.crearEvaluacion(evaluacionData);
    
    if (resultado.message) {
      alert(`Evaluación enviada correctamente. Puntaje: ${resultado.puntaje}/25`);
      location.reload();
    } else {
      alert('Error al enviar la evaluación: ' + (resultado.error || 'Error desconocido'));
    }

  } catch (error) {
    console.error('Error enviando evaluación:', error);
    alert('Error al enviar la evaluación');
  }
}

document.addEventListener('DOMContentLoaded', cargarPersonasEvaluables);
