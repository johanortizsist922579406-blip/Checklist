document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Sesión no válida');
    window.location.href = '/';
    return;
  }

  const btnFiltrarHoras = document.getElementById('btnFiltrarHoras');
  const btnFiltrarPuntajes = document.getElementById('btnFiltrarPuntajes');
  const btnExportarSheets = document.getElementById('btnExportarSheets'); 

  if (btnFiltrarHoras) btnFiltrarHoras.onclick = cargarHoras;
  if (btnFiltrarPuntajes) btnFiltrarPuntajes.onclick = cargarPuntajes;
  if (btnExportarSheets) btnExportarSheets.onclick = exportarAExcel; 

  cargarHoras();
  cargarPuntajes();
});


async function cargarHoras() {
  const token = localStorage.getItem('token');
  const nombre = document.getElementById('buscarNombre').value.trim();
  const fechaDesde = document.getElementById('fechaDesde').value;
  const fechaHasta = document.getElementById('fechaHasta').value;

  const params = {};
  if (nombre) params.nombre = nombre;
  if (fechaDesde) params.fechaDesde = fechaDesde;
  if (fechaHasta) params.fechaHasta = fechaHasta;

  try {
    const res = await axios.get('/api/admin/horas', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });

    const datos = res.data;
    const tbody = document.getElementById('tablaHoras');
    tbody.innerHTML = '';

    if (datos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No hay datos</td></tr>';
      return;
    }

    datos.forEach(row => {
      const horaEntrada = row.horaentrada ? row.horaentrada.substring(0, 5) : '--:--';
      const horaSalida = row.horasalida ? row.horasalida.substring(0, 5) : '--:--';
      const totalHoras = row.horatotal ? row.horatotal.substring(0, 8) : '--:--:--';

      tbody.innerHTML += `
        <tr>
          <td>${row.nombre}</td>
          <td>${row.fecha}</td>
          <td>${horaEntrada}</td>
          <td>${horaSalida}</td>
          <td>${totalHoras}</td>
        </tr>
      `;
    });
  } catch (error) {
    console.error('Error cargarHoras:', error);
    alert('Error cargando horas: ' + error.message);
  }
}

async function cargarPuntajes() {
  const token = localStorage.getItem('token');
  const nombre = document.getElementById('buscarNombre').value.trim();

  const params = {};
  if (nombre) params.nombre = nombre;

  try {
    const res = await axios.get('/api/admin/puntajes', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });

    const datos = res.data;
    const tbody = document.getElementById('tablaPuntajes');
    tbody.innerHTML = '';

    if (datos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No hay datos</td></tr>';
      return;
    }

    datos.forEach(row => {
      tbody.innerHTML += `
        <tr>
          <td>${row.nombre}</td>
          <td>${row.quincena}</td>
          <td>${row.puntajetotal}</td>
          <td>${row.posicion}</td>
        </tr>
      `;
    });
  } catch (error) {
    console.error('Error cargarPuntajes:', error);
    alert('Error cargando puntajes: ' + error.message);
  }
}

async function exportarAExcel() {
  try {
    Swal.fire({
      title: 'Exportando...',
      text: 'Creando tu hoja de Google Sheets con las horas',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const userId = localStorage.getItem('userId') || 1;
    const userEmail = localStorage.getItem('email');

    // ✅ CAMBIO: Usar el nuevo endpoint /export-horas-sheets
    const response = await axios.post('/api/autoevaluaciones/export-horas-sheets', {
      userId: userId,
      email: userEmail
    });

    const data = response.data;

    if (data.success) {
      const sheetsUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`;
      
      Swal.fire({
        icon: 'success',
        title: '¡Exportación de Horas Exitosa!',
        html: `
          <p>Tu hoja de Google Sheets ha sido creada con todas tus horas contabilizadas</p>
          <a href="${sheetsUrl}" target="_blank" class="btn btn-primary mt-2" style="display: inline-block; padding: 10px 20px; background: #4285F4; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">
            🔗 Abrir Google Sheets
          </a>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Cerrar'
      });
    } else {
      throw new Error(data.message);
    }

  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo exportar a Google Sheets: ' + error.message
    });
  }
}
