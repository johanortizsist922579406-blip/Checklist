module.exports = (req, res, next) => {
  // Ejemplo simple para registro de usuario
  const { correo, passwordHash, nombre, apellido, areaId } = req.body;
  if (!correo || !passwordHash || !nombre || !apellido || !areaId) {
    return res.status(400).json({ error: 'Completa todos los campos obligatorios' });
  }
  // Aquí podrías validar email, longitud password, etc.
  next();
};
