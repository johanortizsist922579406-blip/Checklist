// Si quieres verificar sesión aquí antes de mostrar botones
if (!localStorage.getItem('token')) {
  window.location.href = '../auth/login.html';
}
