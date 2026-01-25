import nodemailer from 'nodemailer';
import { env } from '../config/environment';
import { UserModel } from '../models/user.model';

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.port === 465,
  auth: {
    user: env.email.user,
    pass: env.email.pass,
  },
});

export class EmailService {
  static async sendPasswordReset(email: string, name: string, token: string): Promise<void> {
    const resetUrl = `${env.frontendUrl}/auth/reset-password?token=${token}`;

    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #f5f5f5; padding: 40px; border-radius: 12px;">
        <h1 style="color: #e94560; margin-bottom: 24px;">QuiniGana</h1>
        <h2 style="margin-bottom: 16px;">Password Reset</h2>
        <p>Hi ${name},</p>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #e94560; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; margin: 24px 0; font-weight: 600;">
          Reset Password
        </a>
        <p style="color: #9e9e9e; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        <hr style="border: 1px solid #0f3460; margin: 24px 0;" />
        <p style="color: #9e9e9e; font-size: 12px;">QuiniGana - Your collaborative betting platform</p>
      </div>
    `;

    await transporter.sendMail({
      from: env.email.from,
      to: email,
      subject: 'QuiniGana - Reset your password',
      html,
    });
  }

  static async sendNotificationEmail(userId: number, subject: string, message: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) return;

    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #f5f5f5; padding: 40px; border-radius: 12px;">
        <h1 style="color: #e94560; margin-bottom: 24px;">QuiniGana</h1>
        <h2 style="margin-bottom: 16px;">${subject}</h2>
        <p>Hola ${user.first_name},</p>
        <p>${message}</p>
        <a href="${env.frontendUrl}/dashboard" style="display: inline-block; background: #e94560; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; margin: 24px 0; font-weight: 600;">
          Ir a QuiniGana
        </a>
        <hr style="border: 1px solid #0f3460; margin: 24px 0;" />
        <p style="color: #9e9e9e; font-size: 12px;">QuiniGana - Tu plataforma colaborativa de quinielas</p>
      </div>
    `;

    await transporter.sendMail({
      from: env.email.from,
      to: user.email,
      subject: `QuiniGana - ${subject}`,
      html,
    });
  }
}
