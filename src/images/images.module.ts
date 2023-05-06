import { Module } from '@nestjs/common';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ImagesController } from 'src/images/images.controller';

@Module({
  imports: [CloudinaryModule],
  controllers: [ImagesController],
})
export class ImagesModule {}
