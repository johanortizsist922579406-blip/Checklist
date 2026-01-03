const pool = require('../../config/database');
const { executeQuery } = require('../utils/dbHelper');

exports.getAllRespuestasAutoevaluacion = async (req, res) => {
  try {
    let sql = 'SELECT * FROM respuestasautoevaluacion';
    let params = [];
    
    if (req.query.autoevaluacionid) {
      sql += ' WHERE autoevaluacionid = ?';
      params = [req.query.autoevaluacionid];
    }
    
    const [rows] = await executeQuery(pool, sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRespuestaById = async (req, res) => {
  try {
    const [rows] = await executeQuery(
      pool,
      'SELECT * FROM respuestasautoevaluacion WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Respuesta not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRespuestaAutoevaluacion = async (req, res) => {
  try {
    const { autoevaluacionid, preguntaid, respuesta, puntaje } = req.body;
    
    const [result] = await executeQuery(
      pool,
      'INSERT INTO respuestasautoevaluacion (autoevaluacionid, preguntaid, respuesta, puntaje) VALUES (?, ?, ?, ?)',
      [autoevaluacionid, preguntaid, respuesta, puntaje]
    );
    
    const insertId = result.insertId || result[0]?.id;
    
    res.json({ 
      id: insertId, 
      autoevaluacionid, 
      preguntaid, 
      respuesta, 
      puntaje 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
