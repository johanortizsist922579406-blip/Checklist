const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('🧪 TEST - GOOGLE_SHEETS_ID:', process.env.GOOGLE_SHEETS_ID);
console.log('🧪 TEST - DATABASE_URL:', process.env.DATABASE_URL ? 'Existe' : 'NO EXISTE');

const pool = require('./config/database');
const express = require('express');
const cors = require('cors');
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

async function createAllTables() {
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS horarios_trabajadores (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
      hora_entrada_esperada TIME NOT NULL,
      hora_salida_esperada TIME NOT NULL,
      activo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(usuario_id, dia_semana)
    )
  `);
  console.log('✅ horarios_trabajadores');

  await pool.query(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'asistencias' AND column_name = 'tardanza_minutos'
      ) THEN
        ALTER TABLE asistencias ADD COLUMN tardanza_minutos INTEGER DEFAULT 0;
      END IF;
    END $$;
  `);
  console.log('✅ tardanza_minutos en asistencias');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS constancias (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      horas_acumuladas DECIMAL(10,2) NOT NULL,
      fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado VARCHAR(50) DEFAULT 'generada',
      UNIQUE(usuario_id)
    )
  `);
  console.log('✅ constancias');
}

async function initializeDatabase() {
  const isPostgres = process.env.NODE_ENV === 'production';
  
  try {
    if (isPostgres) {
      console.log('🔄 Inicializando PostgreSQL...');
      
      await createAllTables();
      
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
    }
  } catch (error) {
    console.log('❌ Error DB:', error);
    console.log('❌ Error message:', error.message);
    console.log('❌ Error code:', error.code);
  }
}

app.use(cors());
app.use(express.json());

app.use(express.static(frontendPath, {
  dotfiles: 'ignore',
  index: false
}));

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

app.use((err, req, res, next) => {
  console.error('ERROR GLOBAL =>', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Frontend: ${frontendPath}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

if (process.env.NODE_ENV === 'production') {
  initializeDatabase()
    .then(() => console.log('✅ Database initialized'))
    .catch(err => console.error('❌ Database error:', err.message));
} else {
  console.log('⏭️ Development mode - skipping DB initialization');
}

process.on('SIGTERM', () => {
  console.log('SIGTERM - Cerrando conexión...');
  if (pool) {
    pool.end(() => {
      console.log('Pool cerrado');
      process.exit(0);
    });
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM - Cerrando conexión...');
  const pool = require('./config/database');
  if (pool && pool.end) {
    pool.end(() => {
      console.log('Pool cerrado');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT - Cerrando conexión...');
  const pool = require('./config/database');
  if (pool && pool.end) {
    pool.end(() => {
      console.log('Pool cerrado');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

