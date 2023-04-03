import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongoServer;

export const TestMongo = {
  async start() {
    mongoServer = await MongoMemoryReplSet.create();
    await mongoose.connect(mongoServer.getUri());
  },
  async clearAll() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  },
  async stop() {
    if (!mongoServer) throw new Error('Must start mongo server first');
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  },
};
