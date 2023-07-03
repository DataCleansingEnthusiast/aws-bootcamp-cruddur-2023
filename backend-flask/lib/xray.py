import os
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.ext.flask.middleware import XRayMiddleware

def init_xray(app):
    # turned off xray
    # X-RAY2----to start the recorder
    # AWS_XRAY_URL - endpoint where to send the data
    xray_url = os.getenv("AWS_XRAY_URL")
    xray_recorder.configure(service='backend-flask', dynamic_naming=xray_url)
    XRayMiddleware(app, xray_recorder)