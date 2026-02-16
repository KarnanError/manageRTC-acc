/**
 * Email Service for Super Admin Users
 * Handles sending emails for superadmin account creation and management
 */

import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Get email template based on type
 * @param {string} type - Email type (create, password-reset, resend-credentials)
 * @returns {string} HTML content
 */
function getEmailTemplate(type) {
  const templates = {
    create: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #e5e7eb; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #6b7280; margin-left: 10px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Super Admin Account Created</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}} {{lastName}},</p>
      <p>A Super Admin account has been created for you in the system.</p>

      <div class="warning">
        <strong>⚠️ Important:</strong> Please save your credentials securely and change your password after first login.
      </div>

      <div class="details">
        <p><span class="label">Email:</span><span class="value">{{email}}</span></p>
        <p><span class="label">Password:</span><span class="value">{{password}}</span></p>
        <p><span class="label">Role:</span><span class="value">Super Admin</span></p>
      </div>

      <p>To access your account, click the button below:</p>
      <a href="{{loginUrl}}" class="button">Sign In to Your Account</a>

      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6366f1;">{{loginUrl}}</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply to this email.</p>
      <p>If you didn't request this account, please contact your system administrator immediately.</p>
      <p>&copy; {{currentYear}} AmasQIS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,

    'password-reset': `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #e5e7eb; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #6b7280; margin-left: 10px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset - Super Admin Account</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}} {{lastName}},</p>
      <p>Your Super Admin password has been reset.</p>

      <div class="warning">
        <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please contact your system administrator immediately.
      </div>

      <div class="details">
        <p><span class="label">Email:</span><span class="value">{{email}}</span></p>
        <p><span class="label">New Password:</span><span class="value">{{password}}</span></p>
      </div>

      <p>Please sign in with your new password:</p>
      <a href="{{loginUrl}}" class="button">Sign In to Your Account</a>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply to this email.</p>
      <p>&copy; {{currentYear}} AmasQIS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,

    'resend-credentials': `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #e5e7eb; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #6b7280; margin-left: 10px; }
    .info { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Super Admin Credentials</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}} {{lastName}},</p>
      <p>Your Super Admin account credentials have been resent to you.</p>

      <div class="info">
        <strong>ℹ️ Information:</strong> Your previous credentials have been reset. Please use the new credentials below.
      </div>

      <div class="details">
        <p><span class="label">Email:</span><span class="value">{{email}}</span></p>
        <p><span class="label">Password:</span><span class="value">{{password}}</span></p>
        <p><span class="label">Role:</span><span class="value">Super Admin</span></p>
      </div>

      <p>To access your account, click the button below:</p>
      <a href="{{loginUrl}}" class="button">Sign In to Your Account</a>

      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6366f1;">{{loginUrl}}</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply to this email.</p>
      <p>&copy; {{currentYear}} AmasQIS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  };

  return templates[type] || templates['create'];
}

/**
 * Send email to superadmin user
 * @param {Object} emailData - Email data
 * @param {string} emailData.to - Recipient email
 * @param {string} emailData.firstName - First name
 * @param {string} emailData.lastName - Last name
 * @param {string} emailData.email - Email address
 * @param {string} emailData.password - Password
 * @param {string} emailData.loginUrl - Login URL
 * @param {string} emailData.type - Email type (create, password-reset, resend-credentials)
 * @returns {Promise<Object>} Email sending result
 */
export async function sendSuperAdminEmail(emailData) {
  const { to, firstName, lastName, email, password, loginUrl, type = 'create' } = emailData;

  try {
    // Get email template
    let htmlContent = getEmailTemplate(type);

    // Replace placeholders
    htmlContent = htmlContent.replace(/{{firstName}}/g, firstName);
    htmlContent = htmlContent.replace(/{{lastName}}/g, lastName);
    htmlContent = htmlContent.replace(/{{email}}/g, email);
    htmlContent = htmlContent.replace(/{{password}}/g, password);
    htmlContent = htmlContent.replace(/{{loginUrl}}/g, loginUrl);
    htmlContent = htmlContent.replace(/{{currentYear}}/g, new Date().getFullYear());

    // Email subject based on type
    const subjects = {
      create: 'Your Super Admin Account Has Been Created',
      'password-reset': 'Your Super Admin Password Has Been Reset',
      'resend-credentials': 'Your Super Admin Credentials',
    };

    // Send email
    const info = await transporter.sendMail({
      from: `"AmasQIS" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: subjects[type],
      html: htmlContent,
    });

    console.log('Email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Test email configuration
 * @returns {Promise<Object>} Test result
 */
export async function testEmailConfig() {
  try {
    await transporter.verify();
    return {
      success: true,
      message: 'Email configuration is valid',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  sendSuperAdminEmail,
  testEmailConfig,
};
