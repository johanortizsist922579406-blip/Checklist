class Pregunta {
  constructor({ id, areaId, pregunta, orden, activa, createdAt, updatedAt }) {
    this.id = id;
    this.areaId = areaId;
    this.pregunta = pregunta;
    this.orden = orden;
    this.activa = activa;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

module.exports = Pregunta;
