import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bootstrap } from './main';

describe('application bootstrap entrypoint', () => {
  it('uses structured Nest logging instead of raw console output', () => {
    const source = readFileSync(resolve(__dirname, 'main.ts'), 'utf8');

    expect(source).not.toContain('console.log');
    expect(source).not.toContain('console.error');
    expect(source).toContain('Logger');
  });

  it('listens on the configured port and logs startup through Nest logger', async () => {
    const app = {
      listen: jest.fn().mockResolvedValue(undefined),
    };
    const logger = {
      error: jest.fn(),
      log: jest.fn(),
    };

    await bootstrap({
      createApp: jest.fn().mockResolvedValue(app),
      env: { PORT: '4123' },
      logger,
    });

    expect(app.listen).toHaveBeenCalledWith(4123);
    expect(logger.log).toHaveBeenCalledWith('Server running on port 4123');
    expect(logger.error).not.toHaveBeenCalled();
  });
});
