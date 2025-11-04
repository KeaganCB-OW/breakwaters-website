import multer from 'multer';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['application/pdf']);
const ALLOWED_EXTENSIONS = new Set(['.pdf']);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const isAllowed =
    ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(extension);

  if (!isAllowed) {
    const error = new Error('Only PDF files up to 5MB are allowed.');
    error.code = 'UNSUPPORTED_MEDIA_TYPE';
    return cb(error);
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export const handleCvUploadInMemory = (req, res, next) => {
  upload.single('cv')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message: 'The CV file is too large. The maximum allowed size is 5MB.',
        });
      }

      return res.status(400).json({
        message: error.message || 'Failed to process the uploaded CV.',
      });
    }

    if (error?.code === 'UNSUPPORTED_MEDIA_TYPE') {
      return res.status(415).json({ message: error.message });
    }

    return res.status(400).json({
      message: error?.message || 'Failed to process the uploaded CV.',
    });
  });
};
