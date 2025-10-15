class Asistencia {
  constructor({ id, usuarioId, fecha, horaEntrada, horaSalida, estado }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.fecha = fecha;
    this.horaEntrada = horaEntrada;
    this.horaSalida = horaSalida;
    this.estado = estado;
  }
}

module.exports = Asistencia;
