export interface EmailMessage {
    to: string;
    body: string;
    from: string;
    template?: "organizationMemberInvitation" | "forgotPassword";
    templateData: {
        organizationId: string;
        organizationName: string;
        organizationLogo?: string;
        primaryColor?: string;
        secondaryColor?: string;
        inviterName?: string;
        invitationLink?: string;
        resetLink?: string;
        expiryHours?: number;
    };
}

export interface SQSRecord {
    messageId: string;
    body: string;
    receiptHandle: string;
}

export interface SQSEvent {
    Records: SQSRecord[];
}
