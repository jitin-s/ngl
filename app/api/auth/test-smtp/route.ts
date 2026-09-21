import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testEmail, host, port, user, pass, senderEmail } = body;

    const targetEmail = testEmail || user;
    if (!targetEmail) {
      return NextResponse.json({ error: 'Please provide a test email address to receive the test email.' }, { status: 400 });
    }

    const smtpHost = host || process.env.SMTP_HOST || 'smtp-relay.brevo.com';
    const smtpPort = parseInt(String(port || process.env.SMTP_PORT || '587'), 10);
    const smtpUser = user || process.env.SMTP_USER || process.env.GMAIL_USER || '';
    const smtpPass = pass || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';
    const fromAddress = senderEmail || process.env.SMTP_FROM || smtpUser;

    if (!smtpUser || !smtpPass) {
      return NextResponse.json({
        error: 'Missing SMTP credentials. Please provide Username/Login and Password/SMTP Key.',
      }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Verify connection configuration
    await transporter.verify();

    // Send a test email
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const info = await transporter.sendMail({
      from: `"nglcrush 💖" <${fromAddress}>`,
      to: targetEmail,
      subject: `🌸 Test OTP Verification Code: ${testOtp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 25px; background: #1a0215; color: white; border-radius: 16px;">
          <h2 style="color: #fda4af;">nglcrush ✨</h2>
          <p>This is a test verification email from Brevo SMTP!</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px; background: #e11d48; color: white; display: inline-block; border-radius: 10px;">
            ${testOtp}
          </div>
          <p style="color: #fbcfe8; font-size: 12px; margin-top: 15px;">Your SMTP connection is working perfectly! 🌸</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${targetEmail}! Message ID: ${info.messageId}`,
      info,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to send test email.',
      details: err,
    }, { status: 500 });
  }
}
