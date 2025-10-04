const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garante que o diretório de uploads existe
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Gera nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${extension}`);
  }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'text/csv',
    'application/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/sql',
    'application/sql',
    'text/plain',
    'application/json'
  ];

  const allowedExtensions = ['.csv', '.xlsx', '.xls', '.sql', '.json'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Formatos aceitos: CSV, Excel (.xlsx, .xls), SQL, JSON'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1 // Apenas 1 arquivo por vez
  }
});

// Middleware para upload único
const uploadSingle = upload.single('file');

// Middleware personalizado com tratamento de erros
const uploadMiddleware = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'Arquivo muito grande. Tamanho máximo: 50MB'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          error: 'Apenas um arquivo por vez é permitido'
        });
      }
      return res.status(400).json({
        success: false,
        error: `Erro de upload: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo foi enviado'
      });
    }
    
    next();
  });
};

module.exports = {
  uploadMiddleware,
  uploadsDir
};
