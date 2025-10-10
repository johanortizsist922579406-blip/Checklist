document.getElementById('girarRuleta').onclick = function() {
  // Ejemplo de premios
  const premios = ['Día libre', 'Gift Card', 'Almuerzo', 'No premio :(', 'Un bono'];
  const premio = premios[Math.floor(Math.random() * premios.length)];
  document.getElementById('mensajePremio').innerText = premio;
  setTimeout(() => {
    window.location.href = '../mensaje/index.html?premio=' + encodeURIComponent(premio);
  }, 2000);
};
