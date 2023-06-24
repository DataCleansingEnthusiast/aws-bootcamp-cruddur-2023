# Week 10 & 11 — CloudFormation - Infrastructure as Code(IaC) tool
Week 10 and 11 is focused on learning about CloudFormation (CFN). CFN allows developers to operate infrastructure with code. Using CloudFormation, users can create AWS resources that aid the execution of AWS-based applications. CFN creates the infrastructure in the right order with the exact configuration you specified in your template. We have used YAML script to write the AWS CloudFormation templates.

## Creation of **a ECS Cluster using** CFN template

In the aws folder we created a cfn folder and created a template.yaml file. After we run this and it sets up a ECS empty Cluster.

```yaml
AWSTemplateFormatVersion: 2010-09-09
Description: |
  Setup ECS Cluster
Resources:
  ECSCluster: #LogicalName
    Type: 'AWS::ECS::Cluster'
    Properties:
      ClusterName: MyCluster1
      CapacityProviders:
        - FARGATE
#Parameters:
#Mappings:
#Outputs:
#Metadata:
```

![image](./assets/a1_EmptyCluster.PNG)

```
#! /usr/bin/env bash
set -e # stop the execution of the script if it fails

CFN_PATH="/workspace/aws-bootcamp-cruddur-2023/aws/cfn/template.yaml"

aws cloudformation deploy \
  --stack-name "my-cluster" \
  --template-file "$CFN_PATH" \
  --no-execute-changeset \
  --capabilities CAPABILITY_NAMED_IAM
```

I ran chmod u+x ./bin/cfn/deploy and then ran ./bin/cfn/deploy as seen in 

![image](./assets/a2.PNG)

This gives a changeset which needs to be run.

![image](./assets/a3.GIF)

 ![image](./assets/a3_Package.PNG)

In the cluster pick the ‘Change sets’ tab. 

Select the aws cli cloudformation package deploy that was just created and then Click on ‘change set’. This should bring up pop up window where you pick ‘Roll back all stack resources in the AWS console and then click on button ‘Execute change set’. 

![image](./assets/a3_ExecChangeSet.PNG)

 ![image](./assets/a3_ClusterCreationComplete.PNG)

![image](./assets/a4_validatetemplatenoerrors.PNG)

We learnt about AWS Cloudformation lint. AWS CloudFormation Linter (cfn-lint) is **an open-source tool that you can use to perform detailed validation on your AWS CloudFormation templates**. Cfn-lint contains rules that are guided by the AWS CloudFormation resource specification.  

We installed cfn-lint by running the command `pip install cfn-lint`

 ![image](./assets/a5_install_lint.PNG)

Now we move onto learning about policy-as-code for cfn-guard for ecs cluster.

We first install `cargo install cfn-guard`

 ![image](./assets/a5_installcfn-guard.PNG)

We can add installing of cfn-guard and cfn-lint to gitpod.yaml

We create aws/cfn/task-definition.guard

To generate your rules or guard file you need to run this command with specifying the template path.

cfn-guard rulegen --template /workspace/aws-bootcamp-cruddur-2023/aws/cfn/template.yaml

 ![image](./assets/a5_cfnguard.PNG)

Then we created s3 bucket `rm-cfn-artifacts` and deployed that template into s3 bucket.

 ![image](./assets/a6_CreateS3bucket.PNG)

## **Networking Layer**

Rename bin/cfn/deploy to bin/cfn/networking-deploy

We created aws/cfn/Readme.md to document everything as we go along. 

 ![image](./assets/a7_EnvBucketName.PNG)

 ![image](./assets/a7_VPCAvailable.PNG)

We created a networking layer where we require VPC, IGW, Routing tables, Subnet’s (3) for flexibility to have in 3 different Availablity Zones. In VPC section, we have CIDR property- where we have given a CIDR IP address as `10.0.0.0/16`. So in here, `/16` is the size of the IP addresses available in that particular CIDR block. You can search it on [CIDR.xyz](https://cidr.xyz/) site to know **how many IPs are available in one particular IP size?** There are redundant links which will help us if one link fails then other will work in that case and it will prevent our apps downtime.

Once we deploy after creating VPC, it will automatically creates a Route Table with no resources and subnets in you VPC Service.

Created aws/cfn/ecs-cluster.guard 
### Create VPC

Create a VPC using CloudFormation.

We created a new folder under aws/cfn/networking. This is where we plan to deploy of networking sources into.

We create template.yaml in this networking folder.

```
Resources:
  VPC:
    # https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-vpc.html
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidrBlock
      EnableDnsHostnames: true
      EnableDnsSupport: true
      InstanceTenancy: default
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}VPC"
```

### Create and Attach IGW (Internet gateway)

```yaml
Resources:
IGW:
    # https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-internetgateway.html
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}IGW"
  AttachIGW:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref IGW
```

### Create Route Table

```yaml
RouteTable:
    # https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-routetable.html
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId:  !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}RT"
```

### Create another Route Table that is related to IGW

```yaml
RouteToIGW:
    # https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-route.html
    Type: AWS::EC2::Route
    DependsOn: AttachIGW
    Properties:
      RouteTableId: !Ref RouteTable
      GatewayId: !Ref IGW
      DestinationCidrBlock: 0.0.0.0/0
```

### **Create Subnets**

We create Public & Private Subnets and have given reference to those subnets and associated with Route tables.

### Public Subnet

```yaml
SubnetPub1:
   # https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-subnet.html
   Type: AWS::EC2::Subnet
   Properties:
     AvailabilityZone: !Ref Az1
     CidrBlock: !Select [0, !Ref SubnetCidrBlocks]
     EnableDns64: false
     MapPublicIpOnLaunch: true #public subnet
     VpcId: !Ref VPC
     Tags:
       - Key: Name
         Value: !Sub "${AWS::StackName}PubSubnet1"

```

### Private Subnet

```yaml
SubnetPriv1:
   # https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-subnet.html
   Type: AWS::EC2::Subnet
   Properties:
     AvailabilityZone: !Ref Az1
     CidrBlock: !Select [3, !Ref SubnetCidrBlocks]
     EnableDns64: false
     MapPublicIpOnLaunch: false #private subnet
     VpcId: !Ref VPC
     Tags:
       - Key: Name
         Value: !Sub "${AWS::StackName}PrivSubnet1"
```

**Associate Subnet 1 with Route table**

```yaml
SubnetPub1RTAssociation:
   Type: AWS::EC2::SubnetRouteTableAssociation
   Properties:
     SubnetId: !Ref SubnetPub1
     RouteTableId: !Ref RouteTable
```

**NOTE:** We created 3 subnets by following the similar code pattern with different IPs.

Refer the documentation [AWS Documentation of CFN Parameters](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html) for syntax information. CFN will now allow you to hardcode the values in it's `template.yaml` file. We have to make sure to set parameters. 

![image](./assets/a8_afterchanges.PNG)

 ![image](./assets/a8_PackageDeploy.PNG)

Execute the change set.

After creating the subnets, VPCs, Route Tables we deployed Networking Layer and it uploaded in our CloudFormation Stack. **Resources after deploying Networking Layer** 

![image](./assets/a8_ResourcesNwing.PNG)

Here’s the [template.yaml](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/aws/cfn/networking/template.yaml)

![image](./assets/a15_PublicSubnetIDS.PNG)

We started creating the Architecture diagram for CFN.
## **Cluster Layer**

This layer will help support the fargate containers. We added ALB that supports IPv4. This layer also has ALB security groups, HTTP listener, Backend and Frontend target groups. To get CertificateArn,go to **[AWS Certificate Manager (ACM)](https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/welcome) a**nd then get the ARN. Refer to [template.yaml](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/aws/cfn/cluster/template.yaml)

We create [cluster file](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/bin/cfn/cluster) to deploy CFN cluster stack. 

**Note**: I did not delete the ALB /TG which were created earlier along with the ECS cluster's task frontend-react-js and backend which were created in week 6.

### Install toml

 Install toml `gem install cfn-toml`

 ![image](./assets/a9_tomlinstall.PNG)

Run /bin/cfn/cluster-deploy 

 ![image](./assets/a11_CrdClusterOutputs.PNG)

 ![image](./assets/a11_CrdClusterResources_A.PNG)

 ![image](./assets/a11_CrdClusterResources_B.PNG)

 ![image](./assets/a11_CrdClusterParameters_A.PNG)

 ![image](./assets/a11_CrdClusterParameters_B.PNG)

 ![image](./assets/a11_CrdClusterFargate.PNG)

We make updates to Architecture diagram.

## Service Layer

We start to build service layer for backend. Created aws/cfn/service/template.yaml, config.toml and config.toml.example and bin/service/service.deploy

config.toml file which has key configuration details such as the name of the stack -CrdSrvBackendFlask , region of deployment, S3 Bucketname, Envr Variables for Frontend and Backend URls, DDB MessageTble are referenced by the CFN template. 

.bin/cfn/service script is run which deploys the service stack.

CFN ECS Fargate Service Debugging - In Ec2 target groups→ CrdClu-Backe -xx change the timeout from 5 to 15 healthy threshold to 3, interval=20 

 ![image](./assets/a14_ToUpdate_TargetGroup.PNG) and  ![image](./assets/a14_Updated_TargetGroup.PNG)

![image](./assets/a12_ServiceBackend_Events.PNG)

![image](./assets/a12_ServiceBackend_Resources.PNG)

![image](./assets/a12_ServiceBackend_Fargate.PNG)

![image](./assets/a12_ServiceBackend_FargateConfig.PNG)

![image](./assets/a12_ServiceBackend_TargetGroup.PNG)

Go to Ec2 Security Groups and pick ****crud-srv-sg and change inbound rule****  ![image](./assets/a16_OldSource_Inbound.PNG)  ![image](./assets/a16_UpdatedInbound.PNG)

![image](./assets/a17_SecGrpID.PNG)

Go to bin/backend/deploy  Change the CLUSTER_NAME="CrdClusterFargateCluster” (old name”cruddur”)

update bin/backend/deploy and bin/backend/create-service and execute them

## Database (RDS) Layer

We begin the RDS layer by creating a new folder in the `./aws/cfn` directory named `db`. We create a new `template.yaml` in this folder as well.

Note: Some of the parameters a) `InstanceClass`` is set to db.t4g.micro - (It is best used in development/testing environments where consistent high CPU performance is not required.)

For the MasterUserPassword property, we have set the value to `NoEcho: true``CloudFormation returns the parameter value masked as asterisks for any calls that describe the stack or stack events. This is used whether to mask the parameter value to prevent it from being displayed in the console, command line tools, or API.

We created /aws/cfn/db/config.toml to set parameter values for RDS template

```jsx
[deploy]
bucket = 'rm-cfn-artifacts'
region = 'us-east-1'
stack_name = 'CrdDb'

[parameters]
NetworkingStack = 'CrdNet'
ClusterStack = 'CrdCluster'
MasterUsername = 'crudderroot'

```

We also created /bin/cfn/db-deploy

```jsx
#! /usr/bin/env bash
set -e # stop the execution of the script if it fails

CFN_PATH="/workspace/aws-bootcamp-cruddur-2023/aws/cfn/db/template.yaml"
CONFIG_PATH="/workspace/aws-bootcamp-cruddur-2023/aws/cfn/db/config.toml"
echo $CFN_PATH

cfn-lint $CFN_PATH

BUCKET=$(cfn-toml key deploy.bucket -t $CONFIG_PATH)
REGION=$(cfn-toml key deploy.region -t $CONFIG_PATH)
STACK_NAME=$(cfn-toml key deploy.stack_name -t $CONFIG_PATH)
PARAMETERS=$(cfn-toml params v2 -t $CONFIG_PATH)

aws cloudformation deploy \
  --stack-name $STACK_NAME \
  --s3-bucket $BUCKET \
  --s3-prefix db \
  --region $REGION \
  --template-file "$CFN_PATH" \
  --no-execute-changeset \
  --tags group=cruddur-db \
  --parameter-overrides $PARAMETERS MasterUserPassword=$DB_PASSWORD \
  --capabilities CAPABILITY_NAMED_IAM
```

We override the parameter for `MasterUserPassword` with the value of the env var `$DB_PASSWORD` by way of the `--parameter-overrides` command. We use export and gp env commands to set the value of environment variable. We execute the change set from CFN.

![image](./assets/a19_Db_Connectivity.PNG)

![image](./assets/a19_Db_created.PNG)

Our database ‘cruddur-cfninstance’ has been created.

![image](./assets/a19_Db_Resource.PNG)

We select `cruddur-cfninstance`` resource CFN which redirects to RDS.

![image](./assets/a19_Db_list.PNG)

We see that both our original database `cruddur-db-instance` and newly created database  `cruddur-cfninstance`

This new database has no data yet. CONNECTION_URL is set using AWS System Manager.

![image](./assets/a19_SystemManager.PNG)

### Health Check - Service Layer - Part 2

Health check for Load balancer was failing and in the office hours Andrew looked at my code and I had the port number 80 instead of 4567. 

![image](./assets/a19_OfficeHours_80to4567.PNG)

![image](./assets/a19_Healthy.PNG)

We test our endpoint by navigating to api.roopish-awssolutions.com/api/health-check but the page does not resolve. This is because our new load balancer is not being pointed to in Route53 in AWS. We navigate over to Route53 in AWS and update the A records for api.roopish-awssolutions.com and select our new ALB.

![image](./assets/a19_UpdateHostedZoneDualStack.PNG)

Testing our backend service from a web browser by manually going to the endpoint.

![image](./assets/a20_HealthCheckPassed.PNG)

## **DynamoDB Layer (SAM)**

The AWS Serverless Application Model (AWS SAM) is an open-source framework designed to streamline the building and deployment of serverless applications on AWS. By simplifying the process of creating and managing resources, it significantly reduces the complexity usually associated with traditional architectures. They are an extension of CFN templates. SAM templates can be written in YAML or JSON.

We created /aws/cfn/ddb/template.yaml, and /aws/cfn/ddb/samconfig.toml (note the change in name). We also created /bin/cfn/ddb-deploy.

We implement SAM into our DDB layer. We need to install it into our workspace, so we open our `.gitpod.yml` file and add it:

```jsx
tasks:
  - name: aws-sam
    init: |
      cd /workspace
      wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
      unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
      sudo ./sam-installation/install
      cd $THEIA_WORKSPACE_ROOT

```

Instead of restarting the workspace, we run the commands line by line

![image](./assets/a21_getsam.PNG)

These are the errors I encountered when building the ddb layer.

While referencing our existing `cruddur-messaging-stream` Lambda, we noticed the Runtime was set to Python3.9 instead of 3.8. Since this is changing, we decided to add a parameter for that property instead and reference it.

![image](./assets/a22_build_err2.PNG)

```
Parameters:
  PythonRuntime:
    Type: String
    Default: python3.9
```

After this I ran ddb-deploy again and got another error

 ![image](./assets/a22_build1.PNG)

This error indicates we may want to run this in a container. That way we can install dependencies required for our Lambda function. For this, we add the `--use-container` option to our `ddb-deploy` script for the `sam build` command.

We run `ddb-deploy` again.

We update `template.yaml` to remove `Architectures` property so it defaults to `x86` instead of `arm64`

ddb/build , ddb/package and ddb/deploy scripts are written and executed. 

![image](./assets/a23_buildsuccededFinally.PNG)

![image](./assets/a23_CFN_Crdddb.PNG)

![image](./assets/a23_DeploysuccededFinally.PNG)

![image](./assets/a23_Deployed.PNG)

![image](./assets/a23_PackagesuccededFinally.PNG)

![image](./assets/a23_DynamoDbTable.PNG)

DDB layer in a good state for now

## CICD Layer

We create /bin/cfn/cicd-deploy and /aws/cfn/cicd/template.yaml and /aws/cfn/cicd/config.toml

Its decided that we'd like to use a nested stack to implement the CICD layer.

Here’s some documentation that I found very useful

https://catalog.workshops.aws/cfn101/en-US/intermediate/templates/nested-stacks

https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-nested-stacks.html

codebuild.yaml is created in aws/cfn/nested directory.

To test, we make our `cicd-deploy` script exectuable, then run it.

Also created S3 bucket manually to store the artifacts. 

![image](./assets/a24_s3bucket.PNG)

Created an empty folder in my root directory `tmp` which will be used when we compile a package template and all that generated files (from output-template-file i.e. The path to the file where the command writes the output AWS CloudFormation template. In our project it is packaged-template.yaml) will be stored in this `tmp` folder. In the `.gitignore`added tmp/*. 

![image](./assets/a25_CICDDeploy.PNG)

![image](./assets/a25_CICDCFN1.PNG)

![image](./assets/a25_CICDCFN_Parameters.PNG)

![image](./assets/a25_CICDCFN_Events.PNG)

![image](./assets/a25_CICDCodepipelinefail.PNG)

![image](./assets/a25_CICDCodepipeline_Upd.PNG)

![image](./assets/a25_CICDCodepipelineOK.GIF)

![image](./assets/a25_CICDNestedDone.PNG)

## Frontend Stack (Static Web Hosting)

We create [/aws/cfn/frontend/template.yaml](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/3598db3c15aa88be4f7fc7eacf49a573b586aa6b/aws/cfn/frontend/template.yaml) and [/aws/cfn/frontend/config.toml](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/3598db3c15aa88be4f7fc7eacf49a573b586aa6b/aws/cfn/frontend/config.toml)

Referring to template.yaml there are 2 buckets `WWWBucket` and `RootBucket`. The `WWWBucket` is configured to redirect all requests to the `RootBucket`. The `RootBucket` has public access enabled and is configured as a website with an index document and an error document.

We added bucket policy in template.yaml which adds permissions to root bucket.

We renamed scripts in /bin/cfn folder and removed ‘-deploy’

We also wrote [/bin/cfn/frontend](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/3598db3c15aa88be4f7fc7eacf49a573b586aa6b/bin/frontend/deploy)

Before we execute this script, we have to remove ‘A’ record from our root domain as our template.yaml will also generate a A record.

I got an error because I had not deleted it.

![image](./assets/a25_CICDFrontend1.PNG)

![image](./assets/a25_CICDDeleteTypeA.PNG)

![image](./assets/a25_CICDErrorFrontEnd.PNG)

![image](./assets/a25_CICDDeleteTypeA2.PNG)

After deleting the ‘A’ record deployed frontend again.

![image](./assets/a25_CICDFrontendCreateAgain.PNG)

![image](./assets/a25_CICDFrontendCreated.PNG)

![image](./assets/a25_CICDFrontendResources.PNG)
