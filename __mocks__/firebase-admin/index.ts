import { driverId } from '../../src/v1/__tests__/fixtures/user';

const FirebaseAdmin = {
  auth: function () {
    return {
      createUser: async function (properties) {
        return Promise.resolve(properties);
      },
      updateUser: async function (uid, properties) {
        if (!uid) return Promise.reject();

        return Promise.resolve(properties);
      },
      verifyIdToken: async function (idToken) {
        // For testing purpose, make 0 is invalid token
        if (idToken === '0') return Promise.reject();

        return Promise.resolve({ uid: driverId });
      },
    };
  },
  initializeApp: function (_credential) {
    return true;
  },
};

export default FirebaseAdmin;
