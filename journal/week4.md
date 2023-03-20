# Week 4 — Postgres and RDS
## ## **Required Homework**

### ### **Create RDS Postgres Instance**

1. We first checked whether we have postgres installed correctly, which I had.
    

2. We created a RDS Postgres instance from the AWS CLI in Gitpod with our default aws region, using the following command:
   

```markup

aws rds create-db-instance \
  --db-instance-identifier cruddur-db-instance \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.6 \
  --master-username crudderroot \
  --master-user-password {password} \
  --allocated-storage 20 \
  --availability-zone {my default aws region} \
  --backup-retention-period 0 \
  --port 5432 \
  --no-multi-az \
  --db-name cruddur \
  --storage-type gp2 \
  --publicly-accessible \
  --storage-encrypted \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --no-deletion-protection

```

3. After this ran, we connected to AWS console and looked at RDS and verified that we could see our database.   ![VerifyRDSCreation](./assets/week4_CreateDBInstance.png)
4. We commented out DynamoDB portion of code in [dockercompose.yml](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/docker-compose.yml) since most of us are running out of gitpod credits. 
5. To connect locally to postgresql via the psql client cli tool use host flag to specific localhost.
    
    `psql -Upostgres --host localhost`
    
    I also learnt various postgresql commands for data definition and manipulation.
    
    1. Once we were logged into the local database, we created a database named cruddur.
    
    `CREATE database cruddur;`
    
    To auto generate UUID’s in postgres we added `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` to [schema.sql](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/db/schema.sql)
    
    We also created 2 environment variables to store connection URLs **CONNECTION_URL** and **$PROD_CONNECTION_URL**
    
    `export CONNECTION_URL="postgresql://postgres:password@localhost:5432/cruddur”`
    
    `export PROD_CONNECTION_URL="postgresql://crudderroot:xxx@cruddur-db-instance.*****.us-east-1.rds.amazonaws.com:5432/cruddur”`
    
    To Connect to Postgresql below is the format
    

```markup
postgresql://[username[:password]@][netloc][:port][/dbname][?param1=value1&...]
```

**Bash scripting for database actions**

   
1. Connecting to the aws RDS via the terminal can done by:
   
    `psql $PROD_CONNECTION_URL`

  See below for result:
 ![db-prod](./assets/week4_ConnectToProd.png)
 

## ### **Bash scripting for Database Operation and SQL files**

1.We created a new folder in 'backend-flask' named '[bin](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/tree/main/backend-flask/bin)' . In this folder, we can store batch scripts to execute commands for our database.  


 Note:
a. Each script must start with  `#! usr/bin/bash`

b. All these files need their file permissions to be set to executable while in the backend-flask directory:
    
     `chmod u+x ./bin/filename`
   
c. We also learnt the use of bash command ‘realpath’ to set 
    
    `file_parent_dir=/workspace/aws-bootcamp-cruddur-2023/backend-flask`

d. We need a way to determine when we're running from our production environment (prod) or our local Postgres environment. To do this, we added the below conditional statement
    
    `if [ "$1" = "prod" ]; then
        URL=$PROD_CONNECTION_URL
    else
        URL=$CONNECTION_URL
    fi`
    

2. [schema.sql](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/db/schema.sql) provides the tables model for the database cruddur and [seed.sql](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/db/seed.sql) contains manually generated data for testing.

3. We created [db-setup](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/bin/db-setup) calls scripts db-* to Drops tables if exists and creates tables and populate tables. Below is the screenshot

    ![local-database-setup](./assets/week4_setup.png)

4. Connect to local database:

    ![local-db-inners](./assets/week4_LocalDBconnect.png)

5. To allow connection from our workspace to the aws rds instance, a script [[rds-update-sg-rule](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/bin/rds-update-sg-rule)] is created. Note: We have set environment keys for *DB_SG_RULE_ID* and *DB_SG_ID*
  - The *DB_SG_ID* is the security group id of the security group attached to the rds instance
  - The *DB_SG_RULE_ID* is rule id contained in the above

6. Since the workspace is temporary, we need to set it at startup of every new workspace. We added  the below postgres task in [[.gitpod.yml](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/.gitpod.yml)] file:
    
      `export GITPOD_IP=$(curl ifconfig.me)
    source "$THEIA_WORKSPACE_ROOT/backend-flask/bin/rds-update-sg-rule"`
    

## ### **Install Postgres Driver in Backend Application and Connecting to Local RDS Instance**

1. We need the *psycopg* library as a driver for connecting to the postgres container. The following was added to the requirements.txt file
    
    `psycopg[binary]
     psycopg[pool]`
    
2. In the [db.py](http://db.py) is created and populated with:
    
    `from psycopg_pool import ConnectionPool
    import os

    # Wrap query and ensure object result is returned as json
    def query_wrap_object(template):
      sql = f"""
      (SELECT COALESCE(row_to_json(object_row),'{{}}'::json) FROM (
      {template}
      ) object_row);
      """
      return sql

    #Wrap query and ensure array result is returned as json
    def query_wrap_array(template):
      sql = f"""
      (SELECT COALESCE(array_to_json(array_agg(row_to_json(array_row))),'[]'::json) FROM (
      {template}
      ) array_row);
      """
      return sql`

3. In the [docker-compose.yml] file, we updated the environment variable
    

   `CONNECTION_URL: "${PROD_CONNECTION_URL}"`
    

4. In our [home_activities.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/services/home_activities.py) we'll replace our mock endpoint with real api call
   
5. Running docker compose up and inspecting the frontend:
    ![Frontend](./assets/week4_FirstQuery.png)

## ### ****Setup Cognito post confirmation lambda****

The goal of this chapter is to insert registered users post registration confirmation into the users table within cruddur database.
1. Firstly created a new function in the lambda service page. The following basic setup was used:
    - Author from scratch
    - Provide the function name
    - Runtime: Python3.8
    - Architecture: x86_64

2. In the new function page, I copied the following code into the editor as seen below and we deploy. 
    [Lambda Function](/assets/week4_LambdaFunc.PNG)

3. To use the *psycopg2* we  needed to add a layer. There are several layer  arns available [here](https://github.com/jetbridge/psycopg2-lambda-layer) for use. I used `us-east-1` and `us-east-2` for python 3.8. I also added the environment variable *CONNECTION_URL* which has the same value as *PROD_CONNECTION_URL*. I also created [cruddur-post-confirmation.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/aws/lambdas/cruddur-post-confirmation.py) where username, preferred username, email and cognitoid is inserted to users table.
  
5. To ensure that the lambda can make network calls, and additional policy was added to the lambda role as seen below:
    - Below is the JSON
      
      ```{
          "Version": "2012-10-17",
          "Statement": [
              {
                  "Effect": "Allow",
                  "Action": [
                      "ec2:CreateNetworkInterface",
                      "ec2:DeleteNetworkInterface",
                      "ec2:DescribeNetworkInterfaces",
                      "ec2:AttachNetworkInterface",
                      "ec2:DescribeInstances"
                  ],
                  "Resource": "*"
              }
          ]
      }```
      
    We have to edit VPC details for lambda function configuration ![VPC](/assets/week4_VPC.PNG)

6. We made changes to ![schema.sql](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/db/schema.sql) to update users table changed columns display_name, handle, email, cognito_user_id to be NOT NULL.  I started docker container, navigated to user sign-in and completed the process. Looking at the cloudwatch logs, it shows it was successful.

    ![CloudWatch Logs](./assets/week4_CloudWatchLog_NewUser.PNG)

    Below is the screenshot when we check tables
    ![post-confirm-db](./assets/week4_PostConfirmDB.png)

## ### **Creating New Activities with a Database Insert**

1.  We created new files 
 '[backend-flask/db/create.sql](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/db/sql/activities/create.sql)`
`[backend-flask/db/home.sql](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/db/sql/activities/home.sql)`
 `[backend-flask/db/object.sql](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/db/sql/activities/object.sql)` and modified 

    
2. Updated [[home_activities.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/services/home_activities.py)] to make use of the db object from above:
    ```
     class HomeActivities:
        def run(logger=None, cognito_user=None):
            # logger.info("Test from Home Activities")
            with tracer.start_as_current_span("home-activities-mock-data"):
                span = trace.get_current_span()
                now = datetime.now(timezone.utc).astimezone()
                span.set_attribute("app.now", now.isoformat())

                sql = db.read_sql_template('activities', 'home')
                results = db.query_array_json(sql)

                return results
    ```
3. Updated [[create_activity.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/services/create_activity.py)] to make use of the db object from above:

5. To change the hardcoded "andrewbrown" to the username present in my db first, [[app.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/app.py)] is modified
    

    ```@app.route("/api/activities", methods=['POST', 'OPTIONS'])
   @cross_origin()
   def data_activities():
        user_handle = 'blaquedayo'
        message = request.json['message']
        ttl = request.json['ttl']
        model = CreateActivity.run(message, user_handle, ttl)
        if model['errors'] is not None:
            return model['errors'], 422
        else:
            return model['data'], 200
        return```

Secondly, in the frontend we modified the onsubmit method in [ActivityForm.js](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/frontend-react-js/src/components/ActivityForm.js)

```body: JSON.stringify({
 user_handle: props.user_handle.handle,
 message: message,
 ttl: ttl
 })```

Finally, [HomeFeed.js](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/frontend-react-js/src/pages/HomeFeedPage.js) is modified to add the user handle

  

```<ActivityForm
user_handle={user}
popped={popped}
setPopped={setPopped}
setActivities={setActivities}
/>```

6. I successfully posted crudds as seen in the screenshot below

    ![crudds](./assets/week4_AfterSignIn_Cruds.png)
