export default {
  APP_ENV: process.env.APP_ENV,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  PROJECT_ID: process.env.PROJECT_ID,
  JWT: {
    SECRET: process.env.TMS_JWT_SECRET,
  },
  MONGO: {
    URI: process.env.TMS_MONGODB_URI,
  },
  GOOGLE_CLOUD_STORAGE: {
    URI: process.env.TMS_FILE_STORAGE_URI,
    BUCKET: process.env.TMS_FILE_STORAGE_BUCKET,
  },
  SENDINBLUE: {
    API_KEY: process.env.SENDINBLUE_API_KEY,
  },
  TMS_WEB: {
    BASE_URL: process.env.TMS_WEB_BASE_URL,
  },
  HZN: {
    ASSET_BASE_URL: process.env.HZN_ASSET_BASE_URL,
  },
};
