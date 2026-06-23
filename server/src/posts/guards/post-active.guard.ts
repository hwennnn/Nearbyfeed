import {
  Injectable,
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { PostsService } from 'src/posts/posts.service';
import { parseRouteId } from 'src/utils/parse-route-id.util';

@Injectable()
export class PostActiveGuard implements CanActivate {
  constructor(private readonly postsService: PostsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const postId = parseRouteId(request.params.postId, 'postId');

    const post = await this.postsService.findPost(postId);

    if (post === null || !post.isActive) {
      throw new NotFoundException('Post not found');
    }

    return true;
  }
}
