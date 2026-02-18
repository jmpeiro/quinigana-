import pool from '../config/database';
import { UserModel } from '../models/user.model';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    execute: jest.fn(),
  },
}));

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (pool.execute as jest.Mock).mockResolvedValue([{ insertId: 123 }]);
  });

  it('creates local users without admin privileges', async () => {
    await UserModel.create({
      email: 'user@test.com',
      password_hash: 'hash',
      first_name: 'User',
      last_name: 'Test',
    });

    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining("'local', FALSE"),
      ['user@test.com', 'hash', 'User', 'Test']
    );
  });

  it('creates google users without admin privileges', async () => {
    await UserModel.createGoogleUser({
      email: 'google@test.com',
      google_id: 'google-id',
      first_name: 'Google',
      last_name: 'User',
      avatar_url: null,
    });

    expect(pool.execute).toHaveBeenCalledWith(
      expect.stringContaining("'google', TRUE, FALSE"),
      ['google@test.com', 'google-id', 'Google', 'User', null]
    );
  });
});
