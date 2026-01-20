const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const autoevaluacionController = require('../controllers/autoevaluacionController');
const googleSheetsService = require('../services/googleSheetsService');
const db = require('../../config/database');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/',
  verifyToken,
  body('usuarioid')
    .isInt({ min: 1 }).withMessage('ID de usuario inválido'),
  body('areaid')
    .isInt({ min: 1 }).withMessage('ID de área inválido'),
  body('puntajetotal')
    .isFloat({ min: 0, max: 100 }).withMessage('Puntaje total debe estar entre 0 y 100'),
  body('quincena')
    .optional()
    .custom(value => value === '1ra' || value === '2da' || value === null)
    .withMessage('Quincena debe ser 1ra, 2da o null'),
  body('respuestas')
    .isArray({ min: 1 }).withMessage('Debe enviar al menos una respuesta'),
  body('respuestas.*.preguntaid')
    .isInt({ min: 1 }).withMessage('ID de pregunta inválido'),
  body('respuestas.*.puntaje')
    .isFloat({ min: 1, max: 5 }).withMessage('Puntaje debe estar entre 1 y 5'),
  body('mensajemotivacional')
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage('Mensaje motivacional muy largo'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos inválidos en autoevaluación',
        detalles: errors.array().map(e => e.msg)
      });
    }
    next();
  },
  autoevaluacionController.crearAutoevaluacion
);

router.get('/', verifyToken, autoevaluacionController.getAllAutoevaluaciones);
router.get('/:id', verifyToken, autoevaluacionController.getAutoevaluacionById);

router.post('/export-horas-sheets', verifyToken, async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'Se requiere el userId' 
      });
    }

    const query = `
      SELECT 
        u.nombre,
        u.apellido,
        a.fecha,
        a.horaentrada,
        a.horasalida,
        a.horatotal
      FROM asistencias a
      INNER JOIN usuarios u ON a.usuarioid = u.id
      WHERE a.usuarioid = ?
      ORDER BY a.fecha DESC
    `;

    const [results] = await db.query(query, [userId]);

    if (results.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No hay datos de horas para exportar' 
      });
    }

    const result = await googleSheetsService.exportHoras(results);

    res.json({
      success: true,
      message: 'Exportación de horas exitosa',
      spreadsheetId: '1Q4-JZDZoI_V4oESvCFqqi1WP0V49qzDNU_5QkZbB7hs',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1Q4-JZDZoI_V4oESvCFqqi1WP0V49qzDNU_5QkZbB7hs/edit'
    });

  } catch (error) {
    console.error('Error en exportación de horas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al exportar horas a Google Sheets',
      error: error.message 
    });
  }
});

module.exports = router;
