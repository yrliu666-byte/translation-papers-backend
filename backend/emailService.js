const nodemailer = require('nodemailer');

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Missing SMTP config: SMTP_HOST, SMTP_USER, SMTP_PASS are required');
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: parseInt(SMTP_PORT || '587') === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

function buildEmailHTML(papers) {
  const paperItems = papers.slice(0, 10).map((p, i) => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #eee;">
        <div style="font-size:15px;font-weight:600;margin-bottom:6px;">
          ${i + 1}. <a href="${p.url}" style="color:#1a73e8;text-decoration:none;">${p.title}</a>
        </div>
        <div style="font-size:13px;color:#555;margin-bottom:4px;">
          ${p.authors} · ${p.journal} · ${p.publish_date}
        </div>
        <div style="font-size:13px;color:#333;line-height:1.6;">
          ${p.abstract !== 'No abstract available' ? p.abstract.slice(0, 200) + (p.abstract.length > 200 ? '…' : '') : ''}
        </div>
      </td>
    </tr>`).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:20px;color:#222;">
  <h2 style="color:#1a73e8;border-bottom:2px solid #1a73e8;padding-bottom:8px;">
    翻译史论文周报
  </h2>
  <p style="color:#555;font-size:14px;">本周为您精选 ${Math.min(papers.length, 10)} 篇翻译史相关论文：</p>
  <table style="width:100%;border-collapse:collapse;">${paperItems}</table>
  <p style="font-size:12px;color:#999;margin-top:24px;">
    如需退订，请回复此邮件并注明"退订"。
  </p>
</body>
</html>`;
}

async function sendWeeklyDigest(subscribers, papers) {
  if (!subscribers || subscribers.length === 0) {
    console.log('No subscribers, skipping weekly email.');
    return;
  }
  if (!papers || papers.length === 0) {
    console.log('No papers to send.');
    return;
  }

  let transporter;
  try {
    transporter = createTransporter();
  } catch (err) {
    console.error('Email service not configured:', err.message);
    return;
  }

  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const html = buildEmailHTML(papers);
  const subject = `翻译史论文周报 · ${new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}`;

  let sent = 0;
  for (const email of subscribers) {
    try {
      await transporter.sendMail({ from, to: email, subject, html });
      sent++;
    } catch (err) {
      console.error(`Failed to send to ${email}:`, err.message);
    }
  }
  console.log(`Weekly digest sent to ${sent}/${subscribers.length} subscribers.`);
}

module.exports = { sendWeeklyDigest };
