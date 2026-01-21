const pool = require('../../config/database');
const { executeQuery } = require('../utils/dbHelper');

function calcularMinutosTarde(horaEsperada, horaActual) {
  const [hE, mE] = horaEsperada.split(':').map(Number);
  const [hA, mA] = horaActual.split(':').map(Number);
  
  const minutosEsperados = hE * 60 + mE;
  const minutosActuales = hA * 60 + mA;
  
  return Math.max(0, minutosActuales - minutosEsperados);
}

exports.getAllAsistencias = async (req, res) => {
  try {
    const usuarioid = req.user.id;

    const [rows] = await executeQuery(
      pool,
      `SELECT 
         id,
         usuarioid,
         DATE(fecha) AS fecha,
         horaentrada::time AS horaentrada,
         horasalida::time AS horasalida,
         estado,
         to_char(horatotal, 'HH24:MI:SS') AS horatotal
       FROM asistencias
       WHERE usuarioid = ?
       ORDER BY fecha DESC`,
      [usuarioid]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error en getAllAsistencias:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.marcarEntrada = async (req, res) => {
  try {
    const usuarioid = req.user.id;
    const { horaLocal } = req.body;

    if (!horaLocal) {
      return res.status(400).json({ error: 'Falta horaLocal en la petición' });
    }

    console.log('🕐 Marcando entrada:', usuarioid, horaLocal);

    const hoy = new Date();
    const diaSemana = hoy.getDay();

    let asistenciaId;
    let tardanzaMinutos = 0;
    let esTarde = false;

    const [horarioRows] = await executeQuery(
      pool,
      `SELECT hora_entrada_esperada FROM horarios_trabajadores 
       WHERE usuario_id = ? AND dia_semana = ? AND activo = true`,
      [usuarioid, diaSemana]
    );

    if (horarioRows.length > 0) {
      const horaEsperada = horarioRows[0].hora_entrada_esperada;
      tardanzaMinutos = calcularMinutosTarde(horaEsperada, horaLocal);
      esTarde = tardanzaMinutos > 0;
      console.log(`⏰ Hora esperada: ${horaEsperada}, Actual: ${horaLocal}, Tardanza: ${tardanzaMinutos} min`);
    }

    const [existentes] = await executeQuery(
      pool,
      `SELECT id FROM asistencias
       WHERE usuarioid = ? AND DATE(fecha) = CURRENT_DATE`,
      [usuarioid]
    );

    if (existentes.length) {
      asistenciaId = existentes[0].id;
    } else {
      const [result] = await executeQuery(
        pool,
        `INSERT INTO asistencias (usuarioid, fecha, horaentrada, estado, tardanza_minutos)
         VALUES (?, CURRENT_DATE, ?::time, ?, ?)
         RETURNING id`,
        [usuarioid, horaLocal, 'En jornada', tardanzaMinutos]
      );
      asistenciaId = result[0].id;
    }

    const [tramosAbiertos] = await executeQuery(
      pool,
      `SELECT id FROM asistencia_tramos
       WHERE asistenciaid = ? AND horasalida IS NULL`,
      [asistenciaId]
    );

    if (tramosAbiertos.length) {
      return res.status(400).json({ error: 'Ya tienes un tramo de asistencia en curso' });
    }

    // Crear nuevo tramo
    const [nuevoTramo] = await executeQuery(
      pool,
      `INSERT INTO asistencia_tramos (asistenciaid, horaentrada)
       VALUES (?, ?::time)
       RETURNING id`,
      [asistenciaId, horaLocal]
    );

    const tramoId = nuevoTramo[0].id;

    return res.json({
      ok: true,
      message: esTarde 
        ? `Entrada registrada. Llegaste ${tardanzaMinutos} minutos tarde ⚠️`
        : 'Entrada registrada puntualmente ✅',
      asistenciaId,
      tramoId,
      tardanza: tardanzaMinutos,
      esTarde: esTarde
    });
  } catch (err) {
    console.error('❌ Error en marcarEntrada:', err);
    return res.status(500).json({ error: 'Error interno al marcar entrada' });
  }
};

exports.marcarSalida = async (req, res) => {
  try {
    const usuarioid = req.user.id;
    const { horaLocal } = req.body;
    if (!horaLocal) {
      return res.status(400).json({ error: 'Falta horaLocal en la petición' });
    }

    const [asisRows] = await executeQuery(
      pool,
      `SELECT id FROM asistencias
       WHERE usuarioid = ? AND DATE(fecha) = CURRENT_DATE`,
      [usuarioid]
    );

    if (!asisRows.length) {
      return res.status(404).json({ error: 'No hay asistencia registrada hoy' });
    }

    const asistenciaId = asisRows[0].id;

    const [tramosAbiertos] = await executeQuery(
      pool,
      `SELECT id FROM asistencia_tramos
       WHERE asistenciaid = ? AND horasalida IS NULL`,
      [asistenciaId]
    );

    if (!tramosAbiertos.length) {
      return res.status(404).json({ error: 'No hay tramo de asistencia en curso' });
    }

    const tramoId = tramosAbiertos[0].id;

    await executeQuery(
      pool,
      `UPDATE asistencia_tramos
       SET horasalida = ?::time
       WHERE id = ?`,
      [horaLocal, tramoId]
    );

    await executeQuery(
      pool,
      `UPDATE asistencias
       SET horasalida = ?::time
       WHERE id = ?`,
      [horaLocal, asistenciaId]
    );

    const [sumRows] = await executeQuery(
      pool,
      `SELECT SUM(EXTRACT(EPOCH FROM (horasalida - horaentrada))) AS segundos_totales
       FROM asistencia_tramos
       WHERE asistenciaid = ? AND horasalida IS NOT NULL`,
      [asistenciaId]
    );

    const segundosTotalesRaw = sumRows[0]?.segundos_totales || 0;
    const segundosTotales = Math.floor(segundosTotalesRaw);

    await executeQuery(
      pool,
      `UPDATE asistencias
       SET horatotal = (INTERVAL '1 second' * ?),
           estado    = ?
       WHERE id = ?`,
      [segundosTotales, 'Presente', asistenciaId]
    );

    res.json({
      message: 'Salida registrada',
      asistenciaId,
      segundosTotales
    });

  } catch (err) {
    console.error('Error en marcarSalida:', err);
    res.status(500).json({ error: err.message });
  }
};
