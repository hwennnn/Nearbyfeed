import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class ImagesService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly logger: Logger,
  ) {}

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const result = await this.cloudinaryService.uploadImage(file).catch((e) => {
      this.logger.error(
        e.message ?? 'Failed to upload image',
        e instanceof Error ? e.stack : undefined,
        ImagesService.name,
      );

      throw new BadRequestException('Failed to upload image');
    });

    return result.url;
  }

  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    const result = await Promise.all(
      files.map(
        async (file) =>
          await this.cloudinaryService.uploadImage(file).catch((e) => {
            this.logger.error(
              e.message ?? 'Failed to upload image',
              e instanceof Error ? e.stack : undefined,
              ImagesService.name,
            );

            throw new BadRequestException('Failed to upload image');
          }),
      ),
    );

    return result.map((value) => value.url);
  }
}
