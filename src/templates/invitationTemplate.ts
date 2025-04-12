import { getBaseTemplate } from "./baseTemplate";

export interface InvitationTemplateData {
    organizationId: string;
    organizationName: string;
    organizationLogo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    inviterName?: string;
    invitationLink?: string;
    expiryHours?: number;
}

export const getInvitationTemplate = (
    data: InvitationTemplateData
): { emailSubject: string; emailBody: string } => {
    const content = `
    <h2>Welcome to ${data.organizationName}!</h2>
    <p>Hello,</p>
    <p>${data.inviterName} has invited you to join ${data.organizationName}. We're excited to have you on board!</p>
    <p>To get started, please click the button below to set up your account:</p>
    <div class="text-center">
      <a href="${data.invitationLink}" class="button">Accept Invitation</a>
    </div>
    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    <p>Best regards,<br>The ${data.organizationName} Team</p>
  `;

    return {
        emailSubject: `Welcome to ${data.organizationName}!`,
        emailBody: getBaseTemplate({
            organizationName: data.organizationName,
            organizationLogo: data.organizationLogo || "",
            primaryColor: data.primaryColor || "#000000",
            secondaryColor: data.secondaryColor || "#FFFFFF"
        }).replace("{{content}}", content)
    };
};
