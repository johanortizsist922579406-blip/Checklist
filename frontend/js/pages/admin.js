const api = axios.create({
  baseURL: 'https://checklist-nqjz.onrender.com'  
});

window.onload = async function() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Sesión no válida');
    window.location.href = '/';
    return;
  }

  document.getElementById('btnFiltrarHoras').onclick = cargarHoras;
  document.getElementById('btnFiltrarPuntajes').onclick = cargarPuntajes;

  await cargarHoras();
  await cargarPuntajes();
};

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
    const res = await api.get('/api/admin/horas', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });

    const datos = res.data;
    const tbody = document.getElementById('tablaHoras');
    tbody.innerHTML = '';

    datos.forEach(row => {
      tbody.innerHTML += `
        <tr>
          <td>${row.nombre}</td>
          <td>${row.fecha}</td>
          <td>${row.horas}</td>
        </tr>
      `;
    });
  } catch (error) {
    alert('Error cargando horas');
    console.error('Error cargarHoras:', error);
  }
}

async function cargarPuntajes() {
  const token = localStorage.getItem('token');
  const nombre = document.getElementById('buscarNombre').value.trim();

  const params = {};
  if (nombre) params.nombre = nombre;

  try {
    const res = await api.get('/api/admin/puntajes', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });

    const datos = res.data;
    const tbody = document.getElementById('tablaPuntajes');
    tbody.innerHTML = '';

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
    alert('Error cargando puntajes');
    console.error('Error cargarPuntajes:', error);
  }
}
