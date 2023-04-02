# Week 5 — DynamoDB and Serverless Caching
### Data Modelling a Direct Messaging System using Single Table Design

I used Andrew Brown’s Lucid chart as a reference

![Lucid Chart - Data Model](./assets/week5_DataModel.PNG) 
and ![Data Model in excel](./assets/week5_DataModel2.PNG) 
to visualize data patterns. We have all the data in a single table because all the data in that table are related and this reduces complexity when it comes to management.

### DynamoDB Utility Scripts

We added boto3 to requirements.txt and ran pip install -r requirements.txt  

![boto install](./assets/week5_Intallboto3.PNG). 

We also rearranged some folders in the backend-flask directory and created ddb folder for DynamoDB related files. 

```
bin
|--ddb
   |--schema-load
   |--drop
   |--seed
```

We have a choice of using either CLI, SDK or aws console to create DynamoDB tables but in this bootcamp we chose SDK. 

In [bin/db/setup](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/bin/db/setup), the following was edited i.e file structure and name: 

```bash
	bin_path="$(realpath .)/bin"
	source "$bin_path/db/drop"
	source "$bin_path/db/create"
	source "$bin_path/db/schema-load"
	source "$bin_path/db/seed"
  ```  

After docker compose up, ran schema-load , and it created our local DynamoDB table. ![Create DynamoDB table](./assets/week5_schemaload.PNG)

We need a way to show what tables we have. so we Created a new file in ddb named list-tables. ![List Tables](./assets/week5_listTables.PNG)

CLI Command to check the Table 

`aws dynamodb list-tables --endpoint-url http://localhost:8000/`

Updated the file `backend-flask/db/seed.sql` and loaded it. ![seed.sql](./assets/week5_loadpopulate_tables.PNG)

We want to see the data we're seeding, so in ddb, we create scan and set it for local DynamoDB only, because doing a scan in production can be expensive. Created new folder in ddb named patterns (for implementing access patterns), then created 2 new files: get-conversation and list-conversations

![Cruddur Messages Table](./assets/week5_cruddurmessages_table.PNG)

To drop the tables we created we created a file ‘drop’  
![Connect to prod](./assets/week5_droptable.PNG)


![List Conversations Start](./assets/week5_listconversationsBegin.PNG)


![List Conversations end](./assets/week5_listconversations.PNG)

## ****Implement Conversations with DynamoDB****

We made a small addition to gitpod.yml. We updated flask to avoid pip install everytime.

```markup
name: flask
command: |
  cd backend-flask
  pip install -r requirements.txt
```

We updated our psql command in [bin/db/drop](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/bin/db/drop)
to drop the database IF EXISTS. Next step is to docker compose up and login to our app and click on ‘messages’. ![List conversation app](./assets/week5_conv1.PNG)

We implemented [backend-flask/lib/ddb.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/lib/ddb.py). We learnt the difference between the Postgres database in db.py and what we are implementing in ddb.py. In the Postgres database, we are doing initialization, using a constructor to create an instance of the class, and ddb.py is a stateless class. If you can do things without state, it's much easier for testing, as you just test the inputs and outputs, using simple data structures.

We created a new folder in backend-flask/bin called cognito, then a new file in the folder named list-users. We replaced hardcoded 'user_handle' value with my own username "roopish" in [app.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/app.py) under the /api/activities route. To list Cognito users through the AWS CLI, we need the user pool id. From terminal, we run the following: `aws cognito-idp list-users --user-pool-id=us-east-1_xxx`

![List users](./assets/week5_conv2.PNG)

We need to store the env var for the AWS_COGNITO_USER_POOL_ID

![Env variable Cognito User pool ](./assets/week5_conv3.PNG)

We updated docker-compose file to include this environment variable. 

To list users we run the below command ![List users](./assets/week5_conv4.PNG)

To update our users, cognito user id in our database we created bin/db/update_cognito_user_ids

. This file gets called from bin/db/setup when we run below is the output ![setup environment](./assets/week5_conv5.PNG)

We updated HomeFeedPage.js, MessageGroupsPage.js, MessageGroupPage.js, and MessageForm.js to include authorization headers. We created CheckAuth.js and updated HomeFeedPage.js, MessageGroupsPage.js, MessageGroupPage.js, and MessageForm.js to use setUser, which we defined in CheckAuth.

Added AWS_ENDPOINT_URL variable to our docker-compose.yml file. 

`AWS_ENDPOINT_URL: "http://dynamodb-local:8000/"`

We updated App.js and MessageForm.js to include our @:handle and our message_group_uuid

![Output after adding message group uuid](./assets/week5_conv6.PNG)

We also updated **ddb.py** to remove hardcoded year and use year = str(datetime.now().year). After making all these changes we docker-compose up and these are the screenshots below

After running a setup ![SetUp environ](./assets/week5_conv7_setup.PNG) and after seeding ![Seed](./assets/week5_conv7_seed.PNG). When we run get-conversations, below are the 3 screenshots 
![Get Conversation step1](./assets/week5_conv7_getConv1.PNG)

![Get Conversation step2](./assets/week5_conv7_getConv2.PNG). Below is the screenshot of the app with correct time  ![Get Conversation from app](./assets/week5_conv8.PNG)

We insert a user ‘londo’ to SQL query locally through the terminal after connecting to our Postgres db using ./bin/db/connect, then running our query of manually.

![londo - another user](./assets/week5_conv9_londo.PNG). I also sent a message to the user handle ‘londo’ as seen in ![Conversation seen in app](./assets/week5_conv10.PNG)

### DynamoDB Stream

We have to create a Dynamo DB Stream trigger to update the message groups in the production environment. To start this, we ran ./bin/ddb/schema-load prod. We then logged into AWS and checked DynamoDB to see our new table.  

![Prod Table created](./assets/week5_DDBProd_TableCreated.PNG).

Next step is to turn on streaming through the console. 

![Turn on Streaming](./assets/week5_DDBProd_StreamTurnedOn.PNG)

We created a VPC endpoint for the DynamoDB service, but had concerns as it may cost money. We looked into it and gateway endpoints, which are whats used for connecting to DynamoDB, do not incur additional money. Created VPC endpoint in AWS named ddb-cruddur then connected it to DynamoDB as a service as seen in these 3 screenshots

![VPC Step1](./assets/week5_VPC1.PNG)

 ![VPC Step2](./assets/week5_VPC2.PNG) 

![VPC created](./assets/week5_VPCCreated.PNG)

We created a Lambda function to run for every time we create a message in Cruddur (our web app) as seen in these 4 screenshots

![CreateLambda step1](./assets/week5_CreateLambda1.PNG)

![CreateLambda step2](./assets/week5_CreateLambda2.PNG)

![CreateLambda step3](./assets/week5_CreateLambda3.PNG) 

![Created Lambda function](./assets/week5_CreateLambdaFunction.PNG)

We then added Policy to this Lambda function

![Lambda_Addpolicy_step1](./assets/week5_Lambda_Addpolicy.png) 

![Lambda_Addpolicy_step2](./assets/week5_Lambda_Addpolicy2.png)

![Attach role to policy](./assets/week5_AttachPolicyToRole.PNG)

AWS did not give us the role permissions we needed for our function to operate correctly. After realizing the need for a global secondary index, the following two code blocks were added to the `backend/bin/ddb/schema-load` file:

![PROD table with GSI](./assets/week5_ProdTable_WithGSI.PNG)

```python
AttributeDefinitions=[
    {
      'AttributeName': 'message_group_uuid',
      'AttributeType': 'S'
    },
```

```python
GlobalSecondaryIndexes= [{
    'IndexName':'message-group-sk-index',
    'KeySchema':[{
      'AttributeName': 'message_group_uuid',
      'KeyType': 'HASH'
    },{
      'AttributeName': 'sk',
      'KeyType': 'RANGE'
    }],
    'Projection': {
      'ProjectionType': 'ALL'
    },
    'ProvisionedThroughput': {
      'ReadCapacityUnits': 5,
      'WriteCapacityUnits': 5
    },
  }]
```

![Prod Table with GSI in Console](./assets/week5_ProdTable_WithGSI_console.PNG) shows the table with GSI.

From the AWS console, we navigate to Lambda, then created a new trigger named cruddur-messaging-stream. Here are the screenshots of the process of creating them ![Create Trigger step1](./assets/week5_CreateTrigger1.PNG) 

![Create Trigger step2](./assets/week5_CreateTrigger2.PNG)

![Create Trigger step3](./assets/week5_CreateTrigger3.PNG)

Now we hook up our application to use production data. We went back over to docker-compose.yml and commented out the AWS_ENDPOINT_URL variable. After docker compose up, when we go to our app we should see seed data. We click on Messages and append new/bayko to the URL and should be able to send messages to bayko 
![Send message](./assets/week5_SendMessageToBayko.PNG)

We specified our ARNs for our resources, created a new folder inside our aws folder, then created a new json file named cruddur-messaging-stream and pasted the json from the policy we just created. We then added our Lambda code to our repository as well. For our policy, we named it cruddur-messaging-stream-dynamodb and saved it. With the new policy enabled, we tested again.

![Attach Policy step1](./assets/week5_conv11.PNG)

![Attach Policy step 2](./assets/week5_conv12.PNG) 

![Create Policy](./assets/week5_conv13.PNG)  

![Attach Policy step 3](./assets/week5_AttachPolicyToRole.PNG)

Delete all the messages in AWS console 

![Delete previous message](./assets/week5_conv13_deleteitems.PNG) 

![After message is posted](./assets/week5_conv14.PNG)

![Cloud watch Log showing first message](./assets/week5_conv15Log1.PNG)

![CloudWatch Log showing second message](./assets/week5_conv15Log2.PNG) 

Final output ![Messaging stream](./assets/week5_conv15_Messages.PNG)

#### Thanks and References: 

I was getting error “psql: command not found” after reopening and existing workspace and trying to connect to postgresql. Thanks to @Abdassalam suggestion to modify gitpod.yml from init to before.

Also thanks to  @F4dy for sharing solution for issue with negative values for the "posted since" in the message listings

To understand the basics of DynamoDB, I watched these videos **[Amazon DynamoDB Learning Path](https://www.youtube.com/playlist?list=PLJo-rJlep0EDoGu69NEV5j2Qew3b_qeWO)** and **[DynamoDB — Anatomy of Table](https://www.youtube.com/watch?v=kyFcwzfr_BA&list=PLBfufR7vyJJ5WuCNg2em7SgdAfjduqnNq&index=77)** 

To understand boto3, I read through this article: [https://boto3.amazonaws.com/v1/documentation/api/latest/index.html](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
