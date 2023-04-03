// PLEASE COMMENT THIS LINE IN DEVELOPMENT MODE
//import 'module-alias/register';

import app from './app';
import config from '@config/config';
import { logger } from '@config/logger';

const { APP_ENV, PORT = 8080 } = config;

app.listen(PORT, () => {
  logger.info(`Listening to port http://localhost:${PORT}/ (${APP_ENV})`);
});
