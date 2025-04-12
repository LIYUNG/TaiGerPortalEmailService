import { Construct } from "constructs";
import { Stage, StageProps } from "aws-cdk-lib";
import { LambdaStack } from "./lambda-stack";
import { APPLICATION_NAME } from "../configuration";
import { EmailMonitorStack } from "./email-monitor-stack";
import { SesConfigStack } from "./ses-config-stack";
interface DeploymentkProps extends StageProps {
    sesAttr: { emailList: string[]; notifList: string[]; sendDeliveryNotifications: boolean };
    domainAttr: { zoneName: string; hostedZoneId: string };
    stageName: string;
    isProd: boolean;
}

export class PipelineAppStage extends Stage {
    readonly lambdaStack: LambdaStack;
    constructor(scope: Construct, id: string, props: DeploymentkProps) {
        super(scope, id, props);

        this.lambdaStack = new LambdaStack(
            this,
            `${APPLICATION_NAME}LambdaStack-${props.stageName}`,
            {
                ...props
            }
        );

        // Use account details from default AWS CLI credentials:
        const { account, region } = props.env ?? {};
        const env = { account, region };

        // Create SES Configuration Stack
        new SesConfigStack(this, `${APPLICATION_NAME}SESConfigStack-${props.stageName}`, {
            description: "SES Domain Configuration Stack for taigerconsultancy-portal.com",
            env,
            sesAttr: props.sesAttr,
            domainAttr: props.domainAttr
        });

        // Create Email Monitor Stack
        const monitorStack = new EmailMonitorStack(
            this,
            `${APPLICATION_NAME}EmailMonitorStack-${props.stageName}`,
            {
                description: "Email Monitor Stack for taigerconsultancy-portal.com sender email",
                env,
                stageName: props.stageName,
                isProd: props.isProd,
                deadLetterQueue: this.lambdaStack.deadLetterQueue
            }
        );

        monitorStack.addDependency(this.lambdaStack);
    }
}
