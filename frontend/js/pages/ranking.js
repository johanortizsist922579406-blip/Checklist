window.onload = async function() {
  const usuarioid = localStorage.getItem('usuarioid');
  const token = localStorage.getItem('token');

  // De momento NO llamamos al recálculo porque ese endpoint no existe en prod
  // await fetch('/api/rankings/recalcular?quincena=actual', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${token}` }
  // });

  // Quincena que sí tiene datos en la BD
  const quincena = '2025-12-15';

  try {
    const res = await fetch(`/api/rankings?quincena=${encodeURIComponent(quincena)}`, {
      cache: 'no-store',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      console.error('Error al obtener ranking:', res.status, await res.text());
      renderRanking([], usuarioid);
      return;
    }

    const ranking = await res.json();
    console.log('RANKING DATA =>', ranking);
    renderRanking(ranking, usuarioid);
  } catch (err) {
    console.error('Error de red al obtener ranking:', err);
    renderRanking([], usuarioid);
  }
};

function renderRanking(ranking, usuarioid) {
  const lista = document.getElementById('listaRanking');
  lista.innerHTML = '';

  if (ranking.length > 0) {
    ranking.forEach((persona) => {
      let icon = '🌿';
      if (persona.posicion == 1) icon = '🥇';
      else if (persona.posicion == 2) icon = '🥈';
      else if (persona.posicion == 3) icon = '🥉';

      const ruleta = persona.tieneruleta === 'SI' ? '🎉' : '—';
      const highlight = String(persona.usuarioid) === String(usuarioid) ? 'highlight' : '';

      lista.innerHTML += `
        <div class="ranking-row ${highlight}">
          <div>${icon} ${persona.posicion}</div>
          <div>${persona.nombre}</div>
          <div>${persona.puntajetotal}</div>
          <div>${persona.quincena}</div>
          <div>${ruleta}</div>
        </div>
      `;
    });
  } else {
    lista.innerHTML = '<div class="no-data">No hay ranking para mostrar.</div>';
  }
}
