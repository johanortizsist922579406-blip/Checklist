const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

async function cargarPerfil() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/pages/auth/registro.html';
    return;
  }

  try {
    const res = await axios.get('/api/perfil/mi-perfil', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = res.data;

    document.getElementById('profileName').textContent = `${data.usuario.nombre} ${data.usuario.apellido || ''}`.trim();
    document.getElementById('profileRole').textContent = data.usuario.rol || 'Usuario';
    document.getElementById('profileArea').textContent = data.usuario.area || 'Sin área asignada';

    document.getElementById('statHoras').textContent = data.horasTotales;
    document.getElementById('statPromedio').textContent = data.promedioEvaluaciones + '/25';
    document.getElementById('statTardanzas').textContent = data.tardanzaTotal;

    const horariosContainer = document.getElementById('horariosContainer');
    if (data.horarios.length > 0) {
      horariosContainer.innerHTML = data.horarios.map(h => `
        <div class="horario-card">
          <div class="horario-dia">${diasSemana[h.dia_semana]}</div>
          <div class="horario-horas">
            ${h.hora_entrada_esperada.substring(0, 5)} - ${h.hora_salida_esperada.substring(0, 5)}
          </div>
        </div>
      `).join('');
    } else {
      horariosContainer.innerHTML = '<p class="no-data">No tienes horarios configurados</p>';
    }

    const tablaAuto = document.getElementById('tablaAutoevaluaciones');
    if (data.autoevaluaciones.length > 0) {
        tablaAuto.innerHTML = data.autoevaluaciones.map(a => `
    <tr>
    <td>${formatearFecha(a.fecha)}</td>
    <td><strong>${a.puntaje_total}</strong></td>
    <td>${a.quincena || '—'}</td>
    <td class="mensaje-cell">${a.observaciones || '—'}</td>
        </tr>
    `).join('');
    } else {
      tablaAuto.innerHTML = '<tr><td colspan="4" class="no-data">No hay autoevaluaciones registradas</td></tr>';
    }

    document.getElementById('promedioGeneral').textContent = data.promedioEvaluaciones + '/25';
    
    const tablaEval = document.getElementById('tablaEvaluacionesRecibidas');
    if (data.evaluacionesRecibidas.length > 0) {
      tablaEval.innerHTML = data.evaluacionesRecibidas.map(e => `
        <tr>
          <td>${e.evaluador_nombre}</td>
          <td>${formatearFecha(e.fecha_evaluacion)}</td>
          <td><span class="badge-tipo ${e.tipo_evaluacion}">${e.tipo_evaluacion}</span></td>
          <td><strong>${e.puntaje_total}/25</strong></td>
          <td class="comentarios-cell">${e.comentarios || 'Sin comentarios'}</td>
        </tr>
      `).join('');
    } else {
      tablaEval.innerHTML = '<tr><td colspan="5" class="no-data">Aún no has recibido evaluaciones de compañeros</td></tr>';
    }

  } catch (error) {
    console.error('Error cargando perfil:', error);
    alert('Error al cargar perfil');
  }
}

function formatearFecha(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

document.addEventListener('DOMContentLoaded', cargarPerfil);
