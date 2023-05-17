# Week 8 — Serverless Image Processing
1. Deleted the old CDK thumbing-serverless-cdk
2. Created Environment variables and note THUMBING_BUCKET_NAME should always begin with assets. and the concatenated by your domain name.
3. Created .env.example since .env is added to gitignore and we have to create it everytime. Made changes to gitpod.yml to include ```

```yaml
- name: cdk
    before: |
      npm install aws-cdk -g
      cd thumbing-serverless-cdk   
      cp .env.example .env
      npm i
```

This installs cdk when gitpod opens and changes the working directory and copy from .env.example to .env

1. Made changes to thumbing-serverless-cdk-stack.ts to include environment variables.
2. Created aws/lambdas/process-images folder and copied example.json, index.js,test.js,s3-image-processing.js
3. cd to aws/lambdas/process-images and Type in npm init -y creates an empty init file called package.json in the folder
4. We will install sharpjs ```npm i sharp```
5. npm i @aws-sdk/client-s3
6. Add node_modules to gitignore
7. cdk deploy 
8. Images are Week8_8_CDKDeploy1  to Week8_8_CDKDeploy4. ![Week8_8_CDKDeploy1](./assets/Week8_8_CDKDeploy1.PNG)
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
3. Create 2 files clear and upload under serverless
4. export DOMAIN_NAME=[roopish-awssolutions.com](http://roopish-awssolutions.com/)
gp env DOMAIN_NAME=[roopish-awssolutions.com](http://roopish-awssolutions.com/)
4. Change to s3.EventType.OBJECT_CREATED_POST from s3.EventType.OBJECT_CREATED_PUT in thumbing-serverless-cdk-stack.ts as you won’t see any cloud watch logs from PUT. 
5. cd thumbing-serverless-cdk-stack and then cdk destroy and then cdk deploy ..see screenshot
6. Create a policy for s3 bucket access so we can modify it. ````const s3ReadWritePolicy = this.createPolicyBucketAccess(bucket.bucketArn)```` and function code I copied from Andrew’s repo.
7. We need to attach lambda policy to the role. lambda.addToRolePolicy(s3UploadsReadWritePolicy); and then cdk deploy. This should change permission of s3 bucket 
![Week8_12_S3UpdateRWPolicy](./assets/Week8_12_S3UpdateRWPolicy.PNG) Clear and upload the jpg 
9. check logs in s3 bucket - CloudWatch. There should be no errors
10. go to Amazon s3→buckets→[assets.roopish-awssolutions.com](https://s3.console.aws.amazon.com/s3/buckets/assets.roopish-awssolutions.com)→avatars. We should see both original and processed
11. Make changes to index.js and thumbing and add code for . cdk deploy and clear and upload avatar. Go to Amazon SNS→Topics→cruddur-assets. 2 screenshots. Click on pending confirmation and then confirm subscription. ![Week8_11_AvatarOriginal_put2](./assets/Week8_11_AvatarOriginal_put2.PNG)![Week8_12_S3UpdateRWPolicy](./assets/Week8_12_S3UpdateRWPolicy.PNG)
