import nodemailer from "nodemailer";
import { config } from "./config.js";

let transporterPromise;

async function createTransporter() {
  if (config.smtp.user && config.smtp.password) {
    return nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password
      }
    });
  }

  console.log("SMTP credentials not supplied. Creating temporary Ethereal account...");
  const testAccount = await nodemailer.createTestAccount();

  console.log("Temporary Ethereal account:");
  console.log(`User: ${testAccount.user}`);
  console.log(`Pass: ${testAccount.pass}`);

  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
}

export async function getTransporter() {
  if (!transporterPromise) transporterPromise = createTransporter();
  return transporterPromise;
}

export async function sendScheduledEmail(email) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: config.smtp.from,
    to: email.to,
    subject: email.subject,
    text: email.body
  });

  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info) || null
  };
}
