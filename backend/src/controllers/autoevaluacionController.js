const pool = require('../../config/database');
const axios = require('axios');
const { executeQuery } = require('../utils/dbHelper');

exports.getAllAutoevaluaciones = async (req, res) => {
  try {
    let sql = 'SELECT * FROM autoevaluaciones';
    let params = [];
    
    if (req.query.usuarioid) {
      sql += ' WHERE usuarioid = ?';
      params = [req.query.usuarioid];
    }
    
    const [rows] = await executeQuery(pool, sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error getAllAutoevaluaciones:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAutoevaluacionById = async (req, res) => {
  try {
    const [rows] = await executeQuery(
      pool,
      'SELECT * FROM autoevaluaciones WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Autoevaluacion not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error getAutoevaluacionById:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.crearAutoevaluacion = async (req, res) => {
  try {
    console.log('📝 Datos recibidos en crearAutoevaluacion:', JSON.stringify(req.body, null, 2));
    
    const { usuarioid, puntajetotal, quincena, mensajemotivacional, respuestas } = req.body;

    if (!quincena) {
      console.log('❌ Falta quincena');
      return res.status(400).json({ error: "El campo 'quincena' es obligatorio." });
    }

    const fechaEvaluacion = new Date();
    const fechaFormateada = fechaEvaluacion.toISOString().slice(0, 19).replace('T', ' ');

    console.log('💾 Insertando autoevaluación:', {
      usuarioid,
      fechaFormateada,
      puntajetotal,
      quincena,
      mensajemotivacional
    });

    const [rows] = await executeQuery(
      pool,
      `INSERT INTO autoevaluaciones (
         usuarioid, fechaevaluacion, puntajetotal,
         quincena, mensajemotivacional, completada,
         created_at, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
       RETURNING id`,
      [usuarioid, fechaFormateada, puntajetotal, quincena, mensajemotivacional, 'SI']
    );

    const autoevaluacionid = rows[0].id;
    console.log('✅ Autoevaluación guardada con ID:', autoevaluacionid);

    if (!Array.isArray(respuestas) || respuestas.length === 0) {
      console.warn('⚠ No se enviaron respuestas, solo se creó la autoevaluación');
    } else {
      console.log('💾 Guardando', respuestas.length, 'respuestas...');
      
      for (const r of respuestas) {
        await executeQuery(
          pool,
          `INSERT INTO respuestasautoevaluacion
             (autoevaluacionid, preguntaid, respuesta, puntaje, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [autoevaluacionid, r.preguntaid, r.respuesta, r.puntaje]
        );
      }

      console.log('✅ Todas las respuestas guardadas');
    }

    res.json({
      message: 'Autoevaluación guardada correctamente',
      id: autoevaluacionid,
      puntaje: puntajetotal,
      mensajemotivacional: mensajemotivacional
    });
  } catch (err) {
    console.error('❌ ERROR EN BACKEND:', err);
    res.status(500).json({ error: err.message });
  }
};
