if (!localStorage.getItem('token')) {
  window.location.href = '../auth/login.html';
}

function initHome() {
  const btnLogout = document.getElementById('btnLogout');
  const btnAdmin  = document.getElementById('btnAdmin');
  const modal     = document.getElementById('no-access-modal');
  const closeBtn  = document.getElementById('closeNoAccess');

  if (modal) {
    modal.classList.add('hidden');  
  }

  if (btnLogout) {
    btnLogout.onclick = function () {
      localStorage.removeItem('token');
      localStorage.removeItem('usuarioid');
      window.location.href = '/';
    };
  }

  if (btnAdmin && modal && closeBtn) {
    btnAdmin.onclick = function () {
      const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
      console.log('USUARIO EN HOME =>', usuario);

      if (usuario && usuario.rol === 'ADMIN') {
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
}

document.addEventListener('DOMContentLoaded', initHome);

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initHome();
  }
});
