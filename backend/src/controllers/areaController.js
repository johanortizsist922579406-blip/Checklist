const pool = require('../../config/database');

exports.getAllAreas = async (req, res) => {
  try {
    console.log('GET /api/areas llamado');

    const [rows] = await pool.query(
      'SELECT * FROM areas WHERE activo = 1 ORDER BY id'
    );

    return res.json(rows);
  } catch (err) {
    console.error('ERROR DETALLE /api/areas =>', err);
    return res.status(500).json({
      error: 'Error interno en /api/areas',
      detalle: err.message
    });
  }
};

exports.getAreaById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM areas WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Área no encontrada' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('ERROR /api/areas/:id =>', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.createArea = async (req, res) => {
  try {
    const { nombre } = req.body;

    const [result] = await pool.query(
      'INSERT INTO areas (nombre, activo) VALUES (?, 1)',
      [nombre]
    );

    return res.json({
      id: result.insertId,
      nombre,
      activo: 1
    });
  } catch (err) {
    console.error('ERROR POST /api/areas =>', err);
    return res.status(500).json({ error: err.message });
  }
};
