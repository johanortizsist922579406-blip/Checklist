window.onload = async function() {
  const res = await fetch('/api/autoevaluaciones/mis-resultados', {
    headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}
  });
  const resultados = await res.json();
  
  // Chart.js para gráfico (sólo demo, ajuste datos reales)
  const ctx = document.getElementById('graficoResultados').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Puntaje'],
      datasets: [{label: 'Tu puntaje', data: [resultados.puntajeTotal]}]
    }
  });

  // Botones de puntaje por rango
  const rangos = [50, 100, 150, 200, 250, 300];
  const div = document.getElementById('botonesPuntaje');
  rangos.forEach(r => {
    const btn = document.createElement('button');
    btn.innerText = `${r-49} - ${r}`;
    btn.onclick = () => mostrarMensaje(r, resultados.puntajeTotal);
    div.appendChild(btn);
  });
};

function mostrarMensaje(rango, puntaje) {
  const msg = puntaje <= rango
    ? '¡Sigue mejorando!' : '¡Excelente trabajo!';
  document.getElementById('mensajeResultado').innerText = msg;
}

document.getElementById('verRanking').onclick = function() {
  window.location.href = '../ranking/index.html';
};
