#from aws_xray_sdk.core import xray_recorder
from lib.db import db

class UserActivities:
  # xray2--we do not need segment just need subsegment and need xray capture in app.py
  #segment = xray_recorder.begin_segment('user_activities')

  def run(user_handle):
    print('user_activities run')
    model = {
      'errors': None,
      'data': None
    }

    
    if user_handle == None or len(user_handle) < 1:
      model['errors'] = ['blank_user_handle']
    else:
      sql = db.template('users','show')
      print(sql)
      
      results = db.query_object_json(sql,{'handle': user_handle})
      model['data'] = results

      # xray2 ---
  #   subsegment = xray_recorder.begin_subsegment('mock-data')
  #   dict = {
  #     "now": now.isoformat(),
  #     "results-size": len(model['data'])
  #   }
  #   subsegment.put_metadata('key', dict, 'namespace')
  #   xray_recorder.end_subsegment()
  # finally:
  #   xray_recorder.end_subsegment()
    # x-ray
    return model