const pool = require('../../config/database');

exports.getAllUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsuarioById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUsuario = async (req, res) => {
  try {
    const { correo, password, nombre, apellido, areaid, activo, genero } = req.body;

    if (!correo || !password || !nombre || !apellido || !areaid || !genero) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (!['M', 'F'].includes(genero)) {
      return res.status(400).json({ error: 'Género inválido' });
    }

    const [existe] = await pool.query(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );
    if (existe.length) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const [result] = await pool.query(
      `INSERT INTO usuarios (correo, passwordhash, nombre, apellido, areaid, activo, genero, rol)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [correo, password, nombre, apellido, areaid, activo ?? 'SI', genero, 'USER']
    );

    res.status(201).json({
      id: result.insertId,
      correo,
      nombre,
      apellido,
      areaid,
      genero
    });
  } catch (err) {
    console.error('Error al registrar usuario =>', err.message);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

exports.loginUsuario = async (req, res) => {
  const { correo, password } = req.body;
  console.log('Login payload:', correo, password);
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    console.log('Resultado SELECT:', rows);

    if (!rows.length) {
      const [todos] = await pool.query('SELECT correo FROM usuarios');
      console.log('Correos en la base:', todos);
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const usuario = rows[0];
    if (usuario.passwordhash.toString().trim() !== password.toString().trim()) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const token = 'TOKEN_FAKE_' + usuario.id;
    res.json({
      token,
      areaid: usuario.areaid,
      usuarioid: usuario.id
    });
  } catch (err) {
    console.log('Error de login:', err);
    res.status(500).json({ error: 'Error de servidor' });
  }
};
