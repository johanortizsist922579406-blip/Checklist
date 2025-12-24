const pool = require('../../config/database');
const { obtenerQuincenaActual } = require('../utils/quincenaCalculator');

// GET /api/rankings
exports.getAllRankings = async (req, res) => {
  try {
    let sql = `
      SELECT 
        r.id,
        r.usuarioid,
        r.quincena,
        r.puntajetotal,
        r.posicion,
        r.tieneruleta,
        r.fechacalculo,
        u.nombre AS nombre
      FROM rankingquincenal r
      JOIN usuarios u ON r.usuarioid = u.id
    `;
    let params = [];

    if (req.query.quincena) {
      let quincena = req.query.quincena;

      if (quincena === 'actual') {
        quincena = obtenerQuincenaActual();
      }

      sql += ' WHERE r.quincena = ?';
      params = [quincena];
    }

    sql += ' ORDER BY r.posicion ASC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/rankings/:id
exports.getRankingById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        r.*,
        u.nombre AS nombre
      FROM rankingquincenal r
      JOIN usuarios u ON r.usuarioid = u.id
      WHERE r.id = ?
      `,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Ranking not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/rankings/actualizar
exports.actualizarRankingUsuario = async (req, res) => {
  try {
    const { usuarioid, quincena, puntajetotal, posicion = 0, tieneruleta = 'NO' } = req.body;
    const fechacalculo = new Date();

    const [rows] = await pool.query(
      'SELECT puntajetotal FROM rankingquincenal WHERE usuarioid = ? AND quincena = ?',
      [usuarioid, quincena]
    );
    const puntajeAnterior = rows.length ? rows[0].puntajetotal : 0;
    const puntajeAcumulado = puntajeAnterior + puntajetotal;

    const sql = `
      INSERT INTO rankingquincenal (usuarioid, quincena, puntajetotal, posicion, tieneruleta, fechacalculo)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        puntajetotal = VALUES(puntajetotal),
        posicion = VALUES(posicion),
        tieneruleta = VALUES(tieneruleta),
        fechacalculo = VALUES(fechacalculo)
    `;

    await pool.query(sql, [
      usuarioid,
      quincena,
      puntajeAcumulado,
      posicion,
      tieneruleta,
      fechacalculo,
    ]);

    res.json({ ok: true, message: 'Ranking actualizado sumando puntaje' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/rankings/recalcular
exports.recalcularRanking = async (req, res) => {
  try {
    let quincena = req.body.quincena || req.query.quincena;

    // Si no se especifica o viene "actual", usamos la quincena calculada
    if (!quincena || quincena === 'actual') {
      quincena = obtenerQuincenaActual();
    }

    // Limpiar ranking previo de esa quincena
    await pool.query('DELETE FROM rankingquincenal WHERE quincena = ?', [quincena]);
    await pool.query('SET @pos := 0');

    // Insertar ranking recalculado desde autoevaluaciones
    await pool.query(
      `
      INSERT INTO rankingquincenal (usuarioid, quincena, puntajetotal, posicion, tieneruleta, fechacalculo)
      SELECT
        t.usuarioid,
        t.quincena,
        t.puntajetotal,
        (@pos := @pos + 1) AS posicion,
        IF(@pos <= 3, 'SI', 'NO') AS tieneruleta,
        CURDATE() AS fechacalculo
      FROM (
        SELECT 
          a.usuarioid,
          a.quincena,
          SUM(a.puntajetotal) AS puntajetotal
        FROM autoevaluaciones a
        WHERE a.completada = 'SI'
          AND a.quincena = ?
        GROUP BY a.usuarioid, a.quincena
        ORDER BY SUM(a.puntajetotal) DESC
      ) AS t;
      `,
      [quincena]
    );

    res.json({ ok: true, message: `Ranking recalculado para quincena ${quincena}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
