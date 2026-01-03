require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const routes = require('./src/routes');
const adminRoutes = require('./src/routes/adminRoutes');

const projectRoot = path.dirname(__dirname);
const frontendPath = path.join(projectRoot, 'frontend');

console.log('Project root:', projectRoot);
console.log('Frontend path:', frontendPath);
console.log('Frontend exists:', fs.existsSync(frontendPath));
console.log('Index.html exists:', fs.existsSync(path.join(frontendPath, 'index.html')));

// ===== POOL POSTGRESQL =====
let pool;

async function initializeDatabase() {
  try {
    console.log('🔄 Inicializando PostgreSQL...');
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();
    console.log('✅ PostgreSQL conectado');
    
    // Ejecutar migraciones SOLO en producción
    if (process.env.NODE_ENV === 'production') {
      console.log('🚀 Ejecutando migraciones...');
      await runMigrationsWithRestore(client);
    }
    
    client.release();
  } catch (err) {
    console.error('❌ Error DB:', err.message);
    process.exit(1);
  }
}

// ===== MIGRACIONES =====
async function runMigrationsWithRestore(client) {
  try {
    // Tabla de control
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) UNIQUE NOT NULL,
        fecha_ejecucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const result = await client.query('SELECT nombre FROM migrations');
    const ejecutadas = new Set(result.rows.map(row => row.nombre));

    if (!ejecutadas.has('001_initial_schema')) {
      console.log('⏳ Creando schema...');
      await migrationInitialSchema(client);
      await restoreDataFromBackup(client);
      await client.query('INSERT INTO migrations (nombre) VALUES ($1)', ['001_initial_schema']);
      console.log('✅ Migración completada');
    } else {
      console.log('✅ Schema ya existe');
    }
  } catch (error) {
    console.error('❌ Error migraciones:', error.message);
    throw error;
  }
}

// ===== CREAR TABLAS =====
async function migrationInitialSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      rol VARCHAR(50) DEFAULT 'usuario',
      estado VARCHAR(50) DEFAULT 'activo',
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ usuarios');

  await client.query(`
    CREATE TABLE IF NOT EXISTS asistencias (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL,
      fecha DATE NOT NULL,
      hora_entrada TIME,
      hora_salida TIME,
      comentarios TEXT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      UNIQUE(usuario_id, fecha)
    );
  `);
  console.log('✅ asistencias');

  await client.query(`
    CREATE TABLE IF NOT EXISTS autoevaluacion (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL,
      fecha DATE NOT NULL,
      puntaje_total DECIMAL(5,2),
      observaciones TEXT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      UNIQUE(usuario_id, fecha)
    );
  `);
  console.log('✅ autoevaluacion');

  await client.query(`
    CREATE TABLE IF NOT EXISTS criterios_evaluacion (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      descripcion TEXT,
      peso DECIMAL(5,2) DEFAULT 1.00,
      activo BOOLEAN DEFAULT TRUE,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ criterios_evaluacion');

  await client.query(`
    CREATE TABLE IF NOT EXISTS respuestas_evaluacion (
      id SERIAL PRIMARY KEY,
      autoevaluacion_id INTEGER NOT NULL,
      criterio_id INTEGER NOT NULL,
      puntaje DECIMAL(5,2),
      comentario TEXT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (autoevaluacion_id) REFERENCES autoevaluacion(id) ON DELETE CASCADE,
      FOREIGN KEY (criterio_id) REFERENCES criterios_evaluacion(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ respuestas_evaluacion');

  await client.query(`
    CREATE TABLE IF NOT EXISTS exportaciones (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER,
      tipo VARCHAR(50) NOT NULL,
      fecha_inicio DATE,
      fecha_fin DATE,
      archivo_url VARCHAR(255),
      estado VARCHAR(50) DEFAULT 'pendiente',
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );
  `);
  console.log('✅ exportaciones');

  await client.query(`
    CREATE TABLE IF NOT EXISTS rangos_desempeno (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      puntaje_minimo DECIMAL(5,2),
      puntaje_maximo DECIMAL(5,2),
      descripcion TEXT,
      activo BOOLEAN DEFAULT TRUE,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ rangos_desempeno');

  await client.query(`
    CREATE TABLE IF NOT EXISTS logs_auditoria (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER,
      accion VARCHAR(255),
      tabla_afectada VARCHAR(100),
      datos_anteriores JSONB,
      datos_nuevos JSONB,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );
  `);
  console.log('✅ logs_auditoria');

  await client.query(`
    CREATE TABLE IF NOT EXISTS configuracion (
      id SERIAL PRIMARY KEY,
      clave VARCHAR(100) UNIQUE NOT NULL,
      valor TEXT,
      tipo VARCHAR(50),
      descripcion TEXT,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ configuracion');
}

// ===== RESTAURAR BACKUP =====
async function restoreDataFromBackup(client) {
  const backupPath = path.join(__dirname, 'backup.json');
  
  if (!fs.existsSync(backupPath)) {
    console.log('⚠️ No hay backup.json');
    return;
  }

  try {
    console.log('📥 Restaurando backup...');
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    // Usuarios
    if (backup.usuarios?.length > 0) {
      for (const u of backup.usuarios) {
        await client.query(
          `INSERT INTO usuarios (id, nombre, email, password, rol, estado, fecha_creacion, fecha_actualizacion) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre`,
          [u.id, u.nombre, u.email, u.password, u.rol || 'usuario', u.estado || 'activo', u.fecha_creacion, u.fecha_actualizacion]
        );
      }
      console.log(`✅ ${backup.usuarios.length} usuarios`);
    }

    // Asistencias
    if (backup.asistencias?.length > 0) {
      for (const a of backup.asistencias) {
        await client.query(
          `INSERT INTO asistencias (usuario_id, fecha, hora_entrada, hora_salida, comentarios, fecha_creacion) 
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (usuario_id, fecha) DO UPDATE SET hora_entrada = EXCLUDED.hora_entrada`,
          [a.usuario_id, a.fecha, a.hora_entrada, a.hora_salida, a.comentarios, a.fecha_creacion]
        );
      }
      console.log(`✅ ${backup.asistencias.length} asistencias`);
    }

    // Autoevaluacion
    if (backup.autoevaluacion?.length > 0) {
      for (const ae of backup.autoevaluacion) {
        await client.query(
          `INSERT INTO autoevaluacion (usuario_id, fecha, puntaje_total, observaciones, fecha_creacion) 
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (usuario_id, fecha) DO UPDATE SET puntaje_total = EXCLUDED.puntaje_total`,
          [ae.usuario_id, ae.fecha, ae.puntaje_total, ae.observaciones, ae.fecha_creacion]
        );
      }
      console.log(`✅ ${backup.autoevaluacion.length} autoevaluaciones`);
    }

    // Criterios
    if (backup.criterios_evaluacion?.length > 0) {
      for (const c of backup.criterios_evaluacion) {
        await client.query(
          `INSERT INTO criterios_evaluacion (id, nombre, descripcion, peso, activo, fecha_creacion) 
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre`,
          [c.id, c.nombre, c.descripcion, c.peso || 1.00, c.activo !== false, c.fecha_creacion]
        );
      }
      console.log(`✅ ${backup.criterios_evaluacion.length} criterios`);
    }

    // Respuestas
    if (backup.respuestas_evaluacion?.length > 0) {
      for (const r of backup.respuestas_evaluacion) {
        await client.query(
          `INSERT INTO respuestas_evaluacion (autoevaluacion_id, criterio_id, puntaje, comentario, fecha_creacion) 
           VALUES ($1, $2, $3, $4, $5)`,
          [r.autoevaluacion_id, r.criterio_id, r.puntaje, r.comentario, r.fecha_creacion]
        );
      }
      console.log(`✅ ${backup.respuestas_evaluacion.length} respuestas`);
    }

    // Exportaciones
    if (backup.exportaciones?.length > 0) {
      for (const e of backup.exportaciones) {
        await client.query(
          `INSERT INTO exportaciones (usuario_id, tipo, fecha_inicio, fecha_fin, archivo_url, estado, fecha_creacion) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [e.usuario_id, e.tipo, e.fecha_inicio, e.fecha_fin, e.archivo_url, e.estado || 'completado', e.fecha_creacion]
        );
      }
      console.log(`✅ ${backup.exportaciones.length} exportaciones`);
    }

    // Rangos
    if (backup.rangos_desempeno?.length > 0) {
      for (const rg of backup.rangos_desempeno) {
        await client.query(
          `INSERT INTO rangos_desempeno (id, nombre, puntaje_minimo, puntaje_maximo, descripcion, activo, fecha_creacion) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre`,
          [rg.id, rg.nombre, rg.puntaje_minimo, rg.puntaje_maximo, rg.descripcion, rg.activo !== false, rg.fecha_creacion]
        );
      }
      console.log(`✅ ${backup.rangos_desempeno.length} rangos`);
    }

    console.log('✨ Backup restaurado!');
  } catch (error) {
    console.error('❌ Error restauración:', error.message);
    throw error;
  }
}

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

app.use(express.static(frontendPath, {
  dotfiles: 'ignore',
  index: false
}));

// ===== RUTAS =====
app.get('/', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  console.log('Attempting to serve:', indexPath);
  console.log('File exists:', fs.existsSync(indexPath));
  
  if (!fs.existsSync(indexPath)) {
    return res.status(404).json({
      error: 'index.html not found',
      path: indexPath,
      frontendPath: frontendPath,
      projectRoot: projectRoot
    });
  }
  
  res.sendFile(indexPath);
});

app.use('/api', routes);
app.use('/api/admin', adminRoutes);

// ===== MANEJO DE ERRORES =====
app.use((err, req, res, next) => {
  console.error('ERROR GLOBAL =>', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// ===== INICIAR SERVIDOR =====
const PORT = process.env.PORT || 3000;

// Iniciar servidor primero
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Frontend: ${frontendPath}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Conectar a DB en background (no bloquea el servidor)
if (process.env.NODE_ENV === 'production') {
  initializeDatabase()
    .then(() => console.log('✅ Database initialized'))
    .catch(err => console.error('❌ Database error:', err.message));
} else {
  console.log('⏭️ Development mode - skipping DB initialization');
}

// ===== MANEJO DE CIERRE GRACEFUL =====
process.on('SIGTERM', () => {
  console.log('SIGTERM - Cerrando conexión...');
  if (pool) {
    pool.end(() => {
      console.log('Pool cerrado');
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT - Cerrando conexión...');
  if (pool) {
    pool.end(() => {
      console.log('Pool cerrado');
      process.exit(0);
    });
  }
});

