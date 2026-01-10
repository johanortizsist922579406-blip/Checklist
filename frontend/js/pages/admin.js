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
  if (btnExportarSheets) btnExportarSheets.onclick = exportarAGoogleSheets;

  cargarHoras();
  cargarPuntajes();
});

function formatearHoraTotal(valor) {
  if (!valor) return '--:--:--';
  const str = valor.toString();
  return str.split('.')[0]; 
}

function formatearFechaISO(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

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
      const horaSalida  = row.horasalida  ? row.horasalida.substring(0, 5)  : '--:--';
      const totalHoras  = formatearHoraTotal(row.horatotal);
      const fecha       = formatearFechaISO(row.fecha);

      tbody.innerHTML += `
        <tr>
          <td>${row.nombre}</td>
          <td>${fecha}</td>
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

async function exportarAGoogleSheets() {
  try {
    const token = localStorage.getItem('token');

    Swal.fire({
      title: 'Exportando...',
      text: 'Enviando TODOS los datos de horas a Google Sheets',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const response = await axios.post('/api/admin/export-horas-sheets', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = response.data;

    if (data.success) {
      const sheetsUrl = data.spreadsheetUrl;
      
      Swal.fire({
        icon: 'success',
        title: '¡Exportación Exitosa!',
        html: `
          <p>${data.message}</p>
          <a href="${sheetsUrl}" target="_blank" class="btn btn-primary mt-2" style="display: inline-block; padding: 10px 20px; background: #4285F4; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">
            🔗 Abrir Google Sheets
          </a>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Cerrar'
      });
    } else {
      throw new Error(data.error);
    }

  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo exportar a Google Sheets: ' + (error.response?.data?.error || error.message)
    });
  }
}
