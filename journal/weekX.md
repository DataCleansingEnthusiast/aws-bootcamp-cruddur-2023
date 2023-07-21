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

![image](assets/WeekX_9_Connect.PNG)

Let’s run /bin/backend/build and then /bin/backend/push

https://api.roopish-awssolutions.com/api/health-check should show success

https://api.roopish-awssolutions.com/api/activities/home is showing “upstream request timeout”

We go to gitpod and run 

export PROD_CONNECTION_URL=”postgresql://crudderroot:mypwd@cruddur-cfninstance.clfhiua4ipmt.us-east-1.rds.amazonaws.com:5432/cruddur” and we also do gp env of this env variable. When I run /bin/db/connect I still get an error.

Click on Security group for the RDS ‘cruddur-cfninstance’ and edit inbound rules

![image](assets/WeekX_10_RDSInboundRules.PNG)

In gitpod we try to update this Security group rule id

![image](assets/WeekX_10_SecGrp.PNG)

Get the Security groupID from 

![image](assets/WeekX_10_SecGrp2.PNG)

```bash
export DB_SG_RULE_ID="sgr-02b24424aa4f36a0b"
gp env DB_SG_RULE_ID="sgr-016e8e24324f56bde"

export DB_SG_ID="sg-080460126713955c1"
gp env DB_SG_ID="sg-080460126713955c1"
export GITPOD_IP=$(curl [ifconfig.me](http://ifconfig.me/))
```

Run the above commands and then 

![image](assets/WeekX_11_Updatesg.PNG)

In AWS console, you should see the updated IP address

![image](assets/WeekX_11_UpdatedGitpodID.PNG)

We login to our production DB /bin/db/connect/prod

![image](assets/WeekX_12_LoggedInProd.PNG)

![image](assets/WeekX_12_SchemaLoadprod.PNG)

We login to cruddurcfn and check the columns of table ‘users’ and see that bio column is missing. So we run the migrate command and assigning production connectional URL as seen below

![image](assets/WeekX_12_Migrateprod.PNG)

Login to  database to check the columns of users table

![image](assets/WeekX_12_Column_bio_prod.PNG)
