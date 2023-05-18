# Week 8 — Serverless Image Processing
1. Deleted the old CDK thumbing-serverless-cdk
2. We will install CDK globally so we can use the AWS CDK CLI anywhere.

![Installcdk](./assets/Week8_1_installcdk.PNG)
3. Created Environment variables and note THUMBING_BUCKET_NAME should always begin with assets. and concatenated by your domain name.
4. Created .env.example since .env is added to gitignore and we have to create it everytime. Made changes to gitpod.yml to include ```

```yaml
- name: cdk
    before: |
      npm install aws-cdk -g
      cd thumbing-serverless-cdk   
      cp .env.example .env
      npm i
```

This installs cdk when gitpod opens and changes the working directory and copy from .env.example to .env

1. We'll initialize a new cdk project within the folder we created:
![Typescript](./assets/Week8_2_Typescript.PNG)
2. Made changes to thumbing-serverless-cdk-stack.ts to include environment variables.
3. Create S3 bucket:
4. Add the following code to your thumbing-serverless-cdk-stack.ts

```ts
import * as s3 from 'aws-cdk-lib/aws-s3';

const uploadsBucketName: string = process.env.UPLOADS_BUCKET_NAME as string;

createBucket(bucketName: string): s3.IBucket {
    const logicalName: string = 'UploadsBucket';
    const bucket = new s3.Bucket(this, logicalName , {
      bucketName: bucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    return bucket;
  }
```
## Bootstrapping my Account :
Process of provisioning resources of AWS CDK, before you can deploy CDK apps. Resources like S3 bucket for storing files, IAM roles grants Permissions needed for the deployments.

cdk bootstrap "aws://ACCOUNT_ID/REGION_NAME"

5. Created aws/lambdas/process-images folder and copied example.json, index.js,test.js,s3-image-processing.js
6. cd to aws/lambdas/process-images and Type in npm init -y creates an empty init file called package.json in the folder
7. We will install sharpjs ```npm i sharp```
8. npm i @aws-sdk/client-s3
9. Add node_modules to gitignore
10. cdk deploy 
11. Images are Week8_8_CDKDeploy1  to Week8_8_CDKDeploy4. ![Week8_8_CDKDeploy1](./assets/Week8_8_CDKDeploy1.PNG)
![Week8_8_CDKDeploy2](./assets/Week8_8_CDKDeploy2.PNG)
![Week8_8_CDKDeploy3](./assets/Week8_8_CDKDeploy3.PNG)
![Week8_8_CDKDeploy4](./assets/Week8_8_CDKDeploy4.PNG)
10. To get to Week8_8_CDKDeploy4 go to Lambdas and click on newly created one.
11. We need to run these commands to make sure sharp library works with AWS Lambda correctly ```

```
npm install
rm -rf node_modules/sharp
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install --arch=x64 --platform=linux --libc=glibc sharp
```

We put this in /bin/serverless/build and added few more lines of code to make it bash executable. cd to our root directory and then chmod u+x /bin/serverless/build and run the build script

1. Create s3 event notification to lambda: 

Add `this.createS3NotifyToSns(folderOutput,snsTopic,bucket)` to `thumbing-serverless-cdk-stack.ts` and ```

```bash
createS3NotifyToLambda(prefix: string, lambda: lambda.IFunction, bucket: s3.IBucket): void {
    const destination = new s3n.LambdaDestination(lambda);
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      destination,
      {prefix: prefix} // folder to contain the original images
```

1. cdk synth and cdk deploy ![Week8_10_DeployGif](./assets/Week8_10_DeployGif.gif)
![Week8_10_S3Created](./assets/Week8_10_S3Created.PNG)
3. Create bash scripts to [clear](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/7f5e53f7c8667eea047acdbe9d3a0684b440b12c/bin/avatar/clear) and [upload](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/7f5e53f7c8667eea047acdbe9d3a0684b440b12c/bin/avatar/upload)
4. export DOMAIN_NAME=[roopish-awssolutions.com](http://roopish-awssolutions.com/)
gp env DOMAIN_NAME=[roopish-awssolutions.com](http://roopish-awssolutions.com/)
4. Change to s3.EventType.OBJECT_CREATED_POST from s3.EventType.OBJECT_CREATED_PUT in thumbing-serverless-cdk-stack.ts as you won’t see any cloud watch logs from PUT. 
5. cd thumbing-serverless-cdk-stack and then cdk destroy and then cdk deploy 
6. Create a policy for s3 bucket access so we can modify it. ````const s3ReadWritePolicy = this.createPolicyBucketAccess(bucket.bucketArn)```` and function code I copied from Andrew’s repo.
7. We need to attach lambda policy to the role. lambda.addToRolePolicy(s3UploadsReadWritePolicy); and then cdk deploy. This should change permission of s3 bucket 
![Week8_12_S3UpdateRWPolicy](./assets/Week8_12_S3UpdateRWPolicy.PNG) Clear and upload the jpg 
9. check logs in s3 bucket - CloudWatch. There should be no errors
10. go to Amazon s3→buckets→[assets.roopish-awssolutions.com](https://s3.console.aws.amazon.com/s3/buckets/assets.roopish-awssolutions.com)→avatars. We should see both original and processed
11. Make changes to index.js and thumbing and add code for . cdk deploy and clear and upload avatar. Go to Amazon SNS→Topics→cruddur-assets. 2 screenshots. Click on pending confirmation and then confirm subscription. ![Week8_11_AvatarOriginal_put2](./assets/Week8_11_AvatarOriginal_put2.PNG)![Week8_12_S3UpdateRWPolicy](./assets/Week8_12_S3UpdateRWPolicy.PNG)
![AvatarOriginal](./assets/Week8_11_AvatarOriginal.PNG)

## Create SNS Topic
```
createSnsTopic(topicName: string): sns.ITopic{
    const logicalName = "ThumbingTopic";
    const snsTopic = new sns.Topic(this, logicalName, {
      topicName: topicName
    });
    return snsTopic;
  }
  ```

## Create an SNS Subscription
```
createSnsSubscription(snsTopic: sns.ITopic, webhookUrl: string): sns.Subscription {
    const snsSubscription = snsTopic.addSubscription(
      new subscriptions.UrlSubscription(webhookUrl)
    )
    return snsSubscription;
  }
  ```
  ## Create S3 Event Notification to SNS
  ```
  createS3NotifyToSns(prefix: string, snsTopic: sns.ITopic, bucket: s3.IBucket): void {
    const destination = new s3n.SnsDestination(snsTopic)
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT, 
      destination,
      {prefix: prefix}
    );
  }
  ```
  ![Week8_14_assets2](./assets/Week8_14_assets2.PNG)
  
  ## Setting up the cloudfront for Serving Avatars
  Amazon CloudFront is designed to work with S3 to serve your S3 content. Using CloudFront to serve s3 content gives you a lot more flexibility and control. To create a CloudFront distribution, a certificate in the us-east-1 zone for *.<your_domain_name> is required.
Create domain via AWS Certificate Manager, and click "Create records in Route 53" after the certificate is issued.

Create a distribution by:

- set the Origin domain to point to assets.<your_domain_name>
- choose Origin access control settings (recommended) and create a control setting
- select Redirect HTTP to HTTPS for the viewer protocol policy
- choose CachingOptimized, CORS-CustomOrigin as the optional Origin request policy, and SimpleCORS as the response headers policy
- set Alternate domain name (CNAME) as assets.<your_domain_name>
- choose the previously created ACM for the Custom SSL certificate.
![Week8_16_RequestCert6](./assets/Week8_16_RequestCert6.PNG)

create a cloudfront distribution 
![Week8_16_RequestCert1](./assets/Week8_16_RequestCert1.PNG)
![Week8_16_RequestCert7](./assets/Week8_16_RequestCert7.PNG)
![Week8_17_CFDistribution](./assets/Week8_17_CFDistribution.PNG)

Create a new record for the cloudfront in the Route 53 hostedzone.
![Week8_19_CreateHostedZone1](./assets/Week8_19_CreateHostedZone1.PNG)
![Week8_19_CreateHostedZone2](./assets/Week8_19_CreateHostedZone2.PNG)
![Week8_19_CreateHostedZone3](./assets/Week8_19_CreateHostedZone3.PNG)
![Week8_19_CreateHostedZone4](./assets/Week8_19_CreateHostedZone4.PNG)

-Test if cloudfront is working in the browser
![Week8_18_DomainDistribution](./assets/Week8_18_DomainDistribution.PNG)
-Add a bucket policy to the s3 bucket (assets.roopish-awssolutions.com)
![Week8_19_EditBucketPolicy](./assets/Week8_19_EditBucketPolicy.PNG)
![Week8_19_UpdBucketPolicy](./assets/Week8_19_UpdBucketPolicy.PNG)
![Week8_19_UpdBucketPolicy2](./assets/Week8_19_UpdBucketPolicy2.PNG)

-test in the browser
![Week8_19_ProcessedImage](./assets/Week8_19_ProcessedImage.PNG)

First run the script (./bin/avatar/build)(https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/bin/avatar/build) to install the sharp. Then perform cdk deploy then upload the image to the uploaded bucket then it has be copied into assets bucket. Otherwise you will get an error 
