require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const pool = require('../../config/database');
const bcrypt = require('bcryptjs');

async function hashearPasswords() {
  try {
    const { rows } = await pool.query('SELECT id, correo, passwordhash FROM usuarios');

    console.log(`📝 Encontrados ${rows.length} usuarios`);

    for (const usuario of rows) {
      // Si la password ya parece hasheada (empieza con $2), skip
      if (usuario.passwordhash.startsWith('$2')) {
        console.log(`⏭️ ${usuario.correo} ya tiene hash`);
        continue;
      }

      // Hashear la password actual
      const hash = await bcrypt.hash(usuario.passwordhash, 10);

      await pool.query(
        'UPDATE usuarios SET passwordhash = $1 WHERE id = $2',
        [hash, usuario.id]
      );

      console.log(`✅ ${usuario.correo} - password hasheada`);
    }

    console.log('🎉 Proceso completado');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (pool.end) await pool.end();
    process.exit(0);
  }
}

hashearPasswords();
