if (!localStorage.getItem('token')) {
  window.location.href = '/pages/auth/registro.html';
}

function getTodayKey(prefix) {
  const usuarioid = localStorage.getItem('usuarioid') || 'anon';
  const hoy = new Date().toISOString().slice(0, 10); 
  return `${prefix}_${usuarioid}_${hoy}`;
}

async function configurarBotonResultados() {
  const btnResultados = document.querySelector('.nav-button[data-section="resultados"]');
  if (!btnResultados) return;

  btnResultados.style.display = 'none';

  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('/api/rankings/mi-posicion?quincena=actual', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      console.warn('No se pudo obtener posición de ranking');
      return;
    }

    const data = await res.json();

    if (data.posicion && data.posicion <= 3) {
      btnResultados.style.display = 'flex';
    }
  } catch (err) {
    console.error('Error al configurar botón Resultados:', err);
  }
}

function marcarProgresoHome() {
  const asistenciaDone = localStorage.getItem(getTodayKey('asis_completa')) === '1';
  const autoevalDone   = localStorage.getItem(getTodayKey('auto_completa')) === '1';
  const rankingVisto   = localStorage.getItem(getTodayKey('rank_visto')) === '1';

  const cardAsis = document.getElementById('cardAsistencia');
  const cardAuto = document.getElementById('cardAutoevaluacion');
  const cardRank = document.getElementById('cardRankings');

  if (asistenciaDone && cardAsis) {
    cardAsis.classList.add('nav-button--completed');
  }
  if (autoevalDone && cardAuto) {
    cardAuto.classList.add('nav-button--completed');
  }
  if (rankingVisto && cardRank) {
    cardRank.classList.add('nav-button--completed');
  }
}

function initHome() {
  const btnLogout = document.getElementById('btnLogout');
  const btnAdmin  = document.getElementById('btnAdmin');
  const modal     = document.getElementById('no-access-modal');
  const closeBtn  = document.getElementById('closeNoAccess');

  const userStr = localStorage.getItem('usuario');
  if (userStr) {
    const usuario = JSON.parse(userStr);
    const welcomeTitle = document.getElementById('welcomeTitle');
    if (welcomeTitle && usuario && usuario.nombre) {
      const esMujer = usuario.genero === 'F';
      const saludo = esMujer ? 'Bienvenida' : 'Bienvenido';
      welcomeTitle.textContent = `${saludo} ${usuario.nombre}`;
    }
  }

  if (modal) {
    modal.classList.add('hidden');
  }

  if (btnLogout) {
    btnLogout.onclick = function () {
      localStorage.removeItem('token');
      localStorage.removeItem('usuarioid');
      localStorage.removeItem('usuario');
      localStorage.clear();
      window.location.href = '/';
    };
  }

  if (btnAdmin && modal && closeBtn) {
    btnAdmin.onclick = function () {
      const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
      console.log('USUARIO EN HOME =>', usuario);

      if (usuario && (usuario.rol || '').toLowerCase() === 'admin') {
        window.location.href = '/pages/admin/index.html';
      } else {
        modal.classList.remove('hidden');
      }
    };

    closeBtn.onclick = function () {
      modal.classList.add('hidden');
    };

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }

  configurarBotonResultados();
  marcarProgresoHome();
  verificarConstancia520();
  verificarEvaluacionCompaneros();
}

async function verificarConstancia520() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('/api/constancias/verificar-elegibilidad', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return;

    const data = await res.json();
    const cardConstancia = document.getElementById('cardConstancia');

    if (data.elegible && !data.yaReclamo && cardConstancia) {
      cardConstancia.style.display = 'flex';
      
      const desc = cardConstancia.querySelector('.button-description');
      if (desc) {
        desc.textContent = `Tienes ${data.horasTotales}h acumuladas`;
      }
    }
  } catch (err) {
    console.error('Error verificar constancia:', err);
  }
}

async function verificarEvaluacionCompaneros() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('/api/evaluacion-companeros/puede-evaluar', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return;

    const data = await res.json();
    const cardEvalComp = document.getElementById('cardEvaluacionCompaneros');

    if (data.puedeEvaluar && cardEvalComp) {
      cardEvalComp.style.display = 'flex';
      
      const desc = cardEvalComp.querySelector('.button-description');
      if (desc && !data.puedeEvaluar) {
        desc.textContent = `Disponible en ${data.diasRestantes} día(s)`;
      }
    }
  } catch (err) {
    console.error('Error verificar evaluación compañeros:', err);
  }
}

async function solicitarConstancia() {
  const token = localStorage.getItem('token');
  
  if (!confirm('¿Deseas solicitar tu constancia de 520 horas? Recibirás instrucciones para recogerla.')) {
    return;
  }

  try {
    const res = await fetch('/api/constancias/solicitar', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    if (res.ok) {
      alert(`✅ ${data.mensaje}\n\nContacta a Gerencia:\n📞 +51 981 049 956\n✉️ Indica tu nombre y que completaste 520 horas.`);
      
      document.getElementById('cardConstancia').style.display = 'none';
    } else {
      alert('❌ ' + data.error);
    }
  } catch (error) {
    console.error('Error solicitar constancia:', error);
    alert('Error al solicitar constancia');
  }
}

document.addEventListener('DOMContentLoaded', initHome);
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initHome();
  }
});
