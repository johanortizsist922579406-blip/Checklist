const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const googleSheetsService = require('../services/googleSheetsService');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const pool = require('../config/database');

router.get('/horas', verifyToken, verifyAdmin, adminController.getHoras);
router.get('/puntajes', verifyToken, verifyAdmin, adminController.getPuntajes);

router.post('/export-horas-sheets', verifyToken, verifyAdmin, async (req, res) => {
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

    const result = await googleSheetsService.exportHoras(rows);

    res.json({
      success: true,
      message: `${rows.length} registros exportados a Google Sheets`,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${result.spreadsheetId}/edit`,
      updatedRows: result.updatedRows
    });

  } catch (err) {
    console.error('❌ Error en export-horas-sheets:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

module.exports = router;
