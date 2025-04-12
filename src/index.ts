import { SQSEvent } from "aws-lambda";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { EmailMessage } from "./types";
import { getInvitationTemplate } from "./templates/invitationTemplate";

const sesClient = new SESClient({});

const getEmailContent = (
    emailMessage: EmailMessage
): { emailSubject: string; emailBody: string } => {
    if (emailMessage.template) {
        switch (emailMessage.template) {
            case "organizationMemberInvitation":
                if (!emailMessage.to) {
                    throw new Error("Missing required invitation template data");
                }
                // eslint-disable-next-line no-case-declarations
                const { emailSubject, emailBody } = getInvitationTemplate({
                    ...emailMessage.templateData
                });

                return {
                    emailSubject: emailSubject,
                    emailBody: emailBody
                };

            // case "forgotPassword":
            //     if (!emailMessage.to) {
            //         throw new Error("Missing required forgot password template data");
            //     }
            //     return getForgotPasswordTemplate({
            //         ...emailMessage.templateData
            //     });

            default:
                return { emailSubject: "empty", emailBody: emailMessage.body };
        }
    }
    return { emailSubject: "empty", emailBody: emailMessage.body };
};

interface SQSBatchResponse {
    batchItemFailures: {
        itemIdentifier: string;
    }[];
}

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    const batchItemFailures: string[] = [];

    try {
        console.log("Processing SQS messages:", JSON.stringify(event, null, 2));

        for (const record of event.Records) {
            try {
                // Parse the message body
                const emailMessage: EmailMessage = JSON.parse(record.body);

                // Validate required fields
                if (!emailMessage.to || !emailMessage.from) {
                    throw new Error("Missing required email fields");
                }

                // Get email content based on template or plain text
                const emailContent = getEmailContent(emailMessage);

                // Prepare email parameters
                const emailParams = {
                    Source: emailMessage.from,
                    Destination: {
                        ToAddresses: [emailMessage.to]
                    },
                    Message: {
                        Subject: {
                            Data: emailContent.emailSubject
                        },
                        Body: {
                            Html: {
                                Data: emailContent.emailBody
                            }
                        }
                    }
                };

                // Send email using SES
                const command = new SendEmailCommand(emailParams);
                const result = await sesClient.send(command);
                console.log("Email sent successfully:", result);
            } catch (error) {
                console.error("Error processing message:", record.messageId, error);
                // Add failed message ID to the batch item failures
                batchItemFailures.push(record.messageId);
                // Continue processing other messages
                continue;
            }
        }

        // If all messages failed, throw an error
        if (batchItemFailures.length === event.Records.length) {
            throw new Error("All messages in batch failed processing");
        }

        // Return the batch item failures to trigger DLQ for specific failed messages
        return {
            batchItemFailures: batchItemFailures.map((messageId) => ({
                itemIdentifier: messageId
            }))
        };
    } catch (error) {
        console.error("Error processing SQS event:", error);
        throw error;
    }
};
