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

setTimeout(function() {
  const btnEntrada = document.getElementById('btnEntrada');
  const btnSalida = document.getElementById('btnSalida');
  
  if (btnEntrada) {
    btnEntrada.addEventListener('click', marcarEntrada);
  }
  if (btnSalida) {
    btnSalida.addEventListener('click', marcarSalida);
  }
  
  cargarEstado();
}, 100);

async function marcarEntrada() {
  console.log('1. Botón clickeado');
  try {
    console.log('2. Enviando petición...');
    const res = await axios.post('/api/asistencias/entrada', {}, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${obtenerToken()}`
      }
    });

    console.log('3. Respuesta recibida:', res.data);
    
    const btnEntrada = document.getElementById('btnEntrada');
    const btnSalida = document.getElementById('btnSalida');
    const statusIndicator = document.getElementById('statusIndicator');
    const entradaTime = document.getElementById('entradaTime');
    
    const now = new Date();
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');
    entradaTime.textContent = `${horas}:${minutos}`;
    
    btnEntrada.disabled = true;
    btnSalida.disabled = false;
    statusIndicator.innerHTML = '<div class="status-dot active"></div><span>En jornada</span>';
    statusIndicator.classList.add('active');
    statusIndicator.classList.remove('completed');
    
    mostrarToast('Entrada registrada', 'success');
    console.log('4. Estado actualizado');
  } catch (error) {
    console.error('5. Error capturado:', error);
    console.error('   Status:', error.response?.status);
    console.error('   Data:', error.response?.data);
    mostrarToast(error.response?.data?.error || 'Error al marcar entrada', 'error');
  }
}

async function marcarSalida() {
  console.log('1. Botón clickeado');
  try {
    console.log('2. Enviando petición...');
    const res = await axios.post('/api/asistencias/salida', {}, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${obtenerToken()}`
      }
    });

    console.log('3. Respuesta recibida:', res.data);
    
    const btnEntrada = document.getElementById('btnEntrada');
    const btnSalida = document.getElementById('btnSalida');
    const statusIndicator = document.getElementById('statusIndicator');
    const salidaTime = document.getElementById('salidaTime');
    const totalTime = document.getElementById('totalTime');
    
    const now = new Date();
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');
    salidaTime.textContent = `${horas}:${minutos}`;
    
    if (res.data.segundosTotales) {
    const totalSegundos = Math.floor(res.data.segundosTotales);

    const horas_total = Math.floor(totalSegundos / 3600);
    const minutos_total = Math.floor((totalSegundos % 3600) / 60);
    const segundos_total = totalSegundos % 60;

    totalTime.textContent =
    `${String(horas_total).padStart(2, '0')}:` +
    `${String(minutos_total).padStart(2, '0')}:` +
    `${String(segundos_total).padStart(2, '0')}`;
    }

    
    btnEntrada.disabled = false;
    btnSalida.disabled = true;
    statusIndicator.innerHTML = '<div class="status-dot"></div><span>Sin registrar</span>';
    statusIndicator.classList.remove('active', 'completed');
    
    mostrarToast('Salida registrada', 'success');
    console.log('4. Estado actualizado');
  } catch (error) {
    console.error('5. Error capturado:', error);
    console.error('   Status:', error.response?.status);
    console.error('   Data:', error.response?.data);
    mostrarToast(error.response?.data?.error || 'Error al marcar salida', 'error');
  }
}

async function cargarEstado() {
  const token = obtenerToken();
  if (!token) return;

  try {
    const res = await axios.get('/api/asistencias/estado-actual', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('estado-actual data:', res.data); 
    const data = res.data;

    const btnEntrada = document.getElementById('btnEntrada');
    const btnSalida = document.getElementById('btnSalida');
    const entradaTime = document.getElementById('entradaTime');
    const salidaTime = document.getElementById('salidaTime');
    const totalTime = document.getElementById('totalTime');
    const statusIndicator = document.getElementById('statusIndicator');

    if (!data.asistenciaId) {
      btnEntrada.disabled = false;
      btnSalida.disabled = true;
      entradaTime.textContent = '--:--';
      salidaTime.textContent = '--:--';
      totalTime.textContent = '--:--:--';
      statusIndicator.innerHTML = '<div class="status-dot"></div><span>Sin registrar</span>';
      statusIndicator.classList.remove('active', 'completed');
      return;
    }

    if (data.tieneEntradaAbierta) {
      if (data.horaentrada) {
        entradaTime.textContent = data.horaentrada.substring(0, 5);
      } else {
        entradaTime.textContent = '--:--';
      }
      salidaTime.textContent = '--:--';
      totalTime.textContent = '--:--:--';

      btnEntrada.disabled = true; 
      btnSalida.disabled = true;    
      statusIndicator.innerHTML = '<div class="status-dot active"></div><span>En jornada</span>';
      statusIndicator.classList.add('active');
      statusIndicator.classList.remove('completed');
      return;
    }

    if (!data.tieneEntradaAbierta) {
      if (data.horaentrada) {
        entradaTime.textContent = data.horaentrada.substring(0, 5);
      } else {
        entradaTime.textContent = '--:--';
      }

      if (data.horasalida) {
        salidaTime.textContent = data.horasalida.substring(0, 5);
      } else {
        salidaTime.textContent = '--:--';
      }

      totalTime.textContent = data.horatotal || '--:--:--';

      btnEntrada.disabled = false; 
      btnSalida.disabled = true;   
      statusIndicator.innerHTML = '<div class="status-dot"></div><span>Sin registrar</span>';
      statusIndicator.classList.remove('active', 'completed');
      return;
    }

  } catch (err) {
    console.error('Error:', err);
  }
}
