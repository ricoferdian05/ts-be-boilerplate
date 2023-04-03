import SendInBlue from 'sib-api-v3-sdk';

import config from './config';

interface ISendEmail {
  subject: string;
  sender: {
    name: string;
    email: string;
  };
  to: {
    email: string;
  }[];
  htmlContent: string;
}

export const senderAccount = {
  name: 'HZN Account',
  email: 'account@hzn.one',
};

export const sendEmail = async (data: ISendEmail) => {
  const defaultClient = SendInBlue.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = config.SENDINBLUE.API_KEY;

  const APIInstance = new SendInBlue.TransactionalEmailsApi();
  const EmailInstance = new SendInBlue.SendSmtpEmail();

  EmailInstance.subject = data.subject;
  EmailInstance.sender = data.sender;
  EmailInstance.to = data.to;
  EmailInstance.htmlContent = data.htmlContent;

  try {
    const resp = await APIInstance.sendTransacEmail(EmailInstance);
    console.log('tms email res: ', resp);
    return resp;
  } catch (error) {
    console.error('tms email error: ', error);
    return error;
  }
};
