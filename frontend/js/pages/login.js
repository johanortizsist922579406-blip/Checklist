document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const correo = document.getElementById('correo').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/api/usuarios/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password })
  });

  if (res.ok) {
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('areaid', data.areaid);
    localStorage.setItem('usuarioid', data.usuarioid || data.id || data.usuario?.id);
    window.location.href = '/pages/home/index.html';
  } else {
    alert('Correo o contraseña incorrectos. Inténtalo de nuevo.');
  }
});
