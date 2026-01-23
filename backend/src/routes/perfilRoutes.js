const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
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
         WHERE usuarioid = $1 AND horatotal IS NOT NULL`
      : `SELECT COALESCE(SUM(TIME_TO_SEC(horatotal) / 3600), 0) as horas_totales
         FROM asistencias 
         WHERE usuarioid = ? AND horatotal IS NOT NULL`;

    const horasResult = await pool.query(query, [usuarioId]);
    const horasTotales = isProduction ? horasResult.rows[0].horas_totales : horasResult[0][0].horas_totales;

    query = isProduction
    ? `SELECT 
       fechaevaluacion       AS fecha,
       puntajetotal          AS puntaje_total,
       quincena,
       mensajemotivacional   AS observaciones
     FROM autoevaluaciones
     WHERE usuarioid = $1 
     ORDER BY fechaevaluacion DESC 
     LIMIT 10`
    : `SELECT 
       fecha                 AS fecha,
       puntajetotal          AS puntaje_total,
       quincena,
       mensajemotivacional   AS observaciones
     FROM autoevaluacion 
     WHERE usuarioid = ? 
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
         WHERE usuarioid = $1`
      : `SELECT COALESCE(SUM(tardanza_minutos), 0) as tardanza_total
         FROM asistencias 
         WHERE usuarioid = ?`;

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

router.post('/subir-fondo', upload.single('fondoImagen'), async (req, res) => {
  try {
    const usuarioId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    const rutaFondo = `/assets/uploads/fondos/${req.file.filename}`;

    const query = isProduction
      ? `UPDATE usuarios SET fondo_perfil = $1 WHERE id = $2`
      : `UPDATE usuarios SET fondo_perfil = ? WHERE id = ?`;

    await pool.query(query, [rutaFondo, usuarioId]);

    const queryAnterior = isProduction
      ? `SELECT fondo_perfil FROM usuarios WHERE id = $1`
      : `SELECT fondo_perfil FROM usuarios WHERE id = ?`;
    
    const result = await pool.query(queryAnterior, [usuarioId]);
    const fondoAnterior = isProduction ? result.rows[0]?.fondo_perfil : result[0][0]?.fondo_perfil;

    if (fondoAnterior && fondoAnterior.startsWith('/assets/uploads/')) {
      const rutaAnterior = path.join(__dirname, '../../../frontend', fondoAnterior);
      if (fs.existsSync(rutaAnterior)) {
        fs.unlinkSync(rutaAnterior);
      }
    }

    res.json({
      ok: true,
      mensaje: 'Fondo actualizado correctamente',
      rutaFondo: rutaFondo
    });

  } catch (error) {
    console.error('Error subir fondo:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
