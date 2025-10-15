class Usuario {
  constructor({ id, correo, passwordHash, nombre, apellido, areaId, activo, fechaRegistro, ultimoAcceso, createdAt, updatedAt }) {
    this.id = id;
    this.correo = correo;
    this.passwordHash = passwordHash;
    this.nombre = nombre;
    this.apellido = apellido;
    this.areaId = areaId;
    this.activo = activo;
    this.fechaRegistro = fechaRegistro;
    this.ultimoAcceso = ultimoAcceso;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

module.exports = Usuario;
