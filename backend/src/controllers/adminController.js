const pool = require('../../config/database');

exports.exportarTodosLosHoras = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;

    let sql = `
      SELECT 
        u.nombre,
        u.apellido,
        DATE(a.fecha) AS fecha,
        TIME(CONVERT_TZ(a.horaentrada, '+00:00', '-05:00')) AS horaentrada,
        TIME(CONVERT_TZ(a.horasalida, '+00:00', '-05:00')) AS horasalida,
        a.horatotal
      FROM asistencias a
      JOIN usuarios u ON a.usuarioid = u.id
      WHERE 1=1
    `;
    const params = [];

    if (fechaDesde) {
      sql += ' AND DATE(a.fecha) >= ?';
      params.push(fechaDesde);
    }
    if (fechaHasta) {
      sql += ' AND DATE(a.fecha) <= ?';
      params.push(fechaHasta);
    }

    sql += ' ORDER BY a.fecha DESC, u.nombre ASC';

    const [rows] = await pool.query(sql, params);
    
    console.log(`✅ Exportando ${rows.length} registros de TODAS las personas`);
    
    res.json(rows);
  } catch (err) {
    console.error('Error exportarTodosLosHoras =>', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ EXISTENTE: Obtener solo las asistencias del usuario logueado
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