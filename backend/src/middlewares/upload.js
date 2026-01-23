const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../../frontend/assets/uploads/fondos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const usuarioId = req.user.id;
    const extension = path.extname(file.originalname);
    const nombreArchivo = `fondo-usuario-${usuarioId}-${Date.now()}${extension}`;
    cb(null, nombreArchivo);
  }
});

const fileFilter = (req, file, cb) => {
  const tiposPermitidos = /jpeg|jpg|png|gif|webp/;
  const extname = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
  const mimetype = tiposPermitidos.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPG, PNG, GIF, WEBP)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

module.exports = upload;
