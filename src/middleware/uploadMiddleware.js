const multer = require('multer');
const path = require('path');

// Para Vercel - usar memoryStorage em vez de diskStorage
// A Vercel tem sistema de arquivos read-only, então não podemos salvar arquivos no disco
const storage = multer.memoryStorage();

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

// Configuração do multer com memoryStorage
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
    
    // Arquivo agora está em req.file.buffer (na memória)
    // Adicionar informações úteis para processamento
    req.file.originalPath = req.file.originalname;
    req.file.tempPath = null; // Não há arquivo temporário
    
    next();
  });
};

module.exports = {
  uploadMiddleware
};;
