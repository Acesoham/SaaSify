import nodemailer from 'nodemailer';

// Create transporter — uses Gmail by default (works with App Password)
// Falls back to Ethereal for dev if no SMTP env vars are set
let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    // Convenient Gmail shortcut
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });
  } else {
    // Dev fallback: Ethereal (no actual emails sent, but viewable via URL logged)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[Email] Using Ethereal dev account:', testAccount.user);
  }

  return transporter;
}

export const emailService = {
  async sendInviteEmail({ toEmail, inviterName, tenantName, role, inviteLink }) {
    try {
      const transport = await getTransporter();

      const roleColor = role === 'admin' ? '#6B4DA0' : role === 'viewer' ? '#969A92' : '#287D48';
      const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You're invited to join ${tenantName} on SaaSify</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F9F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F9F5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;border:1px solid #E5E7E0;overflow:hidden;box-shadow:0 4px 24px rgba(23,24,32,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#171820;padding:28px 32px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-flex;align-items:center;gap:10px;">
                      <div style="width:36px;height:36px;background:#C4F13B;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;color:#171820;vertical-align:middle;">S</div>
                      <span style="color:#ffffff;font-size:20px;font-weight:700;vertical-align:middle;margin-left:10px;">SaaSify</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">

              <!-- Invite icon -->
              <div style="text-align:center;margin-bottom:24px;">
                <div style="width:64px;height:64px;background:#EFF9D4;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">🎉</div>
              </div>

              <h1 style="color:#171820;font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;">You're invited!</h1>
              <p style="color:#6B7068;font-size:15px;text-align:center;margin:0 0 28px;line-height:1.6;">
                <strong style="color:#171820;">${inviterName}</strong> has invited you to join<br/>
                <strong style="color:#171820;font-size:17px;">"${tenantName}"</strong> on SaaSify
              </p>

              <!-- Role badge -->
              <div style="background:#F8F9F5;border:1px solid #E5E7E0;border-radius:12px;padding:14px 18px;margin-bottom:28px;display:flex;align-items:center;gap:12px;">
                <div style="width:36px;height:36px;background:#EFF9D4;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;vertical-align:middle;">🛡️</div>
                <div style="vertical-align:middle;display:inline-block;margin-left:12px;">
                  <p style="color:#969A92;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 2px;">Your Role</p>
                  <p style="color:${roleColor};font-size:15px;font-weight:700;margin:0;">${roleLabel}</p>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${inviteLink}"
                   style="display:inline-block;background:#C4F13B;color:#171820;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;box-shadow:0 4px 16px rgba(196,241,59,0.3);">
                  Accept Invitation →
                </a>
              </div>

              <p style="color:#969A92;font-size:12px;text-align:center;margin:0 0 8px;">Or copy this link into your browser:</p>
              <div style="background:#F8F9F5;border:1px solid #E5E7E0;border-radius:8px;padding:10px 14px;word-break:break-all;">
                <a href="${inviteLink}" style="color:#3478B9;font-size:12px;text-decoration:none;">${inviteLink}</a>
              </div>

              <p style="color:#969A92;font-size:12px;text-align:center;margin:24px 0 0;line-height:1.6;">
                This invitation link is valid for <strong>7 days</strong>.<br/>
                If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8F9F5;border-top:1px solid #E5E7E0;padding:20px 32px;text-align:center;">
              <p style="color:#969A92;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} SaaSify · Team Collaboration Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim();

      const info = await transport.sendMail({
        from: `"SaaSify" <${process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@saasify.app'}>`,
        to: toEmail,
        subject: `You're invited to join "${tenantName}" on SaaSify`,
        html,
        text: `Hi! ${inviterName} has invited you to join "${tenantName}" on SaaSify as a ${roleLabel}.\n\nAccept your invitation here: ${inviteLink}\n\nThis link expires in 7 days.`,
      });

      // Log Ethereal preview URL in dev
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        console.log('[Email] Preview URL:', preview);
      }

      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('[Email] Failed to send invite email:', err.message);
      return { success: false, error: err.message };
    }
  },
};
