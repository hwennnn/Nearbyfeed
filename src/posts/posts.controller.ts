import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type Post as PostEntity, type Updoot } from '@prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { imageUploadOptions } from 'src/images/constants';
import { ImagesService } from 'src/images/images.service';
import { GetPostDto, UpdatePostDto } from 'src/posts/dto';
import { CreatePostDto } from 'src/posts/dto/create-post.dto';
import { UpdootDto } from 'src/posts/dto/updoot.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly imagesService: ImagesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  async create(
    @Body() createPostDto: CreatePostDto,
    @GetUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PostEntity> {
    let image: string | undefined;

    if (file !== undefined) {
      image = await this.imagesService.uploadImage(file);
    }

    return await this.postsService.create(createPostDto, +userId, image);
  }

  @Get()
  async findAll(@Query() getPostDto: GetPostDto): Promise<PostEntity[]> {
    return await this.postsService.findNearby(
      +getPostDto.latitude,
      +getPostDto.longitude,
      +getPostDto.distance,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostEntity> {
    return await this.postsService.update(+id, updatePostDto);
  }

  @Put(':id/vote')
  @UseGuards(JwtAuthGuard)
  async vote(
    @GetUser('userId') userId: string,
    @Param('id') postId: string,
    @Body() updootDto: UpdootDto,
  ): Promise<{
    updoot: Updoot;
    post: PostEntity;
  }> {
    return await this.postsService.vote(+userId, +postId, updootDto.value);
  }
}
