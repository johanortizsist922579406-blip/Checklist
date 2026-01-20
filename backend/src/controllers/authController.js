const pool = require('../../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../utils/dbHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'Sanilab2025';
const isProduction = process.env.NODE_ENV === 'production';

exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    console.log('📧 Login attempt - correo:', correo);
    console.log('🔐 Password length:', password?.length);

    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    let query, params;
    if (isProduction) {
      query = 'SELECT * FROM usuarios WHERE correo = $1';
      params = [correo];
    } else {
      query = 'SELECT * FROM usuarios WHERE correo = ?';
      params = [correo];
    }

    const result = await pool.query(query, params);
    const rows = isProduction ? result.rows : result[0];

    if (!rows.length) {
      console.log('❌ Usuario no encontrado');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = rows[0];

    // Comparar password con bcrypt
    const passwordValida = await bcrypt.compare(password, usuario.passwordhash);

    if (!passwordValida) {
      console.log('❌ Password incorrecta');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const payload = {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      nombre: usuario.nombre
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    console.log('✅ Login exitoso para:', usuario.nombre);

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
    console.error('❌ Error login:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.registro = async (req, res) => {
  try {
    const { nombre, apellido, correo, password, areaid, genero } = req.body;

    if (!nombre || !apellido || !correo || !password || !areaid || !genero) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    let query, params;
    if (isProduction) {
      query = 'SELECT id FROM usuarios WHERE correo = $1';
      params = [correo];
    } else {
      query = 'SELECT id FROM usuarios WHERE correo = ?';
      params = [correo];
    }

    const checkResult = await pool.query(query, params);
    const existente = isProduction ? checkResult.rows : checkResult[0];

    if (existente.length) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (isProduction) {
      query = `INSERT INTO usuarios (correo, passwordhash, nombre, apellido, areaid, genero, activo, rol)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`;
      params = [correo, passwordHash, nombre, apellido, areaid, genero, 'SI', 'USER'];
    } else {
      query = `INSERT INTO usuarios (correo, passwordhash, nombre, apellido, areaid, genero, activo, rol)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [correo, passwordHash, nombre, apellido, areaid, genero, 'SI', 'USER'];
    }

    const result = await pool.query(query, params);
    const insertId = isProduction ? result.rows[0].id : result[0].insertId;

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
    const { email, passwordActual, passwordNueva } = req.body;

    if (!email || !passwordNueva) {
      return res.status(400).json({ error: 'Email y nueva contraseña son requeridos' });
    }

    let query, params;
    if (isProduction) {
      query = 'SELECT id, passwordhash FROM usuarios WHERE correo = $1';
      params = [email]; 
    } else {
      query = 'SELECT id, passwordhash FROM usuarios WHERE correo = ?';
      params = [email];
    }

    const checkResult = await pool.query(query, params);
    const usuarios = isProduction ? checkResult.rows : checkResult[0];

    if (!usuarios.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = usuarios[0];

    if (passwordActual) {
      const passwordActualValida = await bcrypt.compare(passwordActual, usuario.passwordhash);
      if (!passwordActualValida) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }
    }

    const passwordHash = await bcrypt.hash(passwordNueva, 10);

    // Actualizar
    if (isProduction) {
      query = 'UPDATE usuarios SET passwordhash = $1 WHERE correo = $2';
      params = [passwordHash, email];
    } else {
      query = 'UPDATE usuarios SET passwordhash = ? WHERE correo = ?';
      params = [passwordHash, email];
    }

    await pool.query(query, params);

    res.json({ ok: true, message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    console.error('Error cambiarPassword:', err);
    res.status(500).json({ error: err.message });
  }
};
