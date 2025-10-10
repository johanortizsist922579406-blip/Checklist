document.getElementById('registroForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const apellido = document.getElementById('apellido').value;
  const correo = document.getElementById('correo').value;
  const password = document.getElementById('password').value;
  const areaid = document.getElementById('area').value;

  try {
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        apellido,
        correo,
        password,
        areaid
      })
    });

    if (res.ok) {
      alert('Usuario registrado con éxito');
      window.location.href = '../../index.html';
    } else {
      const data = await res.json();
      alert('Error: ' + (data.error || 'No se pudo registrar el usuario'));
    }
  } catch (err) {
    alert('Error de conexión o de servidor.');
  }
});

// Cargar dinámicamente las áreas
async function cargarAreas() {
  const res = await fetch('/api/areas');
  if(res.ok) {
    const areas = await res.json();
    const select = document.getElementById('area');
    areas.forEach(area => {
      const option = document.createElement('option');
      option.value = area.id; // Si el campo es areaid, pon area.areaid
      option.textContent = area.nombre;
      select.appendChild(option);
    });
  }
}
cargarAreas();
