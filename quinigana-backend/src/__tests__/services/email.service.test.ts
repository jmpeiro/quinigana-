jest.mock('../../config/environment', () => ({
  env: {
    frontendUrl: 'http://localhost:4200',
    email: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', from: 'test@test.com' },
  },
}));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  }),
}));
jest.mock('../../models/user.model');

import nodemailer from 'nodemailer';
import { EmailService } from '../../services/email.service';
import { UserModel } from '../../models/user.model';

const mockTransport = (nodemailer.createTransport as jest.Mock)();
const mockSendMail = mockTransport.sendMail as jest.Mock;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================
  // sendPasswordReset
  // =====================================================
  describe('sendPasswordReset', () => {
    it('should send a password reset email with correct parameters', async () => {
      await EmailService.sendPasswordReset('user@test.com', 'John', 'reset-token-123');

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('user@test.com');
      expect(call.from).toBe('test@test.com');
      expect(call.subject).toContain('Reset');
      expect(call.html).toContain('John');
      expect(call.html).toContain('reset-token-123');
    });

    it('should include the frontend URL in the reset link', async () => {
      await EmailService.sendPasswordReset('user@test.com', 'Jane', 'my-token');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('http://localhost:4200/auth/reset-password?token=my-token');
    });

    it('should throw if sendMail fails', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      await expect(
        EmailService.sendPasswordReset('user@test.com', 'John', 'token')
      ).rejects.toThrow('SMTP error');
    });
  });

  // =====================================================
  // sendEmailVerification
  // =====================================================
  describe('sendEmailVerification', () => {
    it('should send a verification email with correct parameters', async () => {
      await EmailService.sendEmailVerification('user@test.com', 'Maria', 'verify-token');

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('user@test.com');
      expect(call.subject).toContain('Verifica');
      expect(call.html).toContain('Maria');
      expect(call.html).toContain('verify-token');
    });

    it('should include the frontend verification URL', async () => {
      await EmailService.sendEmailVerification('user@test.com', 'Maria', 'abc123');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('http://localhost:4200/auth/verify-email?token=abc123');
    });

    it('should throw if sendMail fails', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(
        EmailService.sendEmailVerification('user@test.com', 'Maria', 'token')
      ).rejects.toThrow('Connection refused');
    });
  });

  // =====================================================
  // sendNotificationEmail
  // =====================================================
  describe('sendNotificationEmail', () => {
    it('should send a notification email to the user', async () => {
      mockUserModel.findById.mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        first_name: 'Carlos',
      } as any);

      await EmailService.sendNotificationEmail(1, 'Results Published', 'Your scores are ready!');

      expect(mockUserModel.findById).toHaveBeenCalledWith(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('user@test.com');
      expect(call.subject).toContain('Results Published');
      expect(call.html).toContain('Carlos');
      expect(call.html).toContain('Your scores are ready!');
    });

    it('should not send email if user is not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await EmailService.sendNotificationEmail(999, 'Subject', 'Message');

      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should include dashboard link in notification email', async () => {
      mockUserModel.findById.mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        first_name: 'Test',
      } as any);

      await EmailService.sendNotificationEmail(1, 'Alert', 'Check it out');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('http://localhost:4200/dashboard');
    });
  });
});
