import {
  Injectable,
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { CommentsService } from 'src/posts/comments.service';

@Injectable()
export default class CommentActiveGuard implements CanActivate {
  constructor(private readonly commentsService: CommentsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const postId = request.params.postId;
    const commentId = request.params.commentId;

    const comment = await this.commentsService.findComment(+postId, +commentId);

    if (comment === null) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.isDeleted) {
      throw new NotFoundException('Comment has been deleted');
    }

    return true;
  }
}
