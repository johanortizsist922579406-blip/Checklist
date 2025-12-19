const pool = require('../../config/database');

exports.getAllPreguntas = async (req, res) => {
  try {
    let sql = 'SELECT * FROM preguntas';
    let params = [];
    if (req.query.areaid) {
      sql += ' WHERE areaid = ?';
      params = [req.query.areaid];
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPreguntaById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM preguntas WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Pregunta not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPregunta = async (req, res) => {
  try {
    const { areaid, pregunta, orden, activa } = req.body;
    const [result] = await pool.query(
      'INSERT INTO preguntas (areaid, pregunta, orden, activa) VALUES (?, ?, ?, ?)',
      [areaid, pregunta, orden, activa ?? 1]
    );
    res.json({ id: result.insertid, areaid, pregunta, orden, activa });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
