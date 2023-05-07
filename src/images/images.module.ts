import { Logger, Module } from '@nestjs/common';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ImagesController } from 'src/images/images.controller';
import { ImagesService } from './images.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [ImagesController],
  providers: [ImagesService, Logger],
  exports: [ImagesService],
})
export class ImagesModule {}
