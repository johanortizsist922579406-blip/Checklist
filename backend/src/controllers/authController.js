const pool = require('../../config/database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tuclavesecretasupersegura';

exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    const [rows] = await pool.query(
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

    const payload = { id: usuario.id, correo: usuario.correo };
    const token = jwt.sign(
    { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
      JWT_SECRET,
    { expiresIn: '8h' }
  );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        correo: usuario.correo,
        areaid: usuario.areaid  
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
