// Set db
const host = process.env.BARFLOW_MONGO_HOST || 'localhost';

export default {
  env: 'production',
  jwtSecret: '0a6b944d-d2fb-46fc-a85e-0295c986cd9f',
  db: 'mongodb://localhost/barflow-api-production',
  port: 3000
};
