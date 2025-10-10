export async function obtenerPreguntasPorArea(areaId) {
  const res = await fetch(`/api/preguntas?areaId=${areaId}`);
  return res.json();
}
