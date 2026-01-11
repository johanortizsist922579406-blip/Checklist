if (!localStorage.getItem('token')) {
  window.location.href = '../auth/login.html';
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
}

document.addEventListener('DOMContentLoaded', initHome);
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initHome();
  }
});
