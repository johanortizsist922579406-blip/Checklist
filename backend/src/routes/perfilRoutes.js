const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const pool = require('../../config/database');

const isProduction = process.env.NODE_ENV === 'production';

router.use(verifyToken);

router.get('/mi-perfil', async (req, res) => {
  try {
    const usuarioId = req.user.id;

    let query = isProduction
      ? `SELECT u.*, a.nombre as area_nombre 
         FROM usuarios u 
         LEFT JOIN areas a ON u.areaid = a.id 
         WHERE u.id = $1`
      : `SELECT u.*, a.nombre as area_nombre 
         FROM usuarios u 
         LEFT JOIN areas a ON u.areaid = a.id 
         WHERE u.id = ?`;

    const userResult = await pool.query(query, [usuarioId]);
    const usuario = isProduction ? userResult.rows[0] : userResult[0][0];

    query = isProduction
      ? `SELECT dia_semana, hora_entrada_esperada, hora_salida_esperada 
         FROM horarios_trabajadores 
         WHERE usuario_id = $1 AND activo = true 
         ORDER BY dia_semana`
      : `SELECT dia_semana, hora_entrada_esperada, hora_salida_esperada 
         FROM horarios_trabajadores 
         WHERE usuario_id = ? AND activo = true 
         ORDER BY dia_semana`;

    const horariosResult = await pool.query(query, [usuarioId]);
    const horarios = isProduction ? horariosResult.rows : horariosResult[0];

    query = isProduction
      ? `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM horatotal) / 3600), 0) as horas_totales
         FROM asistencias 
         WHERE usuario_id = $1 AND horatotal IS NOT NULL`
      : `SELECT COALESCE(SUM(TIME_TO_SEC(horatotal) / 3600), 0) as horas_totales
         FROM asistencias 
         WHERE usuario_id = ? AND horatotal IS NOT NULL`;

    const horasResult = await pool.query(query, [usuarioId]);
    const horasTotales = isProduction ? horasResult.rows[0].horas_totales : horasResult[0][0].horas_totales;

    query = isProduction
      ? `SELECT fecha, puntaje_total, observaciones
         FROM autoevaluacion 
         WHERE usuario_id = $1 
         ORDER BY fecha DESC 
         LIMIT 10`
      : `SELECT fecha, puntaje_total, observaciones
         FROM autoevaluacion 
         WHERE usuario_id = ? 
         ORDER BY fecha DESC 
         LIMIT 10`;

    const autoevalResult = await pool.query(query, [usuarioId]);
    const autoevaluaciones = isProduction ? autoevalResult.rows : autoevalResult[0];

    query = isProduction
      ? `SELECT 
           e.puntaje_total,
           e.comentarios,
           e.fecha_evaluacion,
           e.tipo_evaluacion,
           u.nombre as evaluador_nombre
         FROM evaluacion_companeros e
         JOIN usuarios u ON e.evaluador_id = u.id
         WHERE e.evaluado_id = $1
         ORDER BY e.fecha_evaluacion DESC
         LIMIT 20`
      : `SELECT 
           e.puntaje_total,
           e.comentarios,
           e.fecha_evaluacion,
           e.tipo_evaluacion,
           u.nombre as evaluador_nombre
         FROM evaluacion_companeros e
         JOIN usuarios u ON e.evaluador_id = u.id
         WHERE e.evaluado_id = ?
         ORDER BY e.fecha_evaluacion DESC
         LIMIT 20`;

    const evalRecibidas = await pool.query(query, [usuarioId]);
    const evaluacionesRecibidas = isProduction ? evalRecibidas.rows : evalRecibidas[0];

    const promedioEval = evaluacionesRecibidas.length > 0
      ? (evaluacionesRecibidas.reduce((sum, e) => sum + parseFloat(e.puntaje_total), 0) / evaluacionesRecibidas.length).toFixed(2)
      : 0;

    query = isProduction
      ? `SELECT COALESCE(SUM(tardanza_minutos), 0) as tardanza_total
         FROM asistencias 
         WHERE usuario_id = $1`
      : `SELECT COALESCE(SUM(tardanza_minutos), 0) as tardanza_total
         FROM asistencias 
         WHERE usuario_id = ?`;

    const tardanzaResult = await pool.query(query, [usuarioId]);
    const tardanzaTotal = isProduction ? tardanzaResult.rows[0].tardanza_total : tardanzaResult[0][0].tardanza_total;

    res.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        rol: usuario.rol,
        area: usuario.area_nombre,
        genero: usuario.genero
      },
      horarios: horarios,
      horasTotales: parseFloat(horasTotales).toFixed(2),
      autoevaluaciones: autoevaluaciones,
      evaluacionesRecibidas: evaluacionesRecibidas,
      promedioEvaluaciones: promedioEval,
      tardanzaTotal: parseInt(tardanzaTotal)
    });

  } catch (error) {
    console.error('Error obtener perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
