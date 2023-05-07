import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { type Comment } from '@prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import JwtAuthGuard from 'src/auth/guards/jwt-auth.guard';
import { CreateCommentDto, UpdateCommentDto } from 'src/comments/dto';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':id')
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @GetUser('userId') userId: string,
    @Param('id') postId: string,
  ): Promise<Comment> {
    return await this.commentsService.create(
      createCommentDto,
      +postId,
      +userId,
    );
  }

  @Get(':id')
  async findComments(@Param('id') id: string): Promise<Comment[]> {
    return await this.commentsService.find(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    return await this.commentsService.update(+id, updateCommentDto);
  }
}
