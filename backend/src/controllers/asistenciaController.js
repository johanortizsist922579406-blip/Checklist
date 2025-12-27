const pool = require('../../config/database');

exports.getAllAsistencias = async (req, res) => {
  try {
    const usuarioid = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
        id,
        usuarioid,
        DATE(fecha) AS fecha,
        TIME(horaentrada) AS horaentrada,
        TIME(horasalida) AS horasalida,
        estado,
        horatotal
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

    let asistenciaId;
    const [existentes] = await pool.query(
      `SELECT id FROM asistencias
       WHERE usuarioid = ? AND fecha = CURDATE()`,
      [usuarioid]
    );

    if (existentes.length) {
      asistenciaId = existentes[0].id;
    } else {
      const [result] = await pool.query(
        `INSERT INTO asistencias (usuarioid, fecha, horaentrada, estado)
         VALUES (?, CURDATE(), CURTIME(), 'En jornada')`,
        [usuarioid]
      );
      asistenciaId = result.insertId;
    }

    const [tramosAbiertos] = await pool.query(
      `SELECT id FROM asistencia_tramos
       WHERE asistenciaid = ? AND horasalida IS NULL`,
      [asistenciaId]
    );

    if (tramosAbiertos.length) {
      return res.status(400).json({ error: 'Ya tienes un tramo de asistencia en curso' });
    }

    const [nuevoTramo] = await pool.query(
      `INSERT INTO asistencia_tramos (asistenciaid, horaentrada)
       VALUES (?, CURTIME())`,
      [asistenciaId]
    );

    return res.json({
      message: 'Entrada registrada',
      asistenciaId,
      tramoId: nuevoTramo.insertId
    });
  } catch (err) {
    console.error('Error en marcarEntrada:', err);
    return res.status(500).json({ error: 'Error interno al marcar entrada' });
  }
};

exports.marcarSalida = async (req, res) => {
  try {
    const usuarioid = req.user.id;

    const [asisRows] = await pool.query(
      `SELECT id FROM asistencias
       WHERE usuarioid = ? AND fecha = CURDATE()`,
      [usuarioid]
    );

    if (!asisRows.length) {
      return res.status(404).json({ error: 'No hay asistencia registrada hoy' });
    }

    const asistenciaId = asisRows[0].id;

    const [tramosAbiertos] = await pool.query(
      `SELECT id FROM asistencia_tramos
       WHERE asistenciaid = ? AND horasalida IS NULL`,
      [asistenciaId]
    );

    if (!tramosAbiertos.length) {
      return res.status(404).json({ error: 'No hay tramo de asistencia en curso' });
    }

    const tramoId = tramosAbiertos[0].id;

    await pool.query(
      `UPDATE asistencia_tramos
       SET horasalida = CURTIME()
       WHERE id = ?`,
      [tramoId]
    );

    await pool.query(
      `UPDATE asistencias
       SET horasalida = CURTIME()
       WHERE id = ?`,
      [asistenciaId]
    );

    const [sumRows] = await pool.query(
      `SELECT SUM(TIMESTAMPDIFF(SECOND, horaentrada, horasalida)) AS segundos_totales
       FROM asistencia_tramos
       WHERE asistenciaid = ? AND horasalida IS NOT NULL`,
      [asistenciaId]
    );

    const segundosTotales = sumRows[0].segundos_totales || 0;

    await pool.query(
      `UPDATE asistencias
       SET horatotal = SEC_TO_TIME(?),
           estado = 'Presente'
       WHERE id = ?`,
      [segundosTotales, asistenciaId]
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
