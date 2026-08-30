import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { prisma } from "../config/prisma.js";

const MAIL_CONFIG_KEYS = {
  EMAIL: "mail_email",
  PASSWORD: "mail_password",
} as const;

export interface MailConfig {
  email: string;
  password: string;
}

export async function getMailConfig(): Promise<MailConfig> {
  const [emailRow, passwordRow] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { key: MAIL_CONFIG_KEYS.EMAIL } }),
    prisma.siteConfig.findUnique({ where: { key: MAIL_CONFIG_KEYS.PASSWORD } }),
  ]);
  return {
    email: emailRow?.value ?? "",
    password: passwordRow?.value ?? "",
  };
}

export async function updateMailConfig(input: MailConfig): Promise<MailConfig> {
  await Promise.all([
    prisma.siteConfig.upsert({
      where: { key: MAIL_CONFIG_KEYS.EMAIL },
      update: { value: input.email },
      create: { key: MAIL_CONFIG_KEYS.EMAIL, value: input.email },
    }),
    prisma.siteConfig.upsert({
      where: { key: MAIL_CONFIG_KEYS.PASSWORD },
      update: { value: input.password },
      create: { key: MAIL_CONFIG_KEYS.PASSWORD, value: input.password },
    }),
  ]);
  return input;
}

async function createTransporter() {
  const config = await getMailConfig();
  if (!config.email || !config.password) {
    return null;
  }
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: config.email,
      pass: config.password,
    },
  });
}

function loadTemplate(name: string): string {
  const filePath = path.resolve("src/templates", name);
  return fs.readFileSync(filePath, "utf8");
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  password: string,
): Promise<boolean> {
  const transporter = await createTransporter();
  if (!transporter) return false;

  let template = loadTemplate("welcome.html");
  template = template.replace("{{NAME}}", name);
  template = template.replace("{{EMAIL}}", to);
  template = template.replace("{{PASSWORD}}", password);

  try {
    await transporter.sendMail({
      from: `"Note" <${(await getMailConfig()).email}>`,
      to,
      subject: "Chào mừng bạn đến với Note — Thông tin tài khoản",
      html: template,
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendResetPasswordEmail(
  to: string,
  name: string,
  newPassword: string,
): Promise<boolean> {
  const transporter = await createTransporter();
  if (!transporter) return false;

  let template = loadTemplate("reset-password.html");
  template = template.replace("{{NAME}}", name);
  template = template.replace("{{EMAIL}}", to);
  template = template.replace("{{PASSWORD}}", newPassword);

  try {
    await transporter.sendMail({
      from: `"Note" <${(await getMailConfig()).email}>`,
      to,
      subject: "Note — Mật khẩu mới của bạn",
      html: template,
    });
    return true;
  } catch {
    return false;
  }
}
