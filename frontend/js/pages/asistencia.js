function obtenerToken() {
  return localStorage.getItem('token');
}

document.getElementById('btnEntrada').onclick = async function() {
  // Marcar entrada
  const res = await fetch('/api/asistencias', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 
              'Authorization': `Bearer ${obtenerToken()}`},
    body: JSON.stringify({accion: 'entrada'})
  });
  if (res.ok) {
    alert('Entrada registrada');
    location.reload();
  } else {
    alert('Error al marcar entrada');
  }
};

document.getElementById('btnSalida').onclick = async function() {
  // Marcar salida
  const res = await fetch('/api/asistencias', {
    method: 'POST',
    headers: {'Content-Type': 'application/json',
              'Authorization': `Bearer ${obtenerToken()}`},
    body: JSON.stringify({accion: 'salida'})
  });
  if (res.ok) {
    alert('Salida registrada');
    location.reload();
  } else {
    alert('Error al marcar salida');
  }
};

// Muestra info de asistencia actual
window.onload = async function() {
  const res = await fetch('/api/asistencias', {
    headers: {'Authorization': `Bearer ${obtenerToken()}`}
  });
  const data = await res.json();
  const ultimaAsistencia = data[data.length - 1] || null;
  
  if (ultimaAsistencia) {
    // Ocultar el div de asistencia-info (ya no lo necesitamos para mostrar JSON)
    document.getElementById('asistencia-info').style.display = 'none';
    
    // Actualizar los valores actuales si hay una asistencia en curso
    if (ultimaAsistencia.hora_entrada) {
      document.getElementById('entradaTime').textContent = ultimaAsistencia.hora_entrada.substring(0, 5);
      
      // Si ya marcó entrada, deshabilitar botón de entrada y habilitar salida
      const btnEntrada = document.getElementById('btnEntrada');
      const btnSalida = document.getElementById('btnSalida');
      const statusIndicator = document.getElementById('statusIndicator');
      
      btnEntrada.disabled = true;
      
      if (ultimaAsistencia.hora_salida) {
        // Ya marcó salida
        document.getElementById('salidaTime').textContent = ultimaAsistencia.hora_salida.substring(0, 5);
        btnSalida.disabled = true;
        
        statusIndicator.innerHTML = '<div class="status-dot completed"></div><span>Jornada completada</span>';
        statusIndicator.classList.add('completed');
        
        if (ultimaAsistencia.hora_total) {
          document.getElementById('totalTime').textContent = ultimaAsistencia.hora_total;
        }
      } else {
        // Solo marcó entrada, puede marcar salida
        btnSalida.disabled = false;
        statusIndicator.innerHTML = '<div class="status-dot active"></div><span>En jornada</span>';
        statusIndicator.classList.add('active');
      }
    }
    
    // Mostrar la última asistencia formateada
    if (window.mostrarUltimaAsistencia) {
      window.mostrarUltimaAsistencia(ultimaAsistencia);
    }
  } else {
    // No hay asistencias previas
    document.getElementById('asistencia-info').innerHTML = 
      '<p style="text-align: center; color: #636e72;">No hay registros de asistencia.</p>';
  }
};