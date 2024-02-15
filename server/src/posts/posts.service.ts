import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma, type Comment, type Post, type Updoot } from '@prisma/client';
import { FilterService } from 'src/filter/filter.service';
import { GeocodingService } from 'src/geocoding/geocoding.service';
import {
  GetCommentsSort,
  type CreateCommentDto,
  type CreatePostDto,
  type GetCommentDto,
  type GetPostDto,
  type UpdateCommentDto,
  type UpdatePostDto,
} from 'src/posts/dto';
import {
  type CommentWithAuthor,
  type PostWithUpdoot,
} from 'src/posts/entities';

import { PrismaService } from 'src/prisma/prisma.service';
import { type UserWithoutPassword } from 'src/users/entities';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
    private readonly filterService: FilterService,
    private readonly geocodingService: GeocodingService,
    private readonly usersService: UsersService,
  ) {}

  async createPost(
    createPostDto: CreatePostDto,
    authorId: number,
    image?: string,
  ): Promise<Post> {
    const geolocationName = await this.geocodingService.getLocationName(
      +createPostDto.latitude,
      +createPostDto.longitude,
    );

    const data = {
      ...createPostDto,
      authorId,
      image,
      latitude: +createPostDto.latitude,
      longitude: +createPostDto.longitude,
      title: this.filterService.filterText(createPostDto.title),
      content:
        createPostDto.content !== undefined
          ? this.filterService.filterText(createPostDto.content)
          : null,
      locationName: geolocationName?.locationName,
      fullLocationName: geolocationName?.displayName,
    };

    // await sleep(15000);

    const post = await this.prismaService.post
      .create({
        data,
        include: {
          author: true,
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to create post',
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to create post');
      });

    return post;
  }

  async findNearbyPosts(dto: GetPostDto): Promise<{
    posts: PostWithUpdoot[];
    hasMore: boolean;
  }> {
    const degreesPerMeter = 1 / 111320; // 1 degree is approximately 111320 meters
    const degreesPerDistance = dto.distance * degreesPerMeter;

    const limit = dto.take ?? 15;

    const selectUpdoots =
      dto.userId !== undefined
        ? {
            where: {
              userId: +dto.userId,
            },
          }
        : false;

    let postCursor: { id: number } | undefined;
    if (dto.cursor !== undefined) {
      postCursor = {
        id: +dto.cursor,
      };
    }

    // in order to skip the cursor
    const skip = postCursor !== undefined ? 1 : undefined;

    const posts = await this.prismaService.post
      .findMany({
        take: limit + 1,
        skip,
        cursor: postCursor,
        where: {
          latitude: {
            lte: dto.latitude + degreesPerDistance,
            gte: dto.latitude - degreesPerDistance,
          },
          longitude: {
            lte: dto.longitude + degreesPerDistance,
            gte: dto.longitude - degreesPerDistance,
          },
        },
        select: {
          id: true,
          title: true,
          content: true,
          latitude: true,
          longitude: true,
          locationName: true,
          fullLocationName: true,
          image: true,
          points: true,
          flagged: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
          updoots: selectUpdoots,
          author: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find posts',
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to find posts');
      });

    const hasMore = posts.length === limit + 1;
    if (hasMore) {
      posts.pop();
    }

    // transform the updoots array into single updoot variable
    const parsedPosts = posts.map((post) => {
      const p = {
        ...post,
        updoot: post.updoots.length > 0 ? post.updoots[0] : undefined,
      };

      const { updoots: _, ...parsedPost } = p;

      return parsedPost;
    });

    return {
      posts: parsedPosts,
      hasMore,
    };
  }

  async updatePost(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const data = {
      ...updatePostDto,
    };

    if (updatePostDto.title !== undefined) {
      data.title = this.filterService.filterText(updatePostDto.title);
    }

    if (updatePostDto.content !== undefined) {
      data.content = this.filterService.filterText(updatePostDto.content);
    }

    return await this.prismaService.post
      .update({
        where: { id },
        data,
      })
      .catch((e) => {
        this.logger.error(
          `Failed to update post ${id}`,
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to update post');
      });
  }

  async votePost(
    userId: number,
    postId: number,
    value: number,
  ): Promise<{
    updoot: Updoot;
    post: Post;
  }> {
    const updoot = await this.prismaService.updoot.findFirst({
      where: {
        userId,
        postId,
      },
    });

    let incrementValue = value;

    // If the user has already voted on the post
    if (updoot !== null) {
      // If the user's vote is the same as the current vote
      if (updoot.value === value) {
        // nothing changed
        incrementValue = 0;
      } else {
        // If the user is changing their vote
        if (updoot.value !== 0 && value === 0) {
          // If the previous vote was not 0 and the new vote is 0, set the increment value to the inverse of the previous vote
          incrementValue = -updoot.value;
        } else {
          // If the previous vote was 0 or the new vote is not 0, set the increment value to the new vote multiplied by 2
          incrementValue = updoot.value === 0 ? value : value * 2;
        }
      }
    }

    const [resultUpdoot, resultPost] = await this.prismaService
      .$transaction([
        this.prismaService.updoot.upsert({
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
          update: {
            value,
          },
          create: {
            postId,
            userId,
            value,
          },
        }),
        this.prismaService.post.update({
          data: {
            points: {
              increment: incrementValue,
            },
          },
          where: {
            id: postId,
          },
        }),
      ])
      .catch((e) => {
        this.logger.error(
          'Failed to updoot',
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to updoot');
      });

    return {
      updoot: resultUpdoot,
      post: resultPost,
    };
  }

  async createComment(
    createCommentDto: CreateCommentDto,
    postId: number,
    authorId: number,
    parentCommentId?: number,
  ): Promise<Comment> {
    const data = {
      ...createCommentDto,
      postId,
      authorId,
      content: this.filterService.filterText(createCommentDto.content),
      parentCommentId,
    };

    const comment = await this.prismaService.comment
      .create({
        data,
        include: {
          author: true,
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to create comment',
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to create comment');
      });

    return comment;
  }

  async findComments(
    postId: number,
    dto: GetCommentDto,
  ): Promise<{
    comments: CommentWithAuthor[];
    hasMore: boolean;
  }> {
    const anchorLimit = dto.take ?? 15;
    const recursiveLimit = 20;

    const anchorCursorClause = Prisma.sql`AND "public"."Comment"."id" >= ${+(
      (dto.cursor ?? '0') // redundant value of '0'
    )}`;

    // // in order to skip the cursor
    const anchorSkipClause =
      dto.cursor !== undefined ? Prisma.sql`OFFSET 1` : Prisma.empty;

    const anchorOrderByClause = Prisma.sql([
      dto.sort === GetCommentsSort.OLDEST ? 'ASC' : 'DESC',
    ]);

    const comments: CommentWithAuthor[] = (await this.prismaService
      .$queryRaw(
        Prisma.sql`
      WITH RECURSIVE NestedComments AS (
      --   Anchor Clause
        (SELECT 
          "public"."Comment"."id", 
          "public"."Comment"."content", 
          "public"."Comment"."createdAt", 
          "public"."Comment"."updatedAt", 
          "public"."Comment"."isDeleted", 
          "public"."Comment"."postId", 
          "public"."Comment"."authorId", 
          "public"."Comment"."parentCommentId", 
          1 AS depth
        FROM 
          "public"."Comment"
        WHERE 
          "public"."Comment"."postId" = ${postId} AND "public"."Comment"."parentCommentId" IS NULL AND "public"."Comment"."isDeleted" = false
        ${dto.cursor !== undefined ? anchorCursorClause : Prisma.empty}
        ORDER BY "public"."Comment"."createdAt" ${anchorOrderByClause}
        LIMIT ${anchorLimit + 1} ${anchorSkipClause}
        )
        
        UNION ALL
      --   Recursive Clause
        (SELECT 
          c."id", 
          c."content", 
          c."createdAt", 
          c."updatedAt", 
          c."isDeleted", 
          c."postId", 
          c."authorId", 
          c."parentCommentId", 
          nc.depth + 1 AS depth
        FROM 
          "public"."Comment" c
        INNER JOIN 
          NestedComments nc ON c."parentCommentId" = nc.id
        ORDER BY c."createdAt" DESC
        LIMIT ${recursiveLimit + 1})
      )

      SELECT 
        "id", "content", "createdAt", "updatedAt", "isDeleted", "postId", "authorId", "parentCommentId"
      FROM 
        NestedComments 
      ORDER BY 
        depth;

  `,
      )
      .catch((e) => {
        this.logger.error(
          `Failed to find comments for post ${postId}`,
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to find comments');
      })) as CommentWithAuthor[];

    const usersList: number[] = [
      ...new Set(comments.map((comment: any) => comment.authorId)),
    ];
    const users = await this.usersService.findManyUsers(usersList);
    const userMap = new Map(users.map((user) => [user.id, user]));
    const commentsMap = new Map<number, CommentWithAuthor[]>();
    const topLevelComments: CommentWithAuthor[] = [];

    // loop the comments in reverse as the result is orderd by depth,
    // which later helps to build the child comments list
    for (const comment of comments.reverse()) {
      comment.childComments = (commentsMap.get(comment.id) ?? []).reverse();
      comment.author = userMap.get(comment.authorId) as UserWithoutPassword;
      comment.hasMore = comment.childComments.length === recursiveLimit + 1;

      if (comment.hasMore) {
        comment.childComments.pop();
      }

      if (comment.parentCommentId !== null) {
        if (!commentsMap.has(comment.parentCommentId)) {
          commentsMap.set(comment.parentCommentId, []);
        }

        commentsMap.get(comment.parentCommentId)?.push(comment);
      } else {
        topLevelComments.push(comment);
      }
    }

    const hasMore = comments.length === anchorLimit + 1;
    if (hasMore) {
      comments.pop();
    }

    return { comments: topLevelComments.reverse(), hasMore };
  }

  async updateComment(
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const data = { ...updateCommentDto };

    if (updateCommentDto.content !== undefined) {
      data.content = this.filterService.filterText(updateCommentDto.content);
    }

    return await this.prismaService.comment
      .update({
        where: { id: commentId },
        data,
      })
      .catch((e) => {
        this.logger.error(
          `Failed to update comment ${commentId}`,
          e instanceof Error ? e.stack : undefined,
          PostsService.name,
        );

        throw new BadRequestException('Failed to update comment');
      });
  }
}
