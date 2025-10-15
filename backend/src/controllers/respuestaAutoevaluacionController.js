const pool = require('../../config/database');

exports.getAllRespuestasAutoevaluacion = async (req, res) => {
  try {
    let sql = 'SELECT * FROM respuestasautoevaluacion';
    let params = [];
    if (req.query.autoevaluacionid) {
      sql += ' WHERE autoevaluacionid = ?';
      params = [req.query.autoevaluacionid];
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRespuestaById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM respuestasautoevaluacion WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Respuesta not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRespuestaAutoevaluacion = async (req, res) => {
  try {
    const { autoevaluacionId, preguntaid, respuesta, puntaje } = req.body;
    const [result] = await pool.query(
      'INSERT INTO respuestasautoevaluacion (autoevaluacionid, preguntaid, respuesta, puntaje) VALUES (?, ?, ?, ?)',
      [autoevaluacionid, preguntaid, respuesta, puntaje]
    );
    res.json({ id: result.insertid, autoevaluacionid, preguntaid, respuesta, puntaje });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
