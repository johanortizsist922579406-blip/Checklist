const pool = require('../../config/database');
const { executeQuery } = require('../utils/dbHelper');

exports.getAllAsistencias = async (req, res) => {
  try {
    const usuarioid = req.user.id;

    const [rows] = await executeQuery(
      pool,
      `SELECT 
         id,
         usuarioid,
         DATE(fecha) AS fecha,
         horaentrada::time AS horaentrada,
         horasalida::time AS horasalida,
         estado,
         to_char(horatotal, 'HH24:MI:SS') AS horatotal
       FROM asistencias
       WHERE usuarioid = ?
       ORDER BY fecha DESC`,
      [usuarioid]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error en getAllAsistencias:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.marcarEntrada = async (req, res) => {
  try {
    const usuarioid = req.user.id;
    const { horaLocal } = req.body; // "HH:MM:SS"

    if (!horaLocal) {
      return res.status(400).json({ error: 'Falta horaLocal en la petición' });
    }

    let asistenciaId;

    const [existentes] = await executeQuery(
      pool,
      `SELECT id FROM asistencias
       WHERE usuarioid = ? AND DATE(fecha) = CURRENT_DATE`,
      [usuarioid]
    );

    if (existentes.length) {
      asistenciaId = existentes[0].id;
    } else {
      const [result] = await executeQuery(
        pool,
        `INSERT INTO asistencias (usuarioid, fecha, horaentrada, estado)
         VALUES (?, CURRENT_DATE, $1::time, ?)
         RETURNING id`,
        [usuarioid, horaLocal, 'En jornada']
      );
      asistenciaId = result[0].id;
    }

    const [tramosAbiertos] = await executeQuery(
      pool,
      `SELECT id FROM asistencia_tramos
       WHERE asistenciaid = ? AND horasalida IS NULL`,
      [asistenciaId]
    );

    if (tramosAbiertos.length) {
      return res.status(400).json({ error: 'Ya tienes un tramo de asistencia en curso' });
    }

    const [nuevoTramo] = await executeQuery(
      pool,
      `INSERT INTO asistencia_tramos (asistenciaid, horaentrada)
       VALUES (?, $1::time)
       RETURNING id`,
      [asistenciaId, horaLocal]
    );

    const tramoId = nuevoTramo[0].id;

    return res.json({
      message: 'Entrada registrada',
      asistenciaId,
      tramoId
    });
  } catch (err) {
    console.error('Error en marcarEntrada:', err);
    return res.status(500).json({ error: 'Error interno al marcar entrada' });
  }
};

exports.marcarSalida = async (req, res) => {
  try {
    const usuarioid = req.user.id;
    const { horaLocal } = req.body; // "HH:MM:SS"

    if (!horaLocal) {
      return res.status(400).json({ error: 'Falta horaLocal en la petición' });
    }

    const [asisRows] = await executeQuery(
      pool,
      `SELECT id FROM asistencias
       WHERE usuarioid = ? AND DATE(fecha) = CURRENT_DATE`,
      [usuarioid]
    );

    if (!asisRows.length) {
      return res.status(404).json({ error: 'No hay asistencia registrada hoy' });
    }

    const asistenciaId = asisRows[0].id;

    const [tramosAbiertos] = await executeQuery(
      pool,
      `SELECT id FROM asistencia_tramos
       WHERE asistenciaid = ? AND horasalida IS NULL`,
      [asistenciaId]
    );

    if (!tramosAbiertos.length) {
      return res.status(404).json({ error: 'No hay tramo de asistencia en curso' });
    }

    const tramoId = tramosAbiertos[0].id;

    await executeQuery(
      pool,
      `UPDATE asistencia_tramos
       SET horasalida = $1::time
       WHERE id = ?`,
      [horaLocal, tramoId]
    );

    await executeQuery(
      pool,
      `UPDATE asistencias
       SET horasalida = $1::time
       WHERE id = ?`,
      [horaLocal, asistenciaId]
    );

    const [sumRows] = await executeQuery(
      pool,
      `SELECT SUM(EXTRACT(EPOCH FROM (horasalida - horaentrada))) AS segundos_totales
       FROM asistencia_tramos
       WHERE asistenciaid = ? AND horasalida IS NOT NULL`,
      [asistenciaId]
    );

    const segundosTotalesRaw = sumRows[0]?.segundos_totales || 0;
    const segundosTotales = Math.floor(segundosTotalesRaw);

    await executeQuery(
      pool,
      `UPDATE asistencias
       SET horatotal = (INTERVAL '1 second' * ?),
           estado    = ?
       WHERE id = ?`,
      [segundosTotales, 'Presente', asistenciaId]
    );

    res.json({
      message: 'Salida registrada',
      asistenciaId,
      segundosTotales
    });

  } catch (err) {
    console.error('Error en marcarSalida:', err);
    res.status(500).json({ error: err.message });
  }
};
