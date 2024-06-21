@app
probot-example-begin

@static

@http
post /api/github/webhooks

@aws
timeout 60   
memory 256
concurrency 10      
region eu-west-2