import nodemailer from "nodemailer";

export function createTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT || 587) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

export async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log("Email skipped because SMTP env variables are not configured", { to, subject });
    return { skipped: true };
  }

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    text
  });
}

export async function notifyProcurementAction({ to, title, message }) {
  return sendEmail({
    to,
    subject: title,
    text: message,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>${title}</h2><p>${message}</p><p>MarineProcure Portal</p></div>`
  });
}
