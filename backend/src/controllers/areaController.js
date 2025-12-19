const pool = require('../../config/database');

exports.getAllAreas = async (req, res) => {
  try {
    console.log('GET /api/areas llamado');

    const [rows] = await pool.query('SELECT * FROM areas WHERE activo = 1');
    res.json(rows);
  } catch (err) {
    console.error('ERROR /api/areas =>', err);
    res.status(500).json({ error: err.message || 'Error interno en /api/areas' });
  }
};
exports.getAreaById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM areas WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Area not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createArea = async (req, res) => {
  try {
    const { nombre } = req.body;
    const [result] = await pool.query('INSERT INTO areas (nombre) VALUES (?)', [nombre]);
    res.json({ id: result.insertid, nombre });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
