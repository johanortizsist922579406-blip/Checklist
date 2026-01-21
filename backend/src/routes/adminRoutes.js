const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');
const pool = require('../../config/database'); 

router.get('/horas', verifyToken, verifyAdmin, adminController.getHoras);
router.get('/puntajes', verifyToken, verifyAdmin, adminController.getPuntajes);
router.post('/export-horas-sheets', verifyToken, verifyAdmin, adminController.exportHorasSheets);

router.get('/faltantes-hoy', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';

    let query;
    if (isProduction) {
      query = `
        SELECT 
          u.id,
          u.nombre,
          u.apellido,
          u.correo,
          a.nombre as area
        FROM usuarios u
        LEFT JOIN areas a ON u.areaid = a.id
        LEFT JOIN asistencias asi ON u.id = asi.usuarioid AND asi.fecha = CURRENT_DATE
        WHERE u.activo = true
          AND LOWER(u.rol) != 'admin'
          AND asi.id IS NULL
        ORDER BY u.nombre
      `;
    } else {
      query = `
        SELECT 
          u.id,
          u.nombre,
          u.apellido,
          u.correo,
          a.nombre as area
        FROM usuarios u
        LEFT JOIN areas a ON u.areaid = a.id
        LEFT JOIN asistencias asi ON u.id = asi.usuarioid AND DATE(asi.fecha) = CURDATE()
        WHERE u.activo = 'SI'
          AND LOWER(u.rol) != 'admin'
          AND asi.id IS NULL
        ORDER BY u.nombre
      `;
    }

    const result = await pool.query(query);
    const faltantes = isProduction ? result.rows : result[0];

    res.json({ 
      ok: true, 
      faltantes: faltantes,
      total: faltantes.length,
      fecha: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error obtener faltantes:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
