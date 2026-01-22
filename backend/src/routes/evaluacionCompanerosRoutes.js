const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { executeQuery } = require('../utils/dbHelper');
const pool = require('../../config/database');

const isProduction = process.env.NODE_ENV === 'production';

router.use(verifyToken);

router.get('/puede-evaluar', async (req, res) => {
  try {
    const evaluadorId = req.user.id;

    const query = isProduction
      ? `SELECT ultima_evaluacion FROM control_evaluacion_companeros WHERE usuario_id = $1`
      : `SELECT ultima_evaluacion FROM control_evaluacion_companeros WHERE usuario_id = ?`;

    const result = await pool.query(query, [evaluadorId]);
    const control = isProduction ? result.rows : result[0];

    if (control.length === 0) {
      return res.json({ puedeEvaluar: true, diasRestantes: 0 });
    }

    const ultimaEvaluacion = new Date(control[0].ultima_evaluacion);
    const ahora = new Date();
    
    const milisegundosDif = ahora - ultimaEvaluacion;
    const diasTranscurridos = Math.floor(milisegundosDif / (1000 * 60 * 60 * 24));

    console.log('📅 Días transcurridos:', diasTranscurridos);

    if (diasTranscurridos >= 3) {
      return res.json({ puedeEvaluar: true, diasRestantes: 0 });
    } else {
      const diasRestantes = 3 - diasTranscurridos;
      return res.json({ 
        puedeEvaluar: false, 
        diasRestantes: diasRestantes 
      });
    }

  } catch (error) {
    console.error('Error verificar puede evaluar:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/personas-evaluables', async (req, res) => {
  try {
    const evaluadorId = req.user.id;

    const query = isProduction
      ? `SELECT 
           u.id,
           u.nombre,
           u.apellido,
           u.rol,
           a.nombre as area
         FROM usuarios u
         LEFT JOIN areas a ON u.areaid = a.id
         WHERE u.id != $1 
           AND u.activo = true
           AND (
             u.areaid = (SELECT areaid FROM usuarios WHERE id = $1)
             OR LOWER(u.rol) LIKE '%gerente%'
             OR LOWER(u.rol) LIKE '%admin%'
           )
         ORDER BY u.nombre`
      : `SELECT 
           u.id,
           u.nombre,
           u.apellido,
           u.rol,
           a.nombre as area
         FROM usuarios u
         LEFT JOIN areas a ON u.areaid = a.id
         WHERE u.id != ? 
           AND u.activo = 'SI'
           AND (
             u.areaid = (SELECT areaid FROM usuarios WHERE id = ?)
             OR LOWER(u.rol) LIKE '%gerente%'
             OR LOWER(u.rol) LIKE '%admin%'
           )
         ORDER BY u.nombre`;

    const params = isProduction ? [evaluadorId] : [evaluadorId, evaluadorId];
    const result = await pool.query(query, params);
    const companeros = isProduction ? result.rows : result[0];

    res.json({ 
      companeros: companeros.map(c => ({
        id: c.id,
        nombre: `${c.nombre} ${c.apellido || ''}`.trim(),
        rol: c.rol || 'Usuario',
        area: c.area || 'Sin área'
      }))
    });

  } catch (error) {
    console.error('Error obtener personas evaluables:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const evaluadorId = req.user.id;
    const { evaluadoId, tipoEvaluacion, respuestas, comentarios } = req.body;

    console.log('📝 Creando evaluación:', { evaluadorId, evaluadoId, tipoEvaluacion });

    if (!evaluadoId || !respuestas || respuestas.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const puntajeTotal = respuestas.reduce((sum, r) => sum + r.respuesta, 0);

    let query, params, result;
    if (isProduction) {
      query = `INSERT INTO evaluacion_companeros 
               (evaluador_id, evaluado_id, tipo_evaluacion, puntaje_total, comentarios)
               VALUES ($1, $2, $3, $4, $5) RETURNING id`;
      params = [evaluadorId, evaluadoId, tipoEvaluacion, puntajeTotal, comentarios || ''];
    } else {
      query = `INSERT INTO evaluacion_companeros 
               (evaluador_id, evaluado_id, tipo_evaluacion, puntaje_total, comentarios)
               VALUES (?, ?, ?, ?, ?)`;
      params = [evaluadorId, evaluadoId, tipoEvaluacion, puntajeTotal, comentarios || ''];
    }

    console.log('📊 Insertando evaluación...');
    result = await pool.query(query, params);
    const evaluacionId = isProduction ? result.rows[0].id : result[0].insertId;

    console.log('✅ Evaluación creada, ID:', evaluacionId);

    for (const resp of respuestas) {
      if (isProduction) {
        query = `INSERT INTO respuestas_evaluacion_companeros (evaluacion_id, pregunta, respuesta)
                 VALUES ($1, $2, $3)`;
        params = [evaluacionId, resp.pregunta, resp.respuesta];
      } else {
        query = `INSERT INTO respuestas_evaluacion_companeros (evaluacion_id, pregunta, respuesta)
                 VALUES (?, ?, ?)`;
        params = [evaluacionId, resp.pregunta, resp.respuesta];
      }
      await pool.query(query, params);
    }

    console.log('✅ Respuestas guardadas');

    if (isProduction) {
      query = `INSERT INTO control_evaluacion_companeros (usuario_id, ultima_evaluacion)
               VALUES ($1, CURRENT_TIMESTAMP)
               ON CONFLICT (usuario_id) 
               DO UPDATE SET ultima_evaluacion = CURRENT_TIMESTAMP`;
      params = [evaluadorId];
    } else {
      query = `INSERT INTO control_evaluacion_companeros (usuario_id, ultima_evaluacion)
               VALUES (?, NOW())
               ON DUPLICATE KEY UPDATE ultima_evaluacion = NOW()`;
      params = [evaluadorId];
    }

    await pool.query(query, params);

    console.log('✅ Control actualizado');

    res.json({
      ok: true,
      message: 'Evaluación guardada correctamente',
      evaluacionId: evaluacionId,
      puntaje: puntajeTotal
    });

  } catch (error) {
    console.error('❌ Error crear evaluación:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});


router.get('/historial', async (req, res) => {
  try {
    const evaluadorId = req.user.id;

    const query = isProduction
      ? `SELECT 
           e.id,
           e.puntaje_total,
           e.comentarios,
           e.fecha_evaluacion,
           e.tipo_evaluacion,
           u.nombre as evaluado_nombre,
           u.apellido as evaluado_apellido
         FROM evaluacion_companeros e
         JOIN usuarios u ON e.evaluado_id = u.id
         WHERE e.evaluador_id = $1
         ORDER BY e.fecha_evaluacion DESC`
      : `SELECT 
           e.id,
           e.puntaje_total,
           e.comentarios,
           e.fecha_evaluacion,
           e.tipo_evaluacion,
           u.nombre as evaluado_nombre,
           u.apellido as evaluado_apellido
         FROM evaluacion_companeros e
         JOIN usuarios u ON e.evaluado_id = u.id
         WHERE e.evaluador_id = ?
         ORDER BY e.fecha_evaluacion DESC`;

    const result = await pool.query(query, [evaluadorId]);
    const historial = isProduction ? result.rows : result[0];

    res.json({ historial });

  } catch (error) {
    console.error('Error obtener historial:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
