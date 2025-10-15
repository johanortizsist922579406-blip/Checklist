const pool = require('../../config/database');

// Devuelve TODOS los rankings, filtrando por quincena si se pasa (?quincena=actual → '1ra')
exports.getAllRankings = async (req, res) => {
  try {
    let sql = 'SELECT * FROM rankingquincenal';
    let params = [];
    if (req.query.quincena) {
      let quincena = req.query.quincena;
      if (quincena === 'actual') {
        quincena = '1ra';
      }
      sql += ' WHERE quincena = ?';
      params = [quincena];
    }
    sql += ' ORDER BY posicion ASC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Devuelve el ranking de UN usuario por su id
exports.getRankingById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rankingquincenal WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Ranking not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// RECALCULA rankings para una quincena
exports.recalcularRanking = async (req, res) => {
  try {
    const quincena = req.query.quincena || '1ra';
    // INICIALIZA LA VARIABLE EN MYSQL
    await pool.query('SET @pos := 0');
    // ELIMINA ranking ANTIGUO
    await pool.query('DELETE FROM rankingquincenal WHERE quincena = ?', [quincena]);
    // INSERTA ranking NUEVO
    await pool.query(`
      INSERT INTO rankingquincenal (usuarioid, quincena, puntajetotal, posicion, tieneruleta, fechacalculo)
      SELECT
        a.usuarioid,
        a.quincena,
        AVG(a.puntajetotal) as puntajetotal,
        (@pos := @pos + 1) as posicion,
        IF(@pos <= 3, 'SI', 'NO') as tieneruleta,
        NOW()
      FROM autoevaluaciones a
      INNER JOIN usuarios u ON a.usuarioid = u.id
      WHERE a.completada = 'SI'
        AND a.quincena = ?
      GROUP BY a.usuarioid, a.quincena
      ORDER BY AVG(a.puntajetotal) DESC
    `, [quincena]);
    res.json({ ok: true, message: `Ranking recalculado para quincena ${quincena}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
