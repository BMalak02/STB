import nodemailer from 'nodemailer';
import { logger } from './logger';

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT || '2525'),
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

export const verifyTransporter = async () => {
  try {
    await transporter.verify();
    logger.info('Mail server connection established');
  } catch (error) {
    logger.error('Mail server connection failed:', error);
  }
};
