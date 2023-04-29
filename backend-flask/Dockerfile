FROM 192212780887.dkr.ecr.us-east-1.amazonaws.com/cruddur-python:3.10-slim-buster
# Inside container
# make a new folder inside container
WORKDIR /backend-flask

# Outside container -> inside container
# this contains the libraries we want to install to run the app
COPY requirements.txt requirements.txt
# inside container
# this will install python libraries used for the app
RUN pip3 install -r requirements.txt

#Outside container to inside container
# period means everything in the current directory
# first period means everything in /backend-flask which is outside the container
# second period /backend-flask outside container
COPY . .

# environment variable set inside the container
# and will remain set when the container is running


EXPOSE ${PORT}
ENV PYTHONUNBUFFERED=1

# python3 -m flask run --host=0.0.0.0 --port=4567
# -m flag is telling to use flask module
# we are binding to 0.0.0.0
CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0", "--port=4568", "--debug"]
