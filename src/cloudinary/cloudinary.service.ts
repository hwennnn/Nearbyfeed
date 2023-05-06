import { Injectable, Logger } from '@nestjs/common';
import {
  v2,
  type UploadApiErrorResponse,
  type UploadApiResponse,
} from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private readonly logger: Logger) {}

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return await new Promise((resolve, reject) => {
      const stream = v2.uploader.upload_stream((error, result) => {
        if (error !== undefined || result === undefined) {
          reject(error);
        } else {
          resolve(result);
        }
      });

      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);
      readableStream.pipe(stream);
    });
  }
}
