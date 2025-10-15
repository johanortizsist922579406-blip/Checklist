const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 peticiones por IP por minuto
  message: 'Demasiadas peticiones, intenta más tarde'
});
