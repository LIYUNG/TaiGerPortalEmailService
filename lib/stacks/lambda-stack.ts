import * as cdk from "aws-cdk-lib";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";

import { APPLICATION_NAME } from "../configuration";

interface LambdaStackProps extends cdk.StackProps {
    stageName: string;
    isProd: boolean;
}

export class LambdaStack extends cdk.Stack {
    public readonly queueSendMessagePolicy: iam.PolicyStatement; // Policy for sending messages
    public readonly deadLetterQueue: sqs.Queue; // Expose DLQ for monitoring stack

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        // Create Dead Letter Queue
        this.deadLetterQueue = new sqs.Queue(this, `${APPLICATION_NAME}-DLQ-${props.stageName}`, {
            queueName: `${APPLICATION_NAME}-DLQ-${props.stageName}`,
            visibilityTimeout: cdk.Duration.seconds(120),
            retentionPeriod: cdk.Duration.days(14),
            encryption: sqs.QueueEncryption.SQS_MANAGED,
            enforceSSL: true,
            removalPolicy: props.isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
        });

        // Create main SQS Queue with DLQ configuration
        const emailQueue = new sqs.Queue(this, `${APPLICATION_NAME}-Queue-${props.stageName}`, {
            queueName: `${APPLICATION_NAME}-${props.stageName}`,
            visibilityTimeout: cdk.Duration.seconds(120),
            retentionPeriod: cdk.Duration.days(14),
            encryption: sqs.QueueEncryption.SQS_MANAGED,
            enforceSSL: true,
            removalPolicy: props.isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            deadLetterQueue: {
                queue: this.deadLetterQueue,
                maxReceiveCount: 3 // Number of times a message can be received before being sent to DLQ
            }
        });

        // Create a policy statement for sending messages to the queue
        this.queueSendMessagePolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["sqs:SendMessage", "sqs:SendMessageBatch"],
            resources: [emailQueue.queueArn]
        });

        const lambdaFunction = new NodejsFunction(
            this,
            `${APPLICATION_NAME}-Function-${props.stageName}`,
            {
                functionName: `${APPLICATION_NAME}-${props.stageName}`,
                runtime: Runtime.NODEJS_20_X,
                entry: "dist/src/index.js",
                handler: "handler",
                environment: {
                    ENV_VARIABLE: props.stageName
                },
                bundling: {
                    externalModules: ["@aws-sdk/client-ses", "@aws-sdk/client-sqs"],
                    minify: true,
                    sourceMap: true,
                    target: "es2020"
                },
                architecture: cdk.aws_lambda.Architecture.ARM_64,
                memorySize: 128,
                timeout: cdk.Duration.seconds(120),
                tracing: Tracing.ACTIVE
            }
        );

        // Grant SES permissions to Lambda
        lambdaFunction.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["ses:SendEmail", "ses:SendRawEmail"],
                resources: ["*"] // You might want to restrict this to specific ARNs in production
            })
        );

        // Add SQS event source to Lambda
        lambdaFunction.addEventSource(
            new lambdaEventSources.SqsEventSource(emailQueue, {
                batchSize: 1,
                maxBatchingWindow: cdk.Duration.seconds(120)
            })
        );

        // Grant Lambda permission to consume messages from SQS
        emailQueue.grantConsumeMessages(lambdaFunction);

        // TODO: pending backend ready
        // emailQueue.addToResourcePolicy(
        //     new iam.PolicyStatement({
        //         effect: iam.Effect.ALLOW,
        //         principals: [
        //             // Allow access from specific IAM role
        //             new iam.ArnPrincipal(
        //                 `arn:aws:iam::669131042313:role/TaiGerPortalService-${props?.stageName}-ExecutionRole`
        //             )
        //         ],
        //         actions: ["sqs:SendMessage"],
        //         resources: [emailQueue.queueArn]
        //     })
        // );

        if (!props.isProd) {
            // Add queue policy to allow sending messages
            emailQueue.addToResourcePolicy(
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    principals: [
                        // Allow access from specific user (for testing)
                        new iam.ArnPrincipal("arn:aws:iam::669131042313:user/taiger_leo")
                    ],
                    actions: ["sqs:SendMessage"],
                    resources: [emailQueue.queueArn]
                })
            );
        }

        // Cost center tag
        cdk.Tags.of(lambdaFunction).add("Project", "TaiGerPortalEmailService");
        cdk.Tags.of(lambdaFunction).add("Environment", "Production");
    }
}
