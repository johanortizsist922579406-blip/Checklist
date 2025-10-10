export async function obtenerAsistencias() {
  const res = await fetch('/api/asistencias');
  return res.json();
}
