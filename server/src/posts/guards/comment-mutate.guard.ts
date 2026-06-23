import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { CommentsService } from 'src/posts/comments.service';
import { parseRouteId } from 'src/utils/parse-route-id.util';

@Injectable()
export class CommentMutateGuard implements CanActivate {
  constructor(private readonly commentsService: CommentsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const postId = parseRouteId(request.params.postId, 'postId');
    const commentId = parseRouteId(request.params.commentId, 'commentId');

    const comment = await this.commentsService.findComment(postId, commentId);

    if (comment === null || !comment.isActive) {
      throw new NotFoundException('Comment not found');
    }

    const user = request.user;

    if (comment.authorId !== +user.userId) {
      throw new ForbiddenException('No permission');
    }

    return true;
  }
}
