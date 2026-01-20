const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos de inicio de sesión. Espera 15 minutos.' },
  skipSuccessfulRequests: true
});

const registroLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de registro. Espera unos minutos.' }
});

router.post('/login', 
  loginLimiter,
  body('correo')
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty().withMessage('La contraseña es obligatoria'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        detalles: errors.array().map(e => e.msg) 
      });
    }
    next();
  },
  authController.login
);

router.post('/registro',
  registroLimiter,
  body('email')
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .trim()
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre es muy largo'),
  body('areaid')
    .isInt({ min: 1 }).withMessage('Área inválida'),
  body('genero')
    .optional()
    .isIn(['M', 'F']).withMessage('Género debe ser M o F'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        detalles: errors.array().map(e => e.msg) 
      });
    }
    next();
  },
  authController.registro
);

router.post('/cambiar-password',
  body('email')
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('passwordActual')
    .trim()
    .notEmpty().withMessage('Contraseña actual obligatoria'),
  body('passwordNueva')
    .trim()
    .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        detalles: errors.array().map(e => e.msg) 
      });
    }
    next();
  },
  authController.cambiarPassword
);

module.exports = router;
