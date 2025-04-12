import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as sqs from "aws-cdk-lib/aws-sqs";

import { APPLICATION_NAME, DEVELOPER_EMAIL } from "../configuration";

interface EmailMonitorStackProps extends cdk.StackProps {
    stageName: string;
    isProd: boolean;
    deadLetterQueue: sqs.Queue;
}

export class EmailMonitorStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: EmailMonitorStackProps) {
        super(scope, id, props);

        // Create SNS Topic for DLQ alerts
        const dlqAlertTopic = new sns.Topic(
            this,
            `${APPLICATION_NAME}-DLQ-Alerts-${props.stageName}`,
            {
                displayName: `${APPLICATION_NAME} DLQ Alerts ${props.stageName}`,
                topicName: `${APPLICATION_NAME}-DLQ-Alerts-${props.stageName}`
            }
        );

        // Add email subscription to the SNS topic
        dlqAlertTopic.addSubscription(new subscriptions.EmailSubscription(DEVELOPER_EMAIL));

        // Create CloudWatch Alarm for DLQ message count
        const messageCountAlarm = new cloudwatch.Alarm(
            this,
            `${APPLICATION_NAME}-DLQ-MessageCount-Alarm-${props.stageName}`,
            {
                alarmName: `${APPLICATION_NAME}-DLQ-MessageCount-${props.stageName}`,
                metric: props.deadLetterQueue.metricApproximateNumberOfMessagesVisible(),
                threshold: 5, // Alert if there's even 1 message in DLQ
                evaluationPeriods: 1,
                datapointsToAlarm: 1,
                alarmDescription: `Alert when messages are present in ${APPLICATION_NAME} DLQ for ${props.stageName}`,
                actionsEnabled: true,
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
            }
        );

        // Add SNS action to the message count alarm
        messageCountAlarm.addAlarmAction(new cloudwatchActions.SnsAction(dlqAlertTopic));

        // Create CloudWatch Alarm for DLQ message age
        const messageAgeAlarm = new cloudwatch.Alarm(
            this,
            `${APPLICATION_NAME}-DLQ-MessageAge-Alarm-${props.stageName}`,
            {
                alarmName: `${APPLICATION_NAME}-DLQ-MessageAge-${props.stageName}`,
                metric: props.deadLetterQueue.metricApproximateAgeOfOldestMessage(),
                threshold: 3600, // Alert if messages are older than 1 hour
                evaluationPeriods: 1,
                datapointsToAlarm: 1,
                alarmDescription: `Alert when messages in ${APPLICATION_NAME} DLQ are older than 1 hour for ${props.stageName}`,
                actionsEnabled: true,
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
            }
        );

        // Add SNS action to the message age alarm
        messageAgeAlarm.addAlarmAction(new cloudwatchActions.SnsAction(dlqAlertTopic));

        // // Create CloudWatch Dashboard for DLQ monitoring
        // const dashboard = new cloudwatch.Dashboard(
        //     this,
        //     `${APPLICATION_NAME}-DLQ-Dashboard-${props.stageName}`,
        //     {
        //         dashboardName: `${APPLICATION_NAME}-DLQ-Monitoring-${props.stageName}`
        //     }
        // );

        // // Add widgets to the dashboard
        // dashboard.addWidgets(
        //     new cloudwatch.GraphWidget({
        //         title: "DLQ Message Count",
        //         left: [props.deadLetterQueue.metricApproximateNumberOfMessagesVisible()],
        //         width: 12
        //     }),
        //     new cloudwatch.GraphWidget({
        //         title: "DLQ Message Age",
        //         left: [props.deadLetterQueue.metricApproximateAgeOfOldestMessage()],
        //         width: 12
        //     })
        // );
    }
}
