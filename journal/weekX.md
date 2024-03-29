# Week X Sync tool for static website hosting
In Week X we cleanup our application and get a few features in working state. 
We created a new file `bin/frontend/static-build` which builds the static files for the frontend application.

In RecoverPage.js changed ‘==’ to ‘===’

```jsx
let form;
  if (formState === 'send_code') {
    form = send_code()
  }
  else if (formState === 'confirm_code') {
    form = confirm_code()
  }
  else if (formState === 'success') {
    form = success()
  }
```

In SignInPage.js changed ‘==’ to ‘===’

```jsx
if (error.code === 'UserNotConfirmedException') {
        window.location.href = "/confirm"
```

In Confirmationpage.js changed ‘==’ to ‘===’

```jsx
if (err.message === 'Username cannot be empty'){
        setErrors("You need to provide an email in order to send Resend Activiation Code")   
      } else if (err.message === "Username/client id combination not found."){
        setErrors("Email is invalid or cannot be found.")
```

Removed `import {ReactComponent as BombIcon} from './svg/bomb.svg';` from ReplyForm.js

In ProfileForm.js commented out `const preview_image_url = URL.createObjectURL(file);``

In MessageGroupItem.js

```jsx
const classes = () => {
    let classes = ["message_group_item"];
    if (params.message_group_uuid === props.message_group.uuid){
      classes.push('active')
    }
```

In MessageForm.js removed ‘json’ from `import { json, useParams } from 'react-router-dom';`

DeskTopSidebar.js

```jsx
<footer>
        <a href="#">About</a>
        <a href="#">Terms of Service</a>
        <a href="#">Privacy Policy</a>
      </footer>
```

is replaced by /about , /terms-of-service and /Privacy-policy respectively

DesktopNavigationLink.js  add default case.

![image](assets/weekx_1.PNG)

replace align-items: start with align-items: flex-start

Commented out `let data = await res.json();` from ProfileForm.js since it’s not used.

Chmod u+x static-build file and run it.  We should see frontend-js/build/static folder getting created. Go to Index.html and see references to static content.

![image](assets/weekX_2.PNG)

Now we test this by placing this in CloudFront.

Go to cd frontend-react-js folder. The content of the build folder is zipped by using the command : zip -r build.zip build/ . Download this to our local directory and unzip the files.

![image](assets/WeekX_3buildzip.PNG)

![image](assets/WeekX_4DragFiles.PNG)

Uploaded these unzipped files to Public S3 Bucket roopish-awssolutions.com. 

![image](assets/WeekX_4UploadedToS3.PNG)

Now open [roopish-awssolutions.com](http://roopish-awssolutions.com) in the browser to see our app. 

![image](assets/WeekX_4OurApp.PNG)

Created a new file called `bin/frontend/sync` with a Ruby script for synchronizing files to AWS S3 and CloudFront. This script synchronizes the files in the frontend application to AWS S3 and CloudFront.

![image](assets/WeekX_5installs3websitesync.PNG)

Created a new file called `erb/sync.env.erb` with environment variable configurations for the synchronization script. This file contains the environment variables that are used by the synchronization script. We created tmp/.keep and since tmp files are added to gitignore, we have to run `git add -f tmp/.keep`

we committed the change. 

Updated the `erb/sync.env.erb` file to update the `SYNC_BUILD_DIR` and `SYNC_OUTPUT_CHANGESET_PATH` to use the `THEIA_WORKSPACE_ROOT` environment variable. This change ensures that the `sync.env` file uses the correct values for the environment variables.

Updated the `bin/frontend/generate-env` script to add code to generate the `sync.env` file using the `erb/sync.env.erb` template. This change ensures that the `sync.env` file uses the correct values for synchronization.

```jsx
template = File.read 'erb/sync.env.erb'
content = ERB.new(template).result(binding)
filename = 'sync.env'
File.write(filename, content)
```

Now run ./bin/frontend/generate-env and we should see sync.env file.

![image](assets/WeekX_5isync-env.PNG)

`gem install dotenv`` run this command

![image](assets/WeekX_6dotenv.PNG)

We update the SYNC_OUTPUT_CHANGESET_PATH=/workspace/aws-bootcamp-cruddur-2023/tmp/sync-changeset.json in sync.env

![image](assets/WeekX_7sync.PNG)

To check whether sync tool is working or not , we make change to DesktopSidebar.js and add an exclamation to About. we rerun `./bin/frontend/static-build` and then `./bin/frontend/sync`

I said ‘yes’ to execute the plan and then Invalidation is created.

![image](assets/WeekX_7bsync.PNG)

![image](assets/WeekX_7b_Invalidation.PNG)

![image](assets/WeekX_7AfterChanges.PNG)

We created a new directory structure /github/workflows/sync.yaml

we also created Gemfile and Rakefile.

Also update `./bin/frontend/generate-env` and frontend components.

Now we initialize the static hosting by uploading the frontend to S3 bucket:

- run `./bin/frontend/static-build`
- `cd frontend-react-js` then `zip -r build.zip build/`
- download and decompress the zip, and upload everything inside the build folder to s3://roopish-awssolutions.com

For syncing:

- Install by `gem install aws_s3_website_sync gem install dotenv`
- Run `./bin/frontend/generate-env` to generate `sync.env`
- Run `./bin/frontend/sync` to sync
- Run `./bin/cfn/sync` to create stack `CrdSyncRole`.
  ![image](assets/WeekX_8CFNcreateChangeSet.PNG)
  ![image](assets/WeekX_8CFNChangeSet.PNG)
- Click on the Resources tab and then on Role.

  ![image](assets/WeekX_8CFNResourcesRole.PNG)
- In the IAM, if we go to Trust Relationships tab, below is the screenshot. We add inline policy to add permissions.

  ![image](assets/WeekX_8AddRoleToS3.PNG)
  ![image](assets/WeekX_8AddRoleToObject.PNG)
  ![image](assets/WeekX_8CFNRole.PNG)
  ![image](assets/WeekX_8cfntoml.PNG)
  ![image](assets/WeekX_8VisualrepresentationOfroles.PNG)
  ![image](assets/WeekX_8PolicyCreated.PNG)

- We get the arn from IAM role for CrdSyncRole and paste it in github/workflows/sync.yaml

### **Reconnect DB and Postgre Confirmation Lamba**

We open up [roopish-awssolutions.com/api/activities/home](http://roopish-awssolutions.com/api/activities/home) and found that there is an error “upstream request timeout”

Logged onto aws console ECS→ Task Definition(CrdClusterFargateCluster**)** select backend-flask ****and then click on Task Running in Deployment and tasks section. This should take us to latest version ‘backend-flask;25’ . Click on JSON and we found that taskrole and execution role was not correct

```jsx
"taskRoleArn": "arn:aws:iam::1xxx:role/CruddurTaskRole",
"executionRoleArn": "arn:aws:iam::1xxx:role/CruddurServiceExecutionRole"
```

i.e. I checked /aws/cfn/service/template.yaml and taskrolename is CruddurServiceTaskRole-cfn and executionrolename is CruddurServiceExecutionRole-cfn

![image](assets/WeekX_9_WrongRoles.PNG)

To push the correct values we change the TimeOut value for HealthCheck from 6 to 7. This will trigger a new deploy.

Run ./bin/cfn/service and CFN exec change set

![image](assets/WeekX_9_CorrectedRoles.PNG)

Made changes to docker-compose.yaml

```jsx
services:
  backend-flask:
    env_file:
      - backend-flask.env
    build: 
      context: ./backend-flask
      dockerfile: Dockerfile.prod
```

Made changes to [app.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/app.py) and added `with app.app_context():`

Docker compose Up.

When we open the backend port in browser we see “The server encountered an internal error and was unable to complete your request. Either the server is overloaded or there is an error in the application.” To resolve this, I first ran /bin/db/connect

![image](assets/WeekX_9_Connect.png)

Let’s run /bin/backend/build and then /bin/backend/push

https://api.roopish-awssolutions.com/api/health-check should show success

https://api.roopish-awssolutions.com/api/activities/home is showing “upstream request timeout”

We go to gitpod and run 

export PROD_CONNECTION_URL=”postgresql://crudderroot:mypwd@cruddur-cfninstance.clfhiua4ipmt.us-east-1.rds.amazonaws.com:5432/cruddur” and we also do gp env of this env variable. When I run /bin/db/connect I still get an error.

Click on Security group for the RDS ‘cruddur-cfninstance’ and edit inbound rules

![image](assets/WeekX_10_RDSInboundRules.PNG)

In gitpod we try to update this Security group rule id

![image](assets/WeekX_10_SecGrp.png)

Get the Security groupID from 

![image](assets/WeekX_10_SecGrp2.png)

```bash
export DB_SG_RULE_ID="sgr-02b24424aa4f36a0b"
gp env DB_SG_RULE_ID="sgr-016e8e24324f56bde"

export DB_SG_ID="sg-080460126713955c1"
gp env DB_SG_ID="sg-080460126713955c1"
export GITPOD_IP=$(curl [ifconfig.me](http://ifconfig.me/))
```

Run the above commands and then 

![image](assets/WeekX_11_Updatesg.png)

In AWS console, you should see the updated IP address

![image](assets/WeekX_11_UpdatedGitpodID.PNG)

We login to our production DB /bin/db/connect/prod

![image](assets/WeekX_12_LoggedInProd.PNG)

![image](assets/WeekX_12_SchemaLoadprod.PNG)

We login to cruddurcfn and check the columns of table ‘users’ and see that bio column is missing. So we run the migrate command and assigning production connectional URL as seen below

![image](assets/WeekX_12_Migrateprod.PNG)

Login to  database to check the columns of users table

![image](assets/WeekX_12_Column_bio_prod.PNG)

## **Modify the lambda function cruddur-post-confirmation to connect to the New RDS DB : cruddur-cfninstance**

- The Lambda Function - *cruddur-post-confirmation* is invoked through the AWS Cognito which is used when a new user signs up or an existing user signs in to our cruddur app.
- The following change are implemented in the Lambda Function - *cruddur-post-confirmation* so that it connects to the New RDS DB : **cruddur-cfninstance.**
    - Edited the connection url in Environment Variable as seen below.
    
      ![image](./assets/WeekX_13_ConnURLNewRDSDB.PNG)
    

 • A New Security Group, CognitoLambdaSG is created containing with an Outbound Rule with ALLTRAFFIC 0.0.0.0/0 and no rules on Inbound and attach the Lambda Function to the VPC : CrdNetVPC created through CFN so that Lambda Function can access the New RDS DB : cruddur-cfninstance, which is also attached to CrdNetVPC.

![image](./assets/WeekX_14_LambdaVPCSG.PNG)

We also modified Lambda code from cur.execute(sql,*params) to cur.execute(sql,params).

## **Use CORS for Service**

• The parameters - EnvFrontendUrl ='https://roopish-awssolutions.com’ and EnvBackendUrl = '[https://api.roopish-awssolutions.com](https://api.roopish-awssolutions.com/)' are passed to the CFN Service stack by updating [aws/cfn/service/config.toml](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/aws/cfn/service/config.toml) NOTE: During office hours because I had issues with resolving 504 error, we changed the `EnvFrontendUrl='*'` and `EnvBackendUrl ='*'`
• The Service stack is executed again by running the script [./bin/cfn/service](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/bin/cfn/service)

![image](./assets/WeekX_14_CFNCrdSrvBackendFlask.PNG)

## **CICD Pipeline and Create Activity**

- We created another cognito user by signing up in the application and make a Crud message with the new cognito user.(I tested this locally as my prod is not working)
- We made changes to ActivityForm.js to update hardcoded user handle with new cognito user
- We also tested new cognito user in the local development environment by connecting with local postgres db and the same is done by pointing Dockerfile to local db by making relevant changes in the docker-compose.yaml file and get it into run by docker compose up.
- We seed the data into local db by executing the file ./bin/db/setup and we update the cognito_user_id by running the script ./bin/db/update_cognito_user_ids
- Changes needed to be done in the Activityform.js : added the `getAccessToken()` function import from `../lib/CheckAuth`
- Retrieved the access token using `getAccessToken()` and added it to the `Authorization` header of the POST request.
- Updated [aws/cfn/cicd/config.toml](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/aws/cfn/cicd/config.toml) by adding my Github repo name and ArtifactBucketName

![image](./assets/WeekX_15_CodePipeline1.PNG)

![image](./assets/WeekX_15_CodePipeline2.PNG)

## **Refactor to use JWT Decorator in Flask App**

- We created a decorator for JWT verification by changing the code in app.py ./backend-flask/app.py and backend-flask/lib/cognito_jwt_token.py.

```
from flask import request, g
```

- Replaced the `CognitoJwtToken` with

```
from lib.cognito_jwt_token import jwt_required
```

- Updated the `data_message_groups`, `data_messages`, `data_create_message`, `data_home`, `data_activities`, and `data_update_profile` functions to use the `jwt_required` decorator.
- In `frontend-react-js/src/components/ReplyForm.js`, added a new event handler `close` to handle closing the popup form.

  `const close = (event)=> {
    if (event.target.classList.contains("reply_popup")) {
      props.setPopped(false)
    }
  }`

- Added the `reply_popup` class to the wrapping div to apply styling for the reply popup.

## Refactor App.py

Several changes were made to [app.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/app.py) 

1) Imported and initialized various libraries and modules such as `init_rollbar`, `init_xray`, `init_cors`, and `init_cloudwatch`

2) Updated the routes to use the `model_json` function to handle the response data.

3) Added a new file [backend-flask/lib/cloudwatch.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/lib/cloudwatch.py) that defines the `init_cloudwatch` function for configuring the logger to use CloudWatch for logging.

4) Added a new file [`backend-flask/lib/cors.py`](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/lib/cors.py) that defines the `init_cors` function for initializing CORS with Flask.

5) Added a new file [`backend-flask/lib/honeycomb.py`](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/lib/honeycomb.py) that defines the `init_honeycomb` function for initializing tracing and instrumentation with Flask using Honeycomb.

6) Added a new file [`backend-flask/lib/rollbar.py`](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/lib/rollbar.py) that defines the `init_rollbar` function for initializing Rollbar error reporting with Flask.

7) Added a new file [`backend-flask/lib/xray.py`](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/lib/xray.py) that defines the `init_xray` function for configuring AWS X-Ray for tracing with Flask.

8) Made these changes to frontend-react-js/src/pages/NotificationsFeedPage.js a)Imported the `checkAuth` and `getAccessToken` functions from `lib/CheckAuth` b) Updated the `loadData` function to call `getAccessToken` before making the API request and retrieve the access token from `localStorage`.

## **Refactor Flask Routes**

We have refactored the " Routes" by creating separate python files for [users.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/routes/users.py), [general.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/routes/general.py), [messages.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/routes/messages.py) and [activities.py](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/routes/activities.py) which are referenced in the app.py using import statement

## **Implement Replies for Posts**

Generate a migration file to change the field `reply_to_activity_uuid` from integer to uuid in the db schema by running the script `./bin/generate/migration reply_activity_uuid_to_string`

![image](./assets/WeekX_16_Migration.PNG)

Made changes to [`backend-flask/db/sql/activities/home.sql`](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/db/sql/activities/home.sql)

In [backend-flask/db/sql/show.sql](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/db/sql/activities/show.sql) we added a subquery in the SELECT statement to retrieve replies for each activity and also this subquery is aliased as `replies` and returned as a JSON array of objects named `replies` in the main query result

In `backend-flask/db/sql/activities/object.sql` we added the `reply_to_activity_uuid` field in the SELECT statement to retrieve the reply's activity UUID.

Migrations: The `set_last_successful_run()` and `get_last_successful_run()` functions in the `bin/db/migrate` and `bin/db/rollback` scripts were modified to convert the last successful run time to/from an integer for consistency.

Generation: The `bin/generate/migration` script now generates a migration file based on the provided class name (`{klass}Migration`).

Made changes to `frontend-react-js/src/components/ActivityItem.css` and added new styles for the replies section, including padding and background color.

## **Error Handling for the app**

There were several changes made to the code

1. Changes to [backend-flask/db/sql/activities/home.sql](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/db/sql/activities/home.sql) and [backend-flask/db/sql/activities/show.sql](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/db/sql/activities/show.sql)
2. For both backend-flask/services/create_message.py and backend-flask/services/create_reply.py, error message was updated from `message_exceed_max_chars` to `message_exceed_max_chars_1024`
3. A new CSS class called **.activity_feed_primer** has been added to `frontend-react-js/src/components/ActivityFeed.css`
4. In `frontend-react-js/src/components/ActivityFeed.js`, we added a message when there are no activities to show

```bash
if (props.activities.length === 0){
content = <div className='activity_feed_primer'>
<span>Nothing to see here yet.</span>
</div>
} else
```

5. In `frontend-react-js/src/components/ActivityForm.js`, error messages are now displayed using a new component called `FormErrors` and we use post request helper function.
6. In `frontend-react-js/src/components/FormErrorItem.js`, a new component has been added to render individual error messages

```bash
export default function FormErrorItem(props) {
const render_error = () => {
switch (props.err_code)  {
case 'generic_500':
return "An internal server error has occurred."
case 'generic_403':
return "You are not authorized to perform this action."
case 'generic_401':
return "You are not authenticated to perform this action."
// Replies
case 'cognito_user_id_blank':
return "The user was not provided."
case 'activity_uuid_blank':
return "The post id cannot be blank."
case 'message_blank':
return "The message cannot be blank."
case 'message_exceed_max_chars_1024':
return "The message is too long, it should be less than 1024 characters."
// Users
case 'message_group_uuid_blank':
return "The message group cannot be blank."
case 'user_receiver_handle_blank':
return "You need to send a message to a valid user."
// Profile
case 'display_name_blank':
return "The display name cannot be blank."
default:
// In the case for errors returned from Cognito, they
// directly return the error so we just display it.
return props.err_code
}
}
return (
  <div className="errorItem">
    {render_error()}
  </div>
)
}
```

7. In `frontend-react-js/src/components/FormErrors.css`, a new CSS file has been added to display the form errors.
8. In `frontend-react-js/src/components/FormErrors.js`, a new component has been added to render a list of form errors.
9. In `frontend-react-js/src/components/MessageForm.js`, error handling for sending a new message has been updated to use a post request function and handle errors. Also the error messages are now displayed using the FormErrors component.
10. In `frontend-react-js/src/lib/Requests.js`, created a new file to hold helper functions for making HTTP requests. We also implemented request function to handle common logic for making requests. We also export post, put, get, and destroy functions to handle different HTTP methods.
11. In `frontend-react-js/src/pages/HomeFeedPage.js`, we added imports for get and checkAuth. Also, modified the loadData function to use the get function from lib/Requests.
12. In `frontend-react-js/src/pages/MessageGroupNewPage.js`, added import for get and checkAuth. Also, modified the loadUserShortData and loadMessageGroupsData functions to use the get function from the lib/Requests.
13. In `frontend-react-js/src/pages/MessageGroupPage.js`, added import for get and checkAuth. Also, modified the loadMessageGroupsData function to use the get function from the lib/Requests.

## **Activity Show Page**

1. In `backend-flask/db/migrations/16885335723217552_reply_to_activity_uuid_to_string.py`, changed the data type of the reply_to_activity_uuid column in the activities table from integer to uuid. Then the rollback changes it back.
2. In `backend-flask/db/sql/activities/show.sql`, updated the SQL query to use a subquery and return the result as the activity field.
3. In `backend-flask/routes/activities.py`, removed the data_show_activity route.
4. In `backend-flask/routes/users.py`, we added a new route data_show_activity to retrieve a specific activity for a user.
5. In `frontend-react-js/src/App.js`, we added a new route ActivityShowPage to display a specific activity.
6. In `frontend-react-js/src/components/ActivityActionLike.js`, `frontend-react-js/src/components/ActivityActionReply.js``, `frontend-react-js/src/components/ActivityActionRepost.js`,  `frontend-react-js/src/components/ActivityActionShare.js` we added event.preventDefault() to prevent the default behavior of the click event.
7. In `frontend-react-js/src/components/ActivityContent.css`, we changed the CSS selector from .activity_content a.activity_identity to .activity_content .activity_identity.
Modified the styles for .activity_identity and its child elements.
8. In `frontend-react-js/src/components/ActivityContent.js`, we replaced the <div> element with a <Link> component for the activity_avatar element.
Modified the structure and classes of the activity_identity element.
9. In `frontend-react-js/src/components/ActivityForm.js`, refactored the post function call to include an options object instead of individual parameters.
Added a success property with a callback function to handle the successful response.
10. In `frontend-react-js/src/components/ActivityItem.css`, added styles for the .activity_item class and its :hover state.
11. In `frontend-react-js/src/components/ActivityItem.js`, import the Link component from react-router-dom. Also, wrap the entire ActivityItem component with a Link component to create a clickable link to the activity and remove the replies variable, which was previously used to render replies within the component.
12. In `frontend-react-js/src/components/MessageForm.js`, refactored the post function call to include an options object instead of individual parameters. Also, added a success property with a callback function to handle the successful response.
13. In `frontend-react-js/src/components/ProfileForm.js`, refactored the put function call to include an options object instead of individual parameters. Also, added a success property with a callback function to handle the successful response.
14. Both `frontend-react-js/src/components/Replies.css` and `frontend-react-js/src/components/Replies.`s, define the styles and component for rendering replies to an activity.
15. In ReplyForm.js, we added a new options parameter to the post function call in the onsubmit function.
16. In Requests.js, updated the post function to accept the options parameter. Updated the request function to handle the options parameter and use it for error handling and authentication.
17. Renamed the file from HomeFeedPage.js to ActivityShowPage.js. We also updated the import statements to match the renamed file and made changes to loadData function to fetch a specific activity using the handle and activity_uuid parameters from the URL. Also updated the JS code to render the fetched activity and its replies using the ActivityItem and Replies components.
18. In HomeFeedPage.js, we updated the loadData function to fetch activities with authentication and removed the setActivities prop from the ReplyForm component.
19. In MessageGroupNewPage.js, updated the loadUserShortData and loadMessageGroupsData functions to fetch data with authentication.
20. In MessageGroupsPage.js, updated the loadData function to fetch message groups with authentication.
21. In NotificationsFeedPage.js, updated the loadData function to fetch notifications activities with authentication.
22. In UserFeedPage.js, updated the loadData function to fetch user activities without authentication.

## Clean Up - part 1 & 2

1. We want to see data from another user in our application and so we need to seed data through the file - [seed.sql](https://github.com/DataCleansingEnthusiast/aws-bootcamp-cruddur-2023/blob/main/backend-flask/db/seed.sql) by making the following additions and then login to the local postgres db : cruddur , by using the command ./bin/db/connect and inserting manually the sql command that were added in the seed.sql as below

```sql
  (SELECT uuid from public.users WHERE users.handle = 'roopish1' LIMIT 1),
    'I am the other user!',    
    current_timestamp + interval '1 day'
  );
```

After login to the application, we get to see the see data from two users on the " Home" page.

1. In `/frontend-react-js/src/pages/ActivityShowPage.js`, changes were made so that status page shows "Crud" at the top instead of "Home". Back Button Arrow is also added which when pressed takes us to the "Home" page of the application by making changes in the activityshowpage.js and activityshowpage.css. 
2. Exact time is also rendered by making changes in the file to `/frontend-react-js/src/components/ActivityItem.js` ![image](WeekX_89_ExactTime.PNG)
3. Our migration has not been successful on checking our local db -cruddur where the "reply_to_activitiy_uuid" still reflects as type " Integer" instead of "uuid". So we rerun `./bin/db/migrate`
4. We rerun `./bin/db/setup` to make sure everything correct. Below are some screenshots before and after running setup
![image](./assets/WeekX_91_BeforeRunningSetUp.PNG)
![image](./assets/WeekX_91_RunSetUp.PNG)
![image](./assets/WeekX_91_AfterRunningSetUp.PNG)
![image](./assets/WeekX_91_AfterLoggingIn.PNG)
5. We create a new file `./frontend-react-js/src/components/ActivityShowItem.js`. We make changes to ActivityItem.css and ActivitiyContent.css to further fine tune the rendering of pages.
6. Override the connection_url to Prod_connectionurl to run the migrate script. `CONNECTION_URL=$PROD_CONNECTION_URL ./bin/db/migrate`
7. We check the whether the migration has run properly or not logging into the Prod database by the command ./bin/db/connect prod and get to see the following output where the type is changed to uuid, thereby making it possible for us to generate replies in the application. ![image](./assets/WeekX_90_ConnectToProd.PNG)
8. We roll out backend Change, we run a CICD pipeline to merge the " main" branch into "prod". 

      ![image](./assets/WeekX_100_MergeMainToProd_1.PNG)

      ![image](./assets/WeekX_100_MergeMainToProd_2.PNG)

9. Rolling out the frontend changes in the application is through a sync tool. ![image](./assets/WeekX_101_Frontend_Sync.PNG) `./bin/frontend/static-build` is executed after correcting the errors that we encounter and post the successful build.  ![image](./assets/WeekX_102_Frontend_Build.PNG)
10. We run the sync file  ./bin/frontend/sync and it is executed after correcting error by doing the change of adding changeset.json in the erb/sync.env.erb file        ![image](./assets/WeekX_103_Sync.GIF)
11. This generates a changeset file i.e. an invalidation file on the cloudfront as shown below. ![image](./assets/WeekX_103_Invalidation.PNG)
12. We run the Production Dynamodb Database , CrdDdb-DynamoDBTable-12ZX6Z3TOW6KN in the local environment to check whether it runs properly or not before running it in Production environment ![image](./assets/WeekX_105_CheckLatestRev_DDBTbl.PNG)
13. We created a role " machineuser" using a CFN template that has permissions to read and write into the Production DynamoDB Table - CrdDdb-DynamoDBTable-12ZX6Z3TOW6KN 
      ![image](./assets/WeekX_108_Machineuser1.PNG)
      ![image](./assets/WeekX_108_Machineuser2.PNG)
      ![image](./assets/WeekX_108_Machineuser3.PNG)
      ![image](./assets/WeekX_108_Machineuser4_accesskey1.PNG)
      ![image](./assets/WeekX_108_Machineuser4_accesskey2.PNG)
      ![image](./assets/WeekX_108_Machineuser4_accesskey3.PNG)
      ![image](./assets/WeekX_108_Machineuser4_accesskey4.PNG)
      ![image](./assets/WeekX_108_Machineuser4_ReleaseChange.PNG)

**Note**: If I didn’t have issues with 504 error in production, I should have been able to save the messages in DynamoDB table. In production, I am able to see the Profile avatar picture but not messages. When I inspect the page I see a 504 error. So, to demonstrate that my app works locally I tried to create messages. Please see screenshots of Cruds and how it’s stored in tables.

14. Locally post reply on the app and check whether it is saved to Database. 
![image](./assets/WeekX_110_ReplyTest.gif) 
![image](./assets/WeekX_110_ReplyCheckDB.PNG)

Check with Alternate user ![image](./assets/WeekX_110_AltUserTest.gif)
