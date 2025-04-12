import { AWS_ACCOUNT, DEVELOPER_EMAIL, DOMAIN_NAME, DOMAIN_ZONE_ID } from "../configuration";
import { Region } from "./regions";

export enum Stage {
    BETA = "beta",
    PROD = "prod"
}

export const STAGES = [
    {
        stageName: Stage.BETA,
        env: { region: Region.US_EAST_1, account: AWS_ACCOUNT },
        isProd: false,
        sesAttr: {
            // Email addresses will be added to the verified list and will be sent a confirmation email
            emailList: [DEVELOPER_EMAIL],
            // Email addresses to subscribe to SNS topic for delivery notifications
            notifList: [DEVELOPER_EMAIL],
            // Notify on delivery status inc Send, Delivery, Open
            sendDeliveryNotifications: true
        },
        domainAttr: {
            // zoneName for the email domain is required. hostedZoneId for a Route53 domain is optional.
            zoneName: DOMAIN_NAME,
            hostedZoneId: DOMAIN_ZONE_ID
        }
    },
    {
        stageName: Stage.PROD,
        env: { region: Region.US_WEST_2, account: AWS_ACCOUNT },
        isProd: true,
        sesAttr: {
            // Email addresses will be added to the verified list and will be sent a confirmation email
            emailList: [DEVELOPER_EMAIL],
            // Email addresses to subscribe to SNS topic for delivery notifications
            notifList: [],
            // Notify on delivery status inc Send, Delivery, Open
            sendDeliveryNotifications: true
        },
        domainAttr: {
            // zoneName for the email domain is required. hostedZoneId for a Route53 domain is optional.
            zoneName: DOMAIN_NAME,
            hostedZoneId: DOMAIN_ZONE_ID
        }
    }
];
