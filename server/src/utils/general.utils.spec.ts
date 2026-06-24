import { sanitize } from './general.utils';

describe('sanitize', () => {
  it('removes password-like fields recursively without removing auth tokens', () => {
    const source = {
      accessToken: 'access-token',
      password: 'hashed-password',
      profile: {
        newPassword: 'new-secret',
        originalPassword: 'old-secret',
        refreshToken: 'refresh-token',
      },
      users: [
        {
          passwordHash: 'hash',
          username: 'mina',
        },
      ],
    };

    expect(sanitize(source, 'password')).toEqual({
      accessToken: 'access-token',
      profile: {
        refreshToken: 'refresh-token',
      },
      users: [
        {
          username: 'mina',
        },
      ],
    });
  });
});
