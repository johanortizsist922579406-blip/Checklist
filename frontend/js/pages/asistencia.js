function obtenerToken() {
  return localStorage.getItem('token');
}

function mostrarToast(mensaje, tipo = 'success') {
  const toast = document.getElementById('toast');
  const msgSpan = document.getElementById('toast-message');

  msgSpan.textContent = mensaje;
  toast.classList.remove('hidden', 'toast-success', 'toast-error');

  if (tipo === 'success') toast.classList.add('toast-success');
  else toast.classList.add('toast-error');

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2500);
}

function decodificarToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

window.addEventListener('load', async () => {
  const token = obtenerToken();
  if (!token) return;

  const userStr = localStorage.getItem('usuario');
  if (userStr) {
    const usuario = JSON.parse(userStr);
    if (usuario.nombre) {
      const welcomeTitle = document.getElementById('welcomeTitle');
      if (welcomeTitle) {
        welcomeTitle.textContent = `Bienvenido ${usuario.nombre}`;
      }
    }
  }

  const btnEntrada = document.getElementById('btnEntrada');
  const btnSalida = document.getElementById('btnSalida');
  const entradaTime = document.getElementById('entradaTime');
  const salidaTime = document.getElementById('salidaTime');
  const totalTime = document.getElementById('totalTime');
  const statusIndicator = document.getElementById('statusIndicator');

  try {
    const res = await fetch('/api/asistencias/estado-actual', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    console.log('Estado actual asistencia:', data);

    if (!data.tieneEntradaAbierta) {
      btnEntrada.disabled = false;
      btnSalida.disabled = true;
      if (entradaTime) entradaTime.textContent = '--:--';
      if (salidaTime) salidaTime.textContent = '--:--';
      if (totalTime) totalTime.textContent = '--:--:--';

      statusIndicator.innerHTML =
        '<div class="status-dot"></div><span>Sin registrar</span>';
      statusIndicator.classList.remove('active', 'completed');
      return;
    }

    if (data.horaentrada && entradaTime) {
      entradaTime.textContent = data.horaentrada.substring(0, 5);
    }

    if (data.horasalida) {
      if (salidaTime) {
        salidaTime.textContent = data.horasalida.substring(0, 5);
      }
      if (data.horatotal && totalTime) {
        const [h, m, s] = data.horatotal.split(':');
        totalTime.textContent = `${h}:${m}:${s}`;
      }

      btnEntrada.disabled = true;
      btnSalida.disabled = true;
      statusIndicator.innerHTML =
        '<div class="status-dot completed"></div><span>Jornada completada</span>';
      statusIndicator.classList.add('completed');
      statusIndicator.classList.remove('active');
    } else {
      btnEntrada.disabled = true;
      btnSalida.disabled = false;
      statusIndicator.innerHTML =
        '<div class="status-dot active"></div><span>En jornada</span>';
      statusIndicator.classList.add('active');
      statusIndicator.classList.remove('completed');
    }
  } catch (err) {
    console.error('Error al obtener estado actual:', err);
  }
});

document.getElementById('btnEntrada').onclick = async function () {
  const res = await fetch('/api/asistencias/entrada', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${obtenerToken()}`
    }
  });

  const data = await res.json();

  if (res.ok) {
    mostrarToast('Entrada registrada', 'success');
    setTimeout(() => location.reload(), 800);
  } else {
    if (data.error === 'Ya tienes un tramo de asistencia en curso') {
      const btnEntrada = document.getElementById('btnEntrada');
      const btnSalida = document.getElementById('btnSalida');
      const statusIndicator = document.getElementById('statusIndicator');

      btnEntrada.disabled = true;
      btnSalida.disabled = false;
      statusIndicator.innerHTML =
        '<div class="status-dot active"></div><span>En jornada</span>';
      statusIndicator.classList.add('active');
      statusIndicator.classList.remove('completed');
    } else {
      mostrarToast(data.error || 'Error al marcar entrada', 'error');
    }
  }
};

document.getElementById('btnSalida').onclick = async function () {
  const res = await fetch('/api/asistencias/salida', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${obtenerToken()}`
    }
  });

  const data = await res.json();

  if (res.ok) {
    mostrarToast('Salida registrada', 'success');
    setTimeout(() => location.reload(), 800);
  } else {
    mostrarToast(data.error || 'Error al marcar salida', 'error');
  }
};
