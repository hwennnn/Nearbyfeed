import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageUploadOptions } from 'src/images/constants';
import { ImagesService } from 'src/images/images.service';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (file === undefined) {
      throw new BadRequestException('Image file is required');
    }

    return { url: await this.imagesService.uploadImage(file) };
  }
}
