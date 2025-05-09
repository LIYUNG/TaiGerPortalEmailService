import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { LambdaStack } from "../lib/stacks/lambda-stack";

test("Lambda Stack Created", () => {
    const app = new cdk.App();
    const stageName = "test";
    // WHEN
    const lambdaStack = new LambdaStack(app, "LambdaStack", {
        stageName: stageName,
        isProd: false
    });
    // THEN
    const template = Template.fromStack(lambdaStack);

    // Check if Lambda Function exists
    template.hasResourceProperties("AWS::Lambda::Function", {
        Runtime: "nodejs20.x", // Adjust if needed
        Handler: "index.handler" // Ensure this matches your Lambda handler
    });
});
