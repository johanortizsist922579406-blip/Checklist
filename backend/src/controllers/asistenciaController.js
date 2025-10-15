// src/controllers/asistenciaController.js
const pool = require('../../config/database');

exports.getAllAsistencias = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM asistencias');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAsistenciaById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM asistencias WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Asistencia not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createAsistencia = async (req, res) => {
  try {
    const { usuarioid, fecha, horaentrada, horasalida, estado } = req.body;
    const [result] = await pool.query(
      'INSERT INTO asistencias (usuarioid, fecha, horaentrada, horasalida, estado) VALUES (?, ?, ?, ?, ?)',
      [usuarioid, fecha, horaEntrada, horasalida, estado]
    );
    res.json({ id: result.insertid, usuarioid, fecha, horaentrada, horasalida, estado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.marcarSalida = async (req, res) => {
  const { asistenciaid } = req.body; // o ajústalo según cómo envíes el ID

  // Obtén la hora actual
  const now = new Date();
  const horasalida = now.toTimeString().split(' ')[0];

  // Busca hora_entrada de ese registro
  const [rows] = await pool.query('SELECT horaentrada FROM asistencias WHERE id = ?', [asistenciaid]);
  if (!rows.length) return res.status(404).json({ error: 'Asistencia no encontrada' });

  // Actualiza registro con hora_salida y calcula hora_total
  await pool.query(
    `UPDATE asistencias
     SET horasalida = ?, horatotal = TIMEDIFF(?, hora_entrada)
     WHERE id = ?`,
    [horasalida, horasalida, asistenciaid]
  );
  res.json({ message: 'Salida registrada y hora_total guardada' });
};