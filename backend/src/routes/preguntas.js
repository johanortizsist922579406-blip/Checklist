const express = require('express');
const router = express.Router();
const pool = require('../../config/database');

router.get('/', async (req, res) => {
  const areaid = req.query.areaid;
  if (!areaid) {
    return res.status(400).json({ error: 'Sin areaid' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM preguntas WHERE areaid = ? AND activa = 1 ORDER BY orden',
      [areaid]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
