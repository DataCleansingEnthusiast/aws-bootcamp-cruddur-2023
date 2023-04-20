import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';


dotenv.config();

export class ThumbingServerlessCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketName: string = process.env.THUMBING_BUCKET_NAME as string;
    const folderInput: string = process.env.THUMBING_S3_FOLDER_INPUT as string;
    const folderOutput: string = process.env.THUMBING_S3_FOLDER_OUTPUT as string;
    const functionPath: string = process.env.THUMBING_FUNCTION_PATH as string;
    console.log('bucketName',bucketName)
    console.log('folderInput',folderInput)
    console.log('folderOutput',folderOutput)
    console.log('functionPath',functionPath)
    
    const bucket = this.createBucket(bucketName)
    const lambda = this.createLambda(folderInput,folderOutput,functionPath,bucketName)

  } //constructor
  createBucket(bucketName: string): s3.IBucket {
    const logicalName: string = 'ThumbingBucket';
    const bucket = new s3.Bucket(this, logicalName , {
      bucketName: bucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    return bucket;
  }
  createLambda(folderInput: string, folderOutput: string, functionPath: string, bucketName: string): 
  lambda.IFunction {
    //core of lambda function
        const lambdaFunction = new lambda.Function(this, 'ThumbLambda', {
          runtime: lambda.Runtime.NODEJS_18_X,
          handler: 'index.handler',
          code: lambda.Code.fromAsset(functionPath) //end
          ,
          environment: {
            DEST_BUCKET_NAME: bucketName,
            FOLDER_INPUT: folderInput,
            FOLDER_OUTPUT: folderOutput,
            PROCESS_WIDTH: '512',
            PROCESS_HEIGHT: '512'
          }
        });
        return lambdaFunction;
      } 
    
  importBucket(bucketName: string): s3.IBucket {
    const bucket = s3.Bucket.fromBucketName(this,"AssetsBucket",bucketName);
    return bucket;
  }
} //end
