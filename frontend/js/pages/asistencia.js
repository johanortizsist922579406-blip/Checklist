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

window.onload = async function () {
  const res = await fetch('/api/asistencias', {
    headers: { 'Authorization': `Bearer ${obtenerToken()}` }
  });
  const data = await res.json();
  const ultima = data[data.length - 1] || null;

  if (!ultima) {
    document.getElementById('asistencia-info').innerHTML =
      '<p style="text-align: center; color: #636e72;">No hay registros de asistencia.</p>';
    return;
  }

  const btnEntrada = document.getElementById('btnEntrada');
  const btnSalida = document.getElementById('btnSalida');
  const statusIndicator = document.getElementById('statusIndicator');

  if (ultima.horaentrada) {
    document.getElementById('entradaTime').textContent =
      ultima.horaentrada.substring(0, 5);
    btnEntrada.disabled = true;

    if (ultima.horasalida) {
      document.getElementById('salidaTime').textContent =
        ultima.horasalida.substring(0, 5);
      btnSalida.disabled = true;

      statusIndicator.innerHTML =
        '<div class="status-dot completed"></div><span>Jornada completada</span>';
      statusIndicator.classList.add('completed');

    if (ultima.horatotal) {
  const [h, m, s] = ultima.horatotal.split(':');
  document.getElementById('totalTime').textContent =
    `${h}:${m}:${s}`;
  }

    } else {
      btnSalida.disabled = false;
      statusIndicator.innerHTML =
        '<div class="status-dot active"></div><span>En jornada</span>';
      statusIndicator.classList.add('active');
    }
  }
};
