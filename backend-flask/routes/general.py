from flask import request, g

def load(app):
    #flask health check added week6
    @app.route('/api/health-check')
    def health_check():
        return {'success': True, 'ver': 1}, 200

# rollbar--- commented week6
    @app.route('/rollbar/test')
    def rollbar_test():
        g.rollbar.report_message('Hello World!', 'warning')
        return "Hello World!"