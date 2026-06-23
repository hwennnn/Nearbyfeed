import { MODULE_METADATA } from '@nestjs/common/constants';
import { ImagesModule } from './images.module';

describe('ImagesModule', () => {
  it('does not expose a standalone public upload controller', () => {
    const controllers =
      Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, ImagesModule) ?? [];

    expect(controllers).toEqual([]);
  });
});
