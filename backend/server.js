const pool = require('./config/database');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const routes = require('./src/routes');
const adminRoutes = require('./src/routes/adminRoutes');

const projectRoot = path.dirname(__dirname);
const frontendPath = path.join(projectRoot, 'frontend');

console.log('Project root:', projectRoot);
console.log('Frontend path:', frontendPath);
console.log('Frontend exists:', fs.existsSync(frontendPath));
console.log('Index.html exists:', fs.existsSync(path.join(frontendPath, 'index.html')));

// ===== CREAR TODAS LAS TABLAS =====
async function createAllTables() {
  // Tabla areas (necesaria para usuarios)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS areas (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL UNIQUE,
      descripcion TEXT,
      activo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ areas');

  // Tabla usuarios
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      area_id INTEGER REFERENCES areas(id),
      rol VARCHAR(50) DEFAULT 'usuario',
      estado VARCHAR(50) DEFAULT 'activo',
      activo BOOLEAN DEFAULT true,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ usuarios');

  // Tabla asistencias
  await pool.query(`
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
    )
  `);
  console.log('✅ asistencias');

  // Tabla autoevaluacion
  await pool.query(`
    CREATE TABLE IF NOT EXISTS autoevaluacion (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL,
      fecha DATE NOT NULL,
      puntaje_total DECIMAL(5,2),
      observaciones TEXT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      UNIQUE(usuario_id, fecha)
    )
  `);
  console.log('✅ autoevaluacion');

  // Tabla criterios_evaluacion
  await pool.query(`
    CREATE TABLE IF NOT EXISTS criterios_evaluacion (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      descripcion TEXT,
      peso DECIMAL(5,2) DEFAULT 1.00,
      activo BOOLEAN DEFAULT TRUE,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ criterios_evaluacion');

  // Tabla respuestas_evaluacion
  await pool.query(`
    CREATE TABLE IF NOT EXISTS respuestas_evaluacion (
      id SERIAL PRIMARY KEY,
      autoevaluacion_id INTEGER NOT NULL,
      criterio_id INTEGER NOT NULL,
      puntaje DECIMAL(5,2),
      comentario TEXT,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (autoevaluacion_id) REFERENCES autoevaluacion(id) ON DELETE CASCADE,
      FOREIGN KEY (criterio_id) REFERENCES criterios_evaluacion(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ respuestas_evaluacion');

  // Tabla exportaciones
  await pool.query(`
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
    )
  `);
  console.log('✅ exportaciones');

  // Tabla rangos_desempeno
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rangos_desempeno (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      puntaje_minimo DECIMAL(5,2),
      puntaje_maximo DECIMAL(5,2),
      descripcion TEXT,
      activo BOOLEAN DEFAULT TRUE,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ rangos_desempeno');

  // Tabla logs_auditoria
  await pool.query(`
    CREATE TABLE IF NOT EXISTS logs_auditoria (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER,
      accion VARCHAR(255),
      tabla_afectada VARCHAR(100),
      datos_anteriores JSONB,
      datos_nuevos JSONB,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    )
  `);
  console.log('✅ logs_auditoria');

  // Tabla configuracion
  await pool.query(`
    CREATE TABLE IF NOT EXISTS configuracion (
      id SERIAL PRIMARY KEY,
      clave VARCHAR(100) UNIQUE NOT NULL,
      valor TEXT,
      tipo VARCHAR(50),
      descripcion TEXT,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ configuracion');
}

// ===== INICIALIZAR DATABASE =====
async function initializeDatabase() {
  const isPostgres = process.env.NODE_ENV === 'production';
  
  try {
    if (isPostgres) {
      console.log('🔄 Inicializando PostgreSQL...');
      
      // Crear TODAS las tablas
      await createAllTables();
      
      // Insertar áreas de ejemplo
      await pool.query(`
        INSERT INTO areas (nombre, descripcion) 
        VALUES 
          ('Administración', 'Área administrativa'),
          ('Producción', 'Área de producción'),
          ('Calidad', 'Control de calidad'),
          ('Logística', 'Gestión de inventarios')
        ON CONFLICT (nombre) DO NOTHING
      `);

      console.log('✅ Database initialized');
    } else {
      console.log('🔄 Inicializando MySQL...');
      // Código MySQL existente...
    }
  } catch (error) {
    console.log('❌ Error DB:', error);
    console.log('❌ Error message:', error.message);
    console.log('❌ Error code:', error.code);
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
