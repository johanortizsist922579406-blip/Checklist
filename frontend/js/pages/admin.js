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

  const params = new URLSearchParams();
  if (nombre) params.append('nombre', nombre);
  if (fechaDesde) params.append('fechaDesde', fechaDesde);
  if (fechaHasta) params.append('fechaHasta', fechaHasta);

  const res = await fetch('/api/admin/horas?' + params.toString(), {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    alert('Error cargando horas');
    return;
  }

  const datos = await res.json();
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
}

async function cargarPuntajes() {
  const token = localStorage.getItem('token');
  const nombre = document.getElementById('buscarNombre').value.trim();

  const params = new URLSearchParams();
  if (nombre) params.append('nombre', nombre);

  const res = await fetch('/api/admin/puntajes?' + params.toString(), {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    alert('Error cargando puntajes');
    return;
  }

  const datos = await res.json();
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
}
