import { BadRequestException } from '@nestjs/common';
import { type MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const imageUploadOptions: MulterOptions = {
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png)$/) == null) {
      cb(new BadRequestException('Only image files are allowed'), false);
    }
    cb(null, true);
  },
};
