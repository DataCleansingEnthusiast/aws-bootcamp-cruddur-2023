# Week 6 — Deploying Containers
## Test RDS Connection

Added this `test` script so we can easily check our connection from our container.
[testconnection](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/bin/db/test)

![connection to RDS](./assets/week6_1_TestSuccess.PNG)

## Task Flask Script

We will add a health-check endpoint for our flask application in app.py:

```python
@app.route('/api/health-check')
def health_check():
  return {'success': True}, 200
```

We'll create a new bin script at `bin/flask/health-check` and this script gets moved to a different folder /backend-flask/bin folder

[health-check](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/bin/health-check)
![health-check](./assets/week6_2_Healthcheck.PNG)


## Create CloudWatch Log Group

```sh
aws logs create-log-group --log-group-name cruddur
aws logs put-retention-policy --log-group-name cruddur --retention-in-days 1
```
![aws cloudwatch logs](./assets/week6_3_CreateCWLogGrp.PNG)


## Create ECS Cluster

![aws cli ecs creation](./assets/week6_4_CreateClusterCLI.PNG)
![aws console](./assets/week6_5_CreatedCluster.PNG)



## Gaining Access to ECS Fargate Container

### Create ECR repo and push image

#### For Base-image python

![ecr](./assets/week6_6_Createawsecr.PNG)
![aws ecr - console](./assets/week6_7_awsconsoleecr.PNG)


#### Login to ECR

```sh
aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"
```
![login ecr](./assets/week6_8_loginecr_CLI.PNG)

#### Set URL

```sh
export ECR_PYTHON_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/cruddur-python"
echo $ECR_PYTHON_URL
```
![set ecr URL](./assets/week6_9_setecrURL.PNG)


#### Pull,Tag,list Image

![docker pull,tag,list images](./assets/week6_10_dockerpulltag.PNG)

#### Push Image

```sh
docker push $ECR_PYTHON_URL:3.10-slim-buster
```
![docker push image](./assets/week6_11_dockerpushimage.PNG)


Replace the python image in the Dockerfile of backend-flask and do a docker compose up and then run the health check
![replace python image](./assets/week6_12_healthcheck.PNG)

#### Create Repo for backend
```sh
aws ecr create-repository \
  --repository-name backend-flask \
  --image-tag-mutability MUTABLE
```
![Repository for backend-flask](./assets/week6_13_CreateRepository.PNG)



#### Set URL

```sh
export ECR_BACKEND_FLASK_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/backend-flask"
echo $ECR_BACKEND_FLASK_URL
```
![Set URL](./assets/week6_14_SetURL.PNG)

#### Build Image
Make sure you are in the correct directory i.e. backend-flask 

```sh
docker build -t backend-flask .
```
#### Tag Image

```sh
docker tag backend-flask:latest $ECR_BACKEND_FLASK_URL:latest
```

#### Push Image

```sh
docker push $ECR_BACKEND_FLASK_URL:latest
```
![docker tag, push backend-flask](./assets/week6_15_Pushimage.PNG)


![aws backend flask push](./assets/week6_15_awsbackendflaskpush.PNG)

## Register Task Defintions

![Update Retention](./assets/week6_16_UpdatedRetention.PNG)

### Passing Senstive Data to Task Defintion
We will store sensitive data in the AWS Systems Manager->Parameter Store

```sh
aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/AWS_ACCESS_KEY_ID" --value $AWS_ACCESS_KEY_ID
aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/AWS_SECRET_ACCESS_KEY" --value $AWS_SECRET_ACCESS_KEY
aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/CONNECTION_URL" --value $PROD_CONNECTION_URL
aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/ROLLBAR_ACCESS_TOKEN" --value $ROLLBAR_ACCESS_TOKEN
aws ssm put-parameter --type "SecureString" --name "/cruddur/backend-flask/OTEL_EXPORTER_OTLP_HEADERS" --value "x-honeycomb-team=$HONEYCOMB_API_KEY"
```
![export OTEL_EXPORTER_OTLP_HEADERS](./assets/week6_17_OTEL.PNG)
![paramstore1](./assets/week6_18A.PNG)
![paramstore2](./assets/week6_18B.PNG)
![paramstore3](./assets/week6_18C.PNG)
![paramstore4](./assets/week6_18D.PNG)
![paramstore5](./assets/week6_18E.PNG)
![aws parameter store](./assets/week6_18G_AWSconsoleASM.PNG)

### Create Task and Execution Roles for Task Definition

#### Create ExecutionRole
Create a file under aws/policies/service-execution-policy.json

```aws
aws iam create-role \
    --role-name CruddurServiceExecutionRole \
    --assume-role-policy-document
    file://aws/policies/service-execution-policy.json
```

![create Execution role ](./assets/week6_19_ExecutionRole.PNG)

#### Create ExecutionPolicy
```sh
aws iam create-role \
--role-name CruddurServiceExecutionPolicy  \
--assume-role-policy-document "file://aws/policies/service-assume-role-execution-policy.json"
```


```sh
aws iam put-role-policy \
  --policy-name CruddurServiceExecutionPolicy \
  --role-name CruddurServiceExecutionRole \
  --policy-document file://aws/policies/service-execution-policy.json
"
```

![ExecutionRole step2](./assets/week6_19_ExecutionRole_2.PNG)

![ExecutionRole step3](./assets/week6_19_ExecutionRole_3.PNG)

```sh
aws iam attach-role-policy --policy-arn POLICY_ARN --role-name CruddurServiceExecutionRole
```

```sh
aws iam attach-role-policy \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
    --role-name CruddurServiceExecutionRole
```

![CruddurServiceExecutionRole](./assets/week6_20_PolicyAndRole.PNG)


#### Create TaskRole

```aws
aws iam put-role-policy \
  --policy-name SSMAccessPolicy \
  --role-name CruddurTaskRole \
  --policy-document "{
  \"Version\":\"2012-10-17\",
  \"Statement\":[{
    \"Action\":[
      \"ssmmessages:CreateControlChannel\",
      \"ssmmessages:CreateDataChannel\",
      \"ssmmessages:OpenControlChannel\",
      \"ssmmessages:OpenDataChannel\"
    ],
    \"Effect\":\"Allow\",
    \"Resource\":\"*\"
  }]
}"
```
```
aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/CloudWatchFullAccess --role-name CruddurTaskRole
aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess --role-name CruddurTaskRole
```

![CruddurTaskRole Policy](./assets/week6_21_TaskRolePolicy.png)


### Create Json file
Create a new folder called [aws/task-definitions](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/tree/main/aws/task-definitions) and update appropriate values with my account info.



### Register Task Defintion

```sh
aws ecs register-task-definition --cli-input-json file://aws/task-definitions/backend-flask.json
```
```sh
aws ecs register-task-definition --cli-input-json file://aws/task-definitions/frontend-react-js.json
```

![execute task definition](./assets/week6_22_TaskDefinition1.PNG)

![AWS task definition](./assets/week6_22_TaskDefinition1_console.PNG)


Created a cluster service in the AWS console


## Defaults

Default VPC_ID
![Default VPC_ID](./assets/week6_23_DefaultVPC.PNG)

```sh
export DEFAULT_SUBNET_IDS=$(aws ec2 describe-subnets  \
 --filters Name=vpc-id,Values=$DEFAULT_VPC_ID \
 --query 'Subnets[*].SubnetId' \
 --output json | jq -r 'join(",")')
echo $DEFAULT_SUBNET_IDS
```

### Create Security Group
![Create SecurityGroup](./assets/week6_24_SecurityGroup.PNG)

![SecurityGroupVerified](./assets/week6_24_SecurityGroup_verified.PNG)


Edit permissions to ECR to execute ECS

![edit CruddurServiceExecutionPolicy](./assets/Week6_25_CruddurServiceExecutionPolicy.PNG)

![ECS cluster backendflask](./assets/Week6_25_ECSclusterbackendflask.PNG)

----------------------------
### Connection via Sessions Manaager (Fargate)


 Install for Ubuntu

 ```sh
 curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o "session-manager-plugin.deb"
 sudo dpkg -i session-manager-plugin.deb
 ```

 To verify whether it is working

 ```sh
 session-manager-plugin
 ```
 ![SessionManagerPlugin](./assets/week6_26_SessionManagerPlugin.PNG)


Connect to the container

 ```sh
aws ecs execute-command  \
--region $AWS_DEFAULT_REGION \
--cluster cruddur \
--task xxxxxxxxxxx \
--container backend-flask \
--command "/bin/bash" \
--interactive
```
![Connect To Container](./assets/week6_27_Connect_Container.PNG)

### Create ECS cluster Service using json aws cli
create a new file under aws/json/service-backend-flask.json

[aws/json/service-backend-flask.json](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/aws/json/service-backend-flask.json)

### Create Services

```sh
aws ecs create-service --cli-input-json file://aws/json/service-backend-flask.json
```

```sh
aws ecs create-service --cli-input-json file://aws/json/service-frontend-react-js.json
```

![ecs service backend-flask](./assets/week6_28_CreateService.PNG)

![ecs execute command ](./assets/week6_29_InOurContainer.PNG)

![backend-flask health-check](./assets/week6_30_FlaskHealthCheck.PNG)

### Create a bash script to connect-to-service of ECS cluster

[Code for Backend connect](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/bin/backend/connect)

![TestConnect](./assets/week6_31_TestingConnectingusingCLI.PNG)

Update the security group for the backend-flask for port 4567 and run health check


![HealthCheckafterPortChange](./assets/week6_33_HealthCheckAfterPortChange.PNG)

![backend-flask test connection](./assets/week6_34_TestConnect.PNG)


**Create a LOAD BALANCER on the AWS console**

 a) Create Application Load Balancer cruddur-alb, Internet-facing, IPv4 address type
 ![image](./assets/week6_35_AccessThroOnlyALB.PNG)

### create the aws ecs service and add the Load balancer

Run the create service command

```aws
aws ecs create-service --cli-input-json file://aws/json/service-backend-flask.json
```
![Create Service](./assets/week6_36_CreateService.PNG)

![Add Load Balancer](./assets/week6_36_LoadBalancer.PNG)
 

![Target Group](./assets/week6_36_TargetGroup.PNG)

![ALB health-check](./assets/week6_37_HealthCheckLoadBalancer.PNG)

### Build the frontend-react-js

Create production version of dockerfile [backend-flask/Dockerfile.prod](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/Dockerfile.prod)

![Frontend](./assets/week6_38_CreateFrontend.PNG)

### For Frontend React

We created a folder for building, Tag, Push, register and deploy the image
[bin/frontend](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/bin/frontend)


### Create Services
```aws
aws ecs create-service --cli-input-json file://aws/json/service-frontend-react-js.json
```

![Frontend Target group](./assets/week6_38_CreateFrontendtg.PNG)

**Made sure your RDS should be up and running i.e.using PROD-CONNECTION_URL**

#### I created a Hosted domain name for my domainname using AWS Route 53

![Created DNS](./assets/week6_39_CreateDNSrecords.PNG)


#### Create a certificate manager to request for SSL certificate

![certificate Manager](./assets/week6_40_CertificateIssued.PNG)

click on the create a record in Route53

![Hosted zone details](./assets/week6_41_Records.PNG)

**EDIT the ALB to manage the rules**

![ALB](./assets/week6_41_update_lb_listeners6_modify_rules.PNG)



Add a listener for redirecting to 443 to forward to frontend-react-js app with the newly created certificate. Remove the other listeners for port 4567 and 3000. Create a record in the Route53 for a ALB.

**curl the dns and see whether it is working or not**

![HealthCheck](./assets/week6_42_TestHealthCheck.PNG)

**Test in the browser**

![Browser check](./assets/week6_42_TestHealthCheck_browser.PNG)

**Edit the task definition for backend-flask with dns names
```json
"environment": [
 ...
          {"name": "FRONTEND_URL", "value": "https://roopish-awssolutions.com"},
          {"name": "BACKEND_URL", "value": "https://api.roopish-awssolutions.com"},
  ...        
        ],
```
[task-definitions/backend-flask.json](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/aws/task-definitions/backend-flask.json)

### Login to ECR to push the new frontend image
```aws
aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"
```
### Set URL
```sh
export ECR_FRONTEND_REACT_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/frontend-react-js"
echo $ECR_FRONTEND_REACT_URL
```

### Built the Image for frontend, tag the image, push and deploy it

Test my website https://roopish-awssolutions.com/

![image](./assets/week6_45_Messages.PNG)

![image](./assets/week6_45_Messagesaftersignin.PNG)


# Securing Flask

change the ports 443 and 80 to access only my ip and then test the api.
![Testing json](./assets/week6_46_JSONAfterSecuringFlask.PNG)


### Created script file for the ECR Login
[Login](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/bin/ecr/login)

# Implement Refresh Token Cognito

First Login into the ecr by running ./bin/ecr/login
Do the docker compose up
Setup postgres by running ./bin/db/setup file
Run dynamodb schema-load ./bin/ddb/schema-load
Run the dynamodb seed file ./bin/ddb/seed
Test the app is working fine

![image](./assets/week6_47_FixMessageInProduction.PNG)

modify the code in the CheckAuth.js in frontend-react-js
Modify the code in other files where the CheckAuth.js library is imported.
Messagefeed.js,Homefeedpage.js,messagegroupsPage.js, messagegrouppage.js, messagegroupsNewPage.js

Then test the frontend App is able to refresh the token properly.

# Fix Messaging In Production
Restructure the script file in the bin directory for the frontend and backend
Connect to the postgres production(rds) using ./bin/db/connect prod

### Created the Kill-all-connection.sql to kill all connections 
[Kill Connections](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/db/kill-all-connections.sql)

We restructured files from backend-flask to bin directory.

Run the Postgres ./bin/db/setup
Run the dynamodb script ./bin/ddb/schema-load
Run the dynamodb seed script file ./bin/db/seed
Docker build the backend-flask with Dockerfile.prod
Push the backend image to ECR using the script ./bin/backend/push
Deploy the backend service with force-deployment using the script ./bin/backend/deploy
Connect to your postgresdb(rds) prod using the script ./bin/db/connect prod

Test the frontend app using the url [https://roopish-awssolutions.com/messages/new/bayko](https://roopish-awssolutions.com/messages/new/bayko)


**Test #1**
1) Docker compose up with AWS_ENDPOINT_URL: "http://dynamodb-local:8000/"
2) Run./bin/db/setup 
3) Run ./bin/ddb/schema-load 
4) Run ./bin/ddb/seed
5) The frontend app Working fine with no issues in the posting the messages

**Test #2:**
1) I commented out AWS_ENDPOINT_URL: "http://dynamodb-local:8000/"
2) docker compose down and Compose up to pick the changes 
3) I was able to post the messages without any issues with dynamodb prod and with local rds.

**Test #3:**
1) Run ./bin/backend/build and ./bin/frontend/build
2) Run ./bin/backend/push and ./bin/frontend/push 
3) Run ./bin/backend/register and ./bin/frontend/register
4) Run ./bin/backend/deploy and ./bin/frontend/deploy

After running Test #3, I get the error __"'NoneType' object is not subscriptable"__ in the Rollbar and a __500 error__ in the when I inspect.


 ![Error2](./assets/week6_52_Error2.png)
 
![Error1](./assets/week6_52_Error1.png)

__Resolution:__
 I talked to Andrew, during office hours and found that cognito_userid is different from the current_user_id. I updated the record with the correct cognito_user_id and it worked.

 ![post messages to dynamodb](./assets/week6_53_Output.PNG)


 ### Fargate - Configuring for Container Insights

 Update the Task-definition for the backend and frontend flask to include the x-ray instrumentation in task-definition.

 `aws/task-definitions/backend-flask.json'  and 'aws/task-definitions/frontend-react-js.json'

 ```json
 "containerDefinitions": [
 {
       {
        "name": "xray",
        "image": "amazon/aws-xray-daemon" ,
        "essential": true,
        "portMappings": [
          {
            "name": "xray",
            "containerPort": 2000,
            "protocol": "udp"
          }
        ]
      },
  ```

 - Run ./bin/backend/register
 - Run ./bin/backend/deploy
 - Run ./bin/frontend/register
 - Run ./bin/frontend/deploy

 ![backend x-ray](./assets/week6_52_Healthybackend.PNG)

 ![frontend x-ray](./assets/week6_52_HealthyFrontend.PNG)


`Enable container insights'

 - Open the CloudWatch console in your AWS account.
 - select the container cluster(cruddur) which you want to enable the container insights
 - click on the  `update cluster' button to enable the container insights.
 - Select the monitor and 'Enable container insights'.
 - click on the update to apply the changes.
 
![container insights](./assets/week6_52_ContainerInsightson.PNG)

![container insights](./assets/week6_52_ContainerInsights1.PNG)

![container insights](./assets/week6_52_ContainerInsights2.PNG)


### Check the container insights in cloudwatch

![cloudwatch container insight map view](./assets/week6_52_ContainerInsight4.PNG)

![cloudwatch container insight list view](./assets/week6_52_ContainerInsight3.PNG)

![backend task performance monitoring](./assets/week6_52_ContainerInsight5.PNG)

![frontend task performance monitoring](./assets/week6_52_ContainerInsight6.PNG)

### Generate environment variables into a file in the docker compose file to improve  docker networking
using a ruby script to generate-env file and use this file in the docker compose file.

[generate-env](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/bin/backend/generate-env)
This generates backend-flask.env and frontend-react-js.env for backend and frontend respectively.Note: These .env files should be added to .gitignore file

Run the docker compose up and see the app is working as expected.
