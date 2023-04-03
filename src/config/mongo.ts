import mongoose from 'mongoose';

import config from './config';

let connection: mongoose.Connection;

const Mongo = {
  startConnection: async () => {
    try {
      if (!connection) {
        await mongoose.connect(config.MONGO.URI, {
          autoIndex: false,
        });

        connection = mongoose.connection;
        connection.on('index', function (error) {
          if (error?.message) {
            console.error(error.message);
          }
        });
      }
    } catch (error) {
      console.error(error);
      console.error(`Initial connection to mongodb failed. Shutting down server.`);
      process.exit(1);
    }
  },
};

export { Mongo };
