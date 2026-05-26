import * as cdk from "aws-cdk-lib";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import {
    CodePipeline,
    CodePipelineSource,
    ManualApprovalStep,
    CodeBuildStep
} from "aws-cdk-lib/pipelines";
import { PipelineType } from "aws-cdk-lib/aws-codepipeline";
import { Construct } from "constructs";

import {
    APPLICATION_NAME,
    GITHUB_OWNER,
    GITHUB_PACKAGE_BRANCH,
    GITHUB_REPO,
    GITHUB_CONNECTION_ARN
} from "../configuration/dependencies";
import { PipelineAppStage } from "./app-stage";
import { STAGES } from "../constants";
import { RemovalPolicy } from "aws-cdk-lib";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";

export class PipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Define the source for the pipeline
        const source = CodePipelineSource.connection(
            `${GITHUB_OWNER}/${GITHUB_REPO}`,
            GITHUB_PACKAGE_BRANCH,
            {
                connectionArn: GITHUB_CONNECTION_ARN,
                triggerOnPush: true // Enables automatic builds on push
            }
        );

        const synthStep = new CodeBuildStep("Synth", {
            input: source,
            logging: {
                cloudWatch: {
                    logGroup: new LogGroup(this, `${APPLICATION_NAME}Synth-LogGroup`, {
                        logGroupName: `/aws/codepipeline/synth/${APPLICATION_NAME}`,
                        retention: RetentionDays.THREE_MONTHS,
                        removalPolicy: RemovalPolicy.DESTROY
                    })
                }
            },
            commands: ["npm ci", "npm run build", "npx cdk synth"]
        });
        // Create the high-level CodePipeline
        const pipeline = new CodePipeline(this, `${APPLICATION_NAME}Pipeline`, {
            pipelineName: `${APPLICATION_NAME}Pipeline`,
            pipelineType: PipelineType.V2,
            synth: synthStep,
            codeBuildDefaults: {
                rolePolicy: [
                    new PolicyStatement({
                        actions: [
                            "route53:ListHostedZonesByName",
                            "route53:GetHostedZone",
                            "route53:ListHostedZones"
                        ],
                        resources: ["*"]
                    })
                ]
            }
        });

        STAGES.forEach(({ stageName, env, isProd, sesAttr, domainAttr }) => {
            const stage = new PipelineAppStage(this, `${stageName}-${APPLICATION_NAME}`, {
                env,
                stageName,
                isProd,
                sesAttr,
                domainAttr
            });
            if (isProd) {
                pipeline.addStage(stage, {
                    pre: [
                        new ManualApprovalStep("ApproveIfStable", {
                            comment:
                                "Approve to continue production deployment. Make sure every changes are verified in dev."
                        })
                    ]
                });
            } else {
                pipeline.addStage(stage);
            }
        });
    }
}
