const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { executeQuery } = require('../utils/dbHelper');
const pool = require('../../config/database');

const isAdmin = (req, res, next) => {
  const rol = (req.user.rol || '').toLowerCase();
  if (rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};

router.use(verifyToken);
router.use(isAdmin);

router.get('/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const [horarios] = await executeQuery(
      pool,
      `SELECT * FROM horarios_trabajadores 
       WHERE usuario_id = ? ORDER BY dia_semana`,
      [usuarioId]
    );

    res.json(horarios);
  } catch (error) {
    console.error('Error obtener horarios:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { usuario_id, dia_semana, hora_entrada_esperada, hora_salida_esperada } = req.body;

    await executeQuery(
      pool,
      `INSERT INTO horarios_trabajadores (usuario_id, dia_semana, hora_entrada_esperada, hora_salida_esperada)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (usuario_id, dia_semana) 
       DO UPDATE SET hora_entrada_esperada = ?, hora_salida_esperada = ?`,
      [usuario_id, dia_semana, hora_entrada_esperada, hora_salida_esperada, hora_entrada_esperada, hora_salida_esperada]
    );

    res.json({ ok: true, mensaje: 'Horario guardado' });
  } catch (error) {
    console.error('Error guardar horario:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await executeQuery(
      pool,
      `DELETE FROM horarios_trabajadores WHERE id = ?`,
      [id]
    );

    res.json({ ok: true, mensaje: 'Horario eliminado' });
  } catch (error) {
    console.error('Error eliminar horario:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
