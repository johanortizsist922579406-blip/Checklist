const pool = require('../../config/database'); 

exports.getHoras = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, nombre } = req.query;

    let sql = `
      SELECT 
        u.nombre,
        DATE(CONVERT_TZ(a.fecha, '+00:00', '-05:00')) AS fecha,
        TIME(CONVERT_TZ(a.horaentrada, '+00:00', '-05:00')) AS horaentrada,
        TIME(CONVERT_TZ(a.horasalida, '+00:00', '-05:00')) AS horasalida,
        a.horatotal
      FROM asistencias a
      JOIN usuarios u ON a.usuarioid = u.id
      WHERE 1=1
    `;
    const params = [];

    if (fechaDesde) {
      sql += ' AND DATE(CONVERT_TZ(a.fecha, \'+00:00\', \'-05:00\')) >= ?';
      params.push(fechaDesde);
    }
    if (fechaHasta) {
      sql += ' AND DATE(CONVERT_TZ(a.fecha, \'+00:00\', \'-05:00\')) <= ?';
      params.push(fechaHasta);
    }
    if (nombre) {
      sql += ' AND u.nombre LIKE ?';
      params.push('%' + nombre + '%');
    }

    sql += ' ORDER BY a.fecha DESC, u.nombre ASC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error getHoras =>', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getPuntajes = async (req, res) => {
  try {
    const { nombre } = req.query;

    let sql = `
      SELECT u.nombre, r.quincena, r.puntajetotal, r.posicion
      FROM rankingquincenal r
      JOIN usuarios u ON r.usuarioid = u.id
      WHERE 1=1
    `;
    const params = [];

    if (nombre) {
      sql += ' AND u.nombre LIKE ?';
      params.push('%' + nombre + '%');
    }

    sql += ' ORDER BY r.puntajetotal DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
