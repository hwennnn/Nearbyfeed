import { BadRequestException } from '@nestjs/common';
import { imageUploadOptions } from './ImageUploadOptions';

const runFileFilter = (mimetype: string, cb: jest.Mock): void => {
  imageUploadOptions.fileFilter?.(
    {} as never,
    { mimetype } as Express.Multer.File,
    cb,
  );
};

describe('imageUploadOptions', () => {
  it('rejects unsupported image uploads with a single callback', () => {
    const cb = jest.fn();

    runFileFilter('text/plain', cb);

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(expect.any(BadRequestException), false);
  });

  it('accepts jpg, jpeg, and png uploads', () => {
    for (const mimetype of ['image/jpg', 'image/jpeg', 'image/png']) {
      const cb = jest.fn();

      runFileFilter(mimetype, cb);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(null, true);
    }
  });
});
