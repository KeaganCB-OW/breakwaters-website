import crypto from 'crypto';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

const uploadsRoot = path.resolve(process.cwd(), 'uploads');
const ALLOWED_EXTENSIONS = new Set(['.pdf']);
const ALLOWED_MIME_TYPES = new Set(['application/pdf']);

if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsRoot);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const safeExtension = ALLOWED_EXTENSIONS.has(extension) ? extension : '.pdf';
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${randomName}${safeExtension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const isAllowed = ALLOWED_EXTENSIONS.has(extension) && ALLOWED_MIME_TYPES.has(file.mimetype);

  if (!isAllowed) {
    return cb(new Error('Only PDF resumes are allowed.'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const handleCvUpload = (req, res, next) => {
  upload.single('cv')(req, res, (error) => {
    if (error) {
      const status = error instanceof multer.MulterError ? 400 : 415;
      return res.status(status).json({ message: error.message || 'Failed to upload CV.' });
    }
    return next();
  });
};
