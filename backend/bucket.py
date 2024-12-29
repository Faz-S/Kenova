import boto3 

s3 = boto3.resource('s3')
s3.meta.client.upload_file('s.pdf', 'edusage-bucket', 'CN  Unit 1.pdf')