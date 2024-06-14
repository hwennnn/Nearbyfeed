import {
  Injectable,
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { PostsService } from 'src/posts/posts.service';

@Injectable()
export class PostActiveGuard implements CanActivate {
  constructor(private readonly postsService: PostsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const postId = request.params.postId;

    const post = await this.postsService.findPost(+postId);

    if (post === null || !post.isActive) {
      throw new NotFoundException('Post not found');
    }

    return true;
  }
}
