const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const pool = require('../../config/database');

const isProduction = process.env.NODE_ENV === 'production';

router.use(verifyToken);

router.get('/verificar-elegibilidad', async (req, res) => {
  try {
    const usuarioId = req.user.id;

    let query;
    if (isProduction) {
      query = `
        SELECT 
          COALESCE(SUM(EXTRACT(EPOCH FROM horatotal) / 3600), 0) as horas_totales
        FROM asistencias
        WHERE usuarioid = $1 AND horatotal IS NOT NULL
      `;
    } else {
      query = `
        SELECT 
          COALESCE(SUM(TIME_TO_SEC(horatotal) / 3600), 0) as horas_totales
        FROM asistencias
        WHERE usuarioid = ? AND horatotal IS NOT NULL
      `;
    }

    const result = await pool.query(query, [usuarioId]);
    const horasTotales = isProduction ? result.rows[0].horas_totales : result[0][0].horas_totales;

    const queryConstancia = isProduction
      ? `SELECT id, fecha_generacion FROM constancias WHERE usuario_id = $1`
      : `SELECT id, fecha_generacion FROM constancias WHERE usuario_id = ?`;

    const constanciaResult = await pool.query(queryConstancia, [usuarioId]);
    const constanciaExistente = isProduction ? constanciaResult.rows : constanciaResult[0];

    const elegible = horasTotales >= 520;
    const yaReclamo = constanciaExistente.length > 0;

    res.json({
      elegible: elegible,
      yaReclamo: yaReclamo,
      horasTotales: parseFloat(horasTotales).toFixed(2),
      horasFaltantes: elegible ? 0 : (520 - horasTotales).toFixed(2),
      fechaConstancia: yaReclamo ? constanciaExistente[0].fecha_generacion : null
    });

  } catch (error) {
    console.error('Error verificar elegibilidad:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/solicitar', async (req, res) => {
  try {
    const usuarioId = req.user.id;

    let query;
    if (isProduction) {
      query = `
        SELECT 
          COALESCE(SUM(EXTRACT(EPOCH FROM horatotal) / 3600), 0) as horas_totales
        FROM asistencias
        WHERE usuarioid = $1 AND horatotal IS NOT NULL
      `;
    } else {
      query = `
        SELECT 
          COALESCE(SUM(TIME_TO_SEC(horatotal) / 3600), 0) as horas_totales
        FROM asistencias
        WHERE usuarioid = ? AND horatotal IS NOT NULL
      `;
    }

    const result = await pool.query(query, [usuarioId]);
    const horasTotales = isProduction ? result.rows[0].horas_totales : result[0][0].horas_totales;

    if (horasTotales < 520) {
      return res.status(400).json({ 
        error: `Aún no alcanzas las 520 horas. Llevas ${horasTotales.toFixed(2)} horas.` 
      });
    }

    const queryCheck = isProduction
      ? `SELECT id FROM constancias WHERE usuario_id = $1`
      : `SELECT id FROM constancias WHERE usuario_id = ?`;

    const checkResult = await pool.query(queryCheck, [usuarioId]);
    const yaExiste = isProduction ? checkResult.rows : checkResult[0];

    if (yaExiste.length > 0) {
      return res.status(400).json({ error: 'Ya solicitaste tu constancia anteriormente' });
    }

    const queryInsert = isProduction
      ? `INSERT INTO constancias (usuario_id, horas_acumuladas, estado)
         VALUES ($1, $2, 'pendiente') RETURNING id`
      : `INSERT INTO constancias (usuario_id, horas_acumuladas, estado)
         VALUES (?, ?, 'pendiente')`;

    const insertResult = await pool.query(queryInsert, [usuarioId, horasTotales]);
    const constanciaId = isProduction ? insertResult.rows[0].id : insertResult[0].insertId;

    res.json({
      ok: true,
      mensaje: 'Solicitud de constancia registrada. Contacta a Gerencia para recibirla.',
      constanciaId: constanciaId,
      horasAcumuladas: parseFloat(horasTotales).toFixed(2)
    });

  } catch (error) {
    console.error('Error solicitar constancia:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
