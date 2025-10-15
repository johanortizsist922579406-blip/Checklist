class Autoevaluacion {
  constructor({ id, usuarioId, fechaEvaluacion, puntajeTotal, createdAt, updatedAt }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.fechaEvaluacion = fechaEvaluacion;
    this.puntajeTotal = puntajeTotal;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

module.exports = Autoevaluacion;
