import nodemailer from 'nodemailer';

export default {
  async sendEmail({ to, subject, text }) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Kalado Coffee" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });
  },
};
