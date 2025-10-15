window.onload = async function() {
  const res = await fetch('/api/rankings?quincena=actual', { cache: "no-store" });
  const ranking = await res.json();
  renderRanking(ranking);
};

function renderRanking(ranking) {
  const lista = document.getElementById('listaRanking');
  lista.innerHTML = "";

  if (Array.isArray(ranking) && ranking.length > 0) {
    const quincena = ranking[0]?.quincena || '';
    ranking.forEach((persona, i) => {
      let icon = "🌿";
      if (persona.posicion == 1) icon = "🥇";
      else if (persona.posicion == 2) icon = "🥈";
      else if (persona.posicion == 3) icon = "🥉";

      let ruleta = (persona.tieneruleta === "SI") ? "🎉" : "—";

      const usuarioid = localStorage.getItem('usuarioid');
      const isUser = persona.usuarioid && (String(persona.usuarioid) === String(usuarioid));
      const highlightClass = isUser ? "highlight" : (persona.posicion <= 3 ? "top3" : "");

      lista.innerHTML += `
        <div class="ranking-row ${highlightClass}">
          <div>${persona.posicion || i + 1}</div>
          <div>${persona.nombre || persona.usuarioid}</div>
          <div>${persona.puntajetotal}</div>
          <div>${persona.quincena || quincena}</div>
          <div>${ruleta}</div>
        </div>
      `;
    });

    const usuarioid = localStorage.getItem('usuarioid');
    const puesto = ranking.findIndex(p => String(p.usuarioid) === String(usuarioid));
    if (puesto >= 0 && puesto < 3) {
      document.getElementById('ruleta-btn-container').innerHTML =
        `<button onclick="location.href='../incentivos/ruleta.html'" class="btn-primary"
           style="margin-top:22px;">🎁 Girar ruleta</button>`;
    }
  } else {
    lista.innerHTML = '<div class="no-data">No hay ranking para mostrar.</div>';
  }
}

