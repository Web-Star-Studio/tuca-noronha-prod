"use node";

import * as nodemailer from "nodemailer";
import type { EmailData, EmailLog } from "./types";
import { getEmailConfig, EMAIL_SETTINGS } from "./config";
import { getEmailTemplate } from "./templates";

// Serviço principal de email
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  
  constructor() {
    this.initializeTransporter();
  }
  
  private async initializeTransporter(): Promise<void> {
    try {
      const config = getEmailConfig();
      
      // Criar transporter com as configurações
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass,
        },
      });
      
      // Verificar conexão
      if (this.transporter) {
        await this.transporter.verify();
      }
      console.log("✅ Email service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize email service:", error);
      this.transporter = null;
    }
  }
  
  async sendEmail(emailData: EmailData): Promise<EmailLog> {
    const log: EmailLog = {
      type: emailData.type,
      to: emailData.to,
      subject: emailData.subject,
      status: "pending",
      createdAt: Date.now(),
    };
    
    try {
      if (!this.transporter) {
        throw new Error("Email transporter not initialized");
      }
      
      const config = getEmailConfig();
      const settings = EMAIL_SETTINGS[emailData.type];
      
      // Gerar HTML do template
      const htmlContent = getEmailTemplate(emailData);
      
      // Configurar opções do email
      const mailOptions: nodemailer.SendMailOptions = {
        from: {
          name: config.from.name,
          address: config.from.email,
        },
        to: emailData.to,
        subject: emailData.subject,
        html: htmlContent,
        priority: settings?.priority || emailData.priority || "normal",
      };
      
      // Adicionar CC se configurado
      const settingsTyped = settings as any;
      if (settingsTyped?.cc || emailData.cc) {
        mailOptions.cc = [...(settingsTyped?.cc || []), ...(emailData.cc || [])];
      }
      
      // Adicionar BCC se configurado
      if (emailData.bcc) {
        mailOptions.bcc = emailData.bcc;
      }
      
      // Adicionar reply-to se configurado
      if (settingsTyped?.replyTo) {
        mailOptions.replyTo = settingsTyped.replyTo;
      }
      
      // Enviar email
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent successfully: ${emailData.type} to ${emailData.to}`);
      console.log(`📧 Message ID: ${result.messageId}`);
      
      // Para desenvolvimento, mostrar preview URL se disponível
      if (process.env.NODE_ENV === "development") {
        const previewUrl = nodemailer.getTestMessageUrl(result);
        if (previewUrl) {
          console.log(`🔗 Preview URL: ${previewUrl}`);
        }
      }
      
      log.status = "sent";
      log.sentAt = Date.now();
      
    } catch (error) {
      console.error(`❌ Failed to send email: ${emailData.type} to ${emailData.to}`, error);
      log.status = "failed";
      log.error = error instanceof Error ? error.message : String(error);
    }
    
    return log;
  }
  
  async sendBulkEmails(emailsData: EmailData[]): Promise<EmailLog[]> {
    const logs: EmailLog[] = [];
    
    for (const emailData of emailsData) {
      try {
        const log = await this.sendEmail(emailData);
        logs.push(log);
        
        // Pequeno delay entre emails para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send bulk email to ${emailData.to}:`, error);
        logs.push({
          type: emailData.type,
          to: emailData.to,
          subject: emailData.subject,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
          createdAt: Date.now(),
        });
      }
    }
    
    return logs;
  }
  
  // Método para testar configuração de email
  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }
      
      if (!this.transporter) {
        return false;
      }
      
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("Email connection test failed:", error);
      return false;
    }
  }
}

// Instância singleton do serviço de email
let emailServiceInstance: EmailService | null = null;

export const getEmailService = (): EmailService => {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
};

// Função auxiliar para enviar email rapidamente
export const sendQuickEmail = async (emailData: EmailData): Promise<EmailLog> => {
  const service = getEmailService();
  return await service.sendEmail(emailData);
};

// Função para criar conta de teste (desenvolvimento)
export const createTestAccount = async () => {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Test accounts can only be created in development mode");
  }
  
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log("🧪 Test account created:");
    console.log(`User: ${testAccount.user}`);
    console.log(`Pass: ${testAccount.pass}`);
    console.log(`SMTP: ${testAccount.smtp.host}:${testAccount.smtp.port}`);
    return testAccount;
  } catch (error) {
    console.error("Failed to create test account:", error);
    throw error;
  }
}; 