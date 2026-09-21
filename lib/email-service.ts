import nodemailer from 'nodemailer';

export async function sendOtpEmail(toEmail: string, username: string, otp: string): Promise<boolean> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || '';
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASS || '';
  const from = process.env.SMTP_FROM || `"nglcrush 💖" <${user || 'noreply@nglcrush.com'}>`;

  if (!user || !pass) {
    console.warn('⚠️ SMTP credentials not found in .env.local (SMTP_USER/GMAIL_USER and SMTP_PASS/GMAIL_APP_PASSWORD).');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; background: linear-gradient(135deg, #1f0418 0%, #12020e 100%); color: #fff; border-radius: 24px; padding: 36px 28px; border: 1px solid rgba(244, 63, 94, 0.25); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 40px; line-height: 1;">🌸</div>
          <h1 style="color: #fda4af; margin: 8px 0 4px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">nglcrush</h1>
          <p style="color: #fbcfe8; font-size: 13px; margin: 0; opacity: 0.8;">Zero-Gap Protected Sanctuary</p>
        </div>

        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 18px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #fce7f3; font-size: 15px; margin: 0 0 16px 0;">Hello <strong>${username || 'Dear Lover'}</strong>, here is your confirmation code:</p>
          <div style="background: linear-gradient(90deg, #e11d48, #db2777); color: #ffffff; font-size: 34px; font-weight: 900; letter-spacing: 8px; padding: 14px 24px; border-radius: 14px; font-family: monospace; display: inline-block; box-shadow: 0 4px 20px rgba(225, 29, 72, 0.4);">
            ${otp}
          </div>
          <p style="color: #fda4af; font-size: 12px; margin: 16px 0 0 0; opacity: 0.85;">⏰ Valid for 10 minutes. Never share this code with anyone.</p>
        </div>

        <p style="color: #fbcfe8; font-size: 12px; text-align: center; margin: 0; opacity: 0.6; line-height: 1.5;">
          If you did not request this verification code, you can safely ignore this email.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `🌸 ${otp} is your nglcrush Verification Code`,
      text: `Hello ${username},\n\nYour verification code is: ${otp}\n\nValid for 10 minutes.\n\nnglcrush 💖`,
      html: htmlContent,
    });

    console.log(`✅ Verification email sent to ${toEmail} via nodemailer SMTP`);
    return true;
  } catch (err) {
    console.error('❌ Failed to dispatch email via nodemailer:', err);
    return false;
  }
}
