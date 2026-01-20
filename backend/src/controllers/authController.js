const pool = require('../../config/database');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../utils/dbHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'Sanilab2025';

exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    const [rows] = await executeQuery(
      pool,
      'SELECT * FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = rows[0];

    if (usuario.passwordhash !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const payload = {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      nombre: usuario.nombre
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        areaid: usuario.areaid,
        rol: usuario.rol,
        genero: usuario.genero
      }
    });
  } catch (err) {
    console.error('Error login:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.registro = async (req, res) => {
  try {
    const { nombre, apellido, correo, password, areaid, genero } = req.body;

    if (!nombre || !apellido || !correo || !password || !areaid || !genero) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const [existente] = await executeQuery(
      pool,
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (existente.length) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const [result] = await executeQuery(
      pool,
      `INSERT INTO usuarios (correo, passwordhash, nombre, apellido, areaid, genero, activo, rol)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [correo, password, nombre, apellido, areaid, genero, 'SI', 'USER']
    );

    const insertId = result.insertId || result[0]?.id;

    res.json({ 
      ok: true, 
      message: 'Usuario registrado exitosamente', 
      usuarioId: insertId 
    });
  } catch (err) {
    console.error('Error registro:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.cambiarPassword = async (req, res) => {
  try {
    const { correo, nuevaPassword } = req.body;

    if (!correo || !nuevaPassword) {
      return res.status(400).json({ error: 'Correo y nueva contraseña son requeridos' });
    }

    const [usuarios] = await executeQuery(
      pool,
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );

    if (!usuarios.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await executeQuery(
      pool,
      'UPDATE usuarios SET passwordhash = ? WHERE correo = ?',
      [nuevaPassword, correo]
    );

    res.json({ ok: true, message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    console.error('Error cambiarPassword:', err);
    res.status(500).json({ error: err.message });
  }
};
