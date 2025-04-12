import { getBaseTemplate } from "./baseTemplate";

export interface ForgotPasswordTemplateData {
    organizationName: string;
    organizationLogo: string;
    primaryColor: string;
    secondaryColor: string;
    userName: string;
    resetLink: string;
    expiryHours: number;
}

export const getForgotPasswordTemplate = (data: ForgotPasswordTemplateData) => {
    const content = `
    <h2>Password Reset Request</h2>
    <p>Hello ${data.userName},</p>
    <p>We received a request to reset your password for your ${data.organizationName} account.</p>
    <p>Click the button below to create a new password:</p>
    <div class="text-center">
      <a href="${data.resetLink}" class="button">Reset Password</a>
    </div>
    <p>This password reset link will expire in ${data.expiryHours} hours.</p>
    <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
    <p>For security reasons, we recommend:</p>
    <ul>
      <li>Creating a strong password with a mix of letters, numbers, and special characters</li>
      <li>Not sharing your password with anyone</li>
      <li>Using a unique password for your ${data.organizationName} account</li>
    </ul>
    <p>Best regards,<br>The ${data.organizationName} Team</p>
  `;

    return getBaseTemplate({
        organizationName: data.organizationName,
        organizationLogo: data.organizationLogo,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor
    }).replace("{{content}}", content);
};
