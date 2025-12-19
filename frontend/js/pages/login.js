document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const correo = document.getElementById('correo').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Correo o contraseña incorrectos. Inténtalo de nuevo.');
      return;
    }

    const data = await res.json();
    console.log('LOGIN DATA =>', data);
    window.__LOGIN_DATA__ = data;

    localStorage.setItem('token', data.token);
    localStorage.setItem('usuarioid', String(data.usuario.id));
    localStorage.setItem('areaid', String(data.usuario.areaid));

    window.location.href = '/pages/home/index.html';
  } catch (error) {
    console.error('Error en login:', error);
    alert('Error de conexión. Inténtalo nuevamente.');
  }
});
