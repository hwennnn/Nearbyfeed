import { GUARDS_METADATA } from '@nestjs/common/constants';
import { BadRequestException } from '@nestjs/common';
import { UserActiveGuard } from './guards';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  const createController = () => {
    const usersService = {
      blockUser: jest.fn().mockResolvedValue(undefined),
      deleteBlock: jest.fn().mockResolvedValue(undefined),
      findOwnComments: jest.fn().mockResolvedValue({ comments: [], hasMore: false }),
      findOwnPosts: jest.fn().mockResolvedValue({ posts: [], hasMore: false }),
      findOne: jest.fn().mockResolvedValue({ id: 7 }),
      update: jest.fn().mockResolvedValue({}),
    };
    const imagesService = {
      uploadImage: jest.fn(),
    };

    return {
      controller: new UsersController(usersService as any, imagesService as any),
      usersService,
    };
  };

  it('protects own comments with the active-user guard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      UsersController.prototype.findOwnComments,
    );

    expect(guards).toContain(UserActiveGuard);
  });

  it('rejects malformed own-post user ids before querying users', async () => {
    const { controller, usersService } = createController();

    await expect(controller.findOwnPosts('nope', '7', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usersService.findOwnPosts).not.toHaveBeenCalled();
  });

  it('rejects malformed token user ids before querying the self profile', async () => {
    const { controller, usersService } = createController();

    await expect(controller.getSelf('not-a-user')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usersService.findOne).not.toHaveBeenCalled();
  });

  it('rejects malformed blocked user ids before mutating blocks', async () => {
    const { controller, usersService } = createController();

    await expect(controller.blockUser('7', '7', 'nope')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(usersService.blockUser).not.toHaveBeenCalled();
  });

  it('passes parsed numeric ids to block mutations', async () => {
    const { controller, usersService } = createController();

    await controller.blockUser('7', '7', '8');

    expect(usersService.blockUser).toHaveBeenCalledWith(7, 8);
  });
});
