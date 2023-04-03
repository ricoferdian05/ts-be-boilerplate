const SendInBlue = {
  ApiClient: {
    instance: {
      authentications: {
        'api-key': {
          apiKey: 'randomapikey',
        },
      },
    },
  },
  TransactionalEmailsApi: function () {
    return {
      sendTransacEmail: async (_params) => 'Email sent successfully',
    };
  },
  SendSmtpEmail: function () {
    return {
      subject: '',
      sender: {
        name: '',
        email: '',
      },
      to: [],
      htmlContent: '',
    };
  },
};

export default SendInBlue;
