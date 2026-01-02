// controllers/adminController.js

const pool = require('../../config/database');
const googleSheetsService = require('../services/googleSheetsService');

// ✅ EXISTENTE: Obtener horas (para filtrar en el panel)
exports.getHoras = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, nombre } = req.query;

    let sql = `
      SELECT 
        u.nombre,
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

// ✅ EXISTENTE: Obtener puntajes
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

// ✅ NUEVO: Exportar TODOS los datos de horas a Google Sheets
exports.exportHorasSheets = async (req, res) => {
  try {
    console.log('📊 Iniciando exportación de horas a Google Sheets...');

    const sql = `
      SELECT 
        u.nombre,
        u.apellido,
        DATE(a.fecha) AS fecha,
        TIME(CONVERT_TZ(a.horaentrada, '+00:00', '-05:00')) AS horaentrada,
        TIME(CONVERT_TZ(a.horasalida, '+00:00', '-05:00')) AS horasalida,
        a.horatotal
      FROM asistencias a
      JOIN usuarios u ON a.usuarioid = u.id
      ORDER BY a.fecha DESC, u.nombre ASC
    `;

    const [rows] = await pool.query(sql);

    console.log(`✅ Obtenidos ${rows.length} registros de todos los usuarios`);

    // Enviar a Google Sheets
    const result = await googleSheetsService.exportHoras(rows);

    res.json({
      success: true,
      message: `${rows.length} registros exportados a Google Sheets`,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${result.spreadsheetId}/edit`,
      updatedRows: result.updatedRows
    });

  } catch (err) {
    console.error('❌ Error en exportHorasSheets:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// ✅ EXISTENTE: Obtener solo las asistencias del usuario actual (para su propia página)
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
