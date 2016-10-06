import path from 'path';

const db = process.env.DB || 'localhost';

const config = {
  root: path.join(__dirname),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'ssssshhh',
  db: `mongodb://${db}/barflow-api-${process.env.NODE_ENV}`,
  port: process.env.PORT || 3000,
  awsRegion: process.env.AWS_REGION || 'eu-west-1',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
};

export default config;
