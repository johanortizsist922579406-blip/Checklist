const pool = require('../db');

exports.getAllAutoevaluaciones = async (req, res) => {
  try {
    let sql = 'SELECT * FROM autoevaluaciones';
    let params = [];
    if (req.query.usuarioid) {
      sql += ' WHERE usuarioid = ?';
      params = [req.query.usuarioid];
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAutoevaluacionById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM autoevaluaciones WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Autoevaluacion not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.crearAutoevaluacion = async (req, res) => {
  try {
    // Agregar mensajemotivacional al destructuring
    const { usuarioid, puntajetotal, quincena, mensajemotivacional, respuestas } = req.body;

    if (!quincena) {
      return res.status(400).json({ error: "El campo 'quincena' es obligatorio." });
    }

    const fechaEvaluacion = new Date();
    const fechaFormateada = fechaEvaluacion.toISOString().slice(0, 19).replace('T', ' ');

    // Agregar mensajemotivacional en el INSERT
    const [result] = await pool.query(
      'INSERT INTO autoevaluaciones (usuarioid, fechaevaluacion, puntajetotal, quincena, mensajemotivacional, completada) VALUES (?, ?, ?, ?, ?, ?)',
      [usuarioid, fechaFormateada, puntajetotal, quincena, mensajemotivacional, 'SI']
    );

    const autoevaluacionid = result.insertId;

    for (const r of respuestas) {
      await pool.query(
        'INSERT INTO respuestasautoevaluacion (autoevaluacionid, preguntaid, respuesta, puntaje) VALUES (?, ?, ?, ?)',
        [autoevaluacionid, r.preguntaid, r.respuesta, r.puntaje]
      );
    }

    res.json({
      message: 'Autoevaluación guardada correctamente',
      id: autoevaluacionid,
      puntaje: puntajetotal,
      mensajemotivacional: mensajemotivacional
    });
  } catch (err) {
    console.error("❌ ERROR EN BACKEND:", err);
    res.status(500).json({ error: err.message });
  }
};
