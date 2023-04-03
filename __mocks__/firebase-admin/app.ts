export const applicationDefault = () => {
  return {
    getAccessToken: function () {
      return Promise.resolve(true);
    },
  };
};
