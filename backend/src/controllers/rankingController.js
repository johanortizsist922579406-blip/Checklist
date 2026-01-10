const pool = require('../../config/database');
const { executeQuery } = require('../utils/dbHelper');

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
        quincena = '1ra';
      }

      sql += ' WHERE r.quincena = ?';
      params = [quincena];
    }

    sql += ' ORDER BY r.posicion ASC';

    const [rows] = await executeQuery(pool, sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRankingById = async (req, res) => {
  try {
    const [rows] = await executeQuery(
      pool,
      `SELECT 
        r.*,
        u.nombre AS nombre
      FROM rankingquincenal r
      JOIN usuarios u ON r.usuarioid = u.id
      WHERE r.id = ?`,
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

exports.actualizarRankingUsuario = async (req, res) => {
  try {
    const { usuarioid, quincena, puntajetotal, posicion = 0, tieneruleta = 'NO' } = req.body;
    const fechacalculo = new Date();

    const [rows] = await executeQuery(
      pool,
      'SELECT puntajetotal FROM rankingquincenal WHERE usuarioid = ? AND quincena = ?',
      [usuarioid, quincena]
    );
    
    const puntajeAnterior = rows.length ? rows[0].puntajetotal : 0;
    const puntajeAcumulado = puntajeAnterior + puntajetotal;

    const sql = `
        INSERT INTO rankingquincenal (
        usuarioid, quincena, puntajetotal, posicion, tieneruleta, fechacalculo
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (usuarioid, quincena) 
        DO UPDATE SET
        puntajetotal = EXCLUDED.puntajetotal,
        posicion = EXCLUDED.posicion,
        tieneruleta = EXCLUDED.tieneruleta,
        fechacalculo = EXCLUDED.fechacalculo
    `;

      await executeQuery(pool, [
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

exports.recalcularRanking = async (req, res) => {
  try {
    let quincena = req.body.quincena || req.query.quincena;

    if (!quincena || quincena === 'actual') {
      quincena = '1ra';
    }

    await executeQuery(
      pool,
      'DELETE FROM rankingquincenal WHERE quincena = ?',
      [quincena]
    );

    await executeQuery(
      pool,
      `INSERT INTO rankingquincenal (usuarioid, quincena, puntajetotal, posicion, tieneruleta, fechacalculo)
       SELECT
        t.usuarioid,
        t.quincena,
        t.puntajetotal,
        ROW_NUMBER() OVER (ORDER BY t.puntajetotal DESC) AS posicion,
        CASE WHEN ROW_NUMBER() OVER (ORDER BY t.puntajetotal DESC) <= 3 THEN 'SI' ELSE 'NO' END AS tieneruleta,
        CURRENT_DATE AS fechacalculo
       FROM (
        SELECT 
          a.usuarioid,
          a.quincena,
          SUM(a.puntajetotal) AS puntajetotal
        FROM autoevaluaciones a
        WHERE a.completada = ? AND a.quincena = ?
        GROUP BY a.usuarioid, a.quincena
       ) AS t`,
      ['SI', quincena]
    );

    res.json({ ok: true, message: `Ranking recalculado para quincena ${quincena}` });
  } catch (err) {
    console.error('Error recalcularRanking:', err);
    res.status(500).json({ error: err.message });
  }
};
