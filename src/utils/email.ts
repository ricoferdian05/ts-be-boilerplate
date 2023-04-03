import config from '@config/config';
import { IUserController } from '@v1-definitions';

const emailHtmlTemplate = (title: string, body: string, additionalHead?: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">

    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${additionalHead || ''}
      <title>${title}</title>
    </head>

    <body style="margin:0;padding:0;font-family: Arial, Helvetica, sans-serif; line-height: 21px; letter-spacing: 0.2px; ">
      ${body}
    </body>

    </html>
  `;
};

export const getResetPasswordEmail = (name: string, token: string): string => {
  const url = `${config.TMS_WEB.BASE_URL}/reset-password?token=${token}`;
  const body = `
  <div style="background-color: #000000; padding: 24px 32px 32px 32px;">
    <img src='${config.HZN.ASSET_BASE_URL}/icons/HorizonIconRed.png' height="20px" alt="hzn icon" style="margin: 0 auto; margin-bottom: 24px; display: block;" />
    <div style="background-color: #ffffff; border-radius: 8px; width: 100%;max-width: 700px;margin: 0 auto;">
      <div style="padding: 16px;color:#253858;font-size:14px;">
        <div style="min-height: 400px;">
          <h3 style="margin: 0 auto 24px auto; font-size: 16px; text-align: center;">Reset Your Password</h3>
          <p style="margin: 0">Hi, ${name}. </p>
          <p style="margin: 0">You have requested to reset the password for your account. Please <b>click the button</b> below to reset your password and create a new one</p>

          <a href="${url}" style="color:#FFFFFF; background-color: #DC3931; border-radius: 10px; width: 116px; display: block; text-align: center; text-decoration: none; padding: 8px; margin-bottom: 25px; font-size: 14px; margin: 15px auto">
            Reset Password
          </a>
        </div>
      </div>
      <p style="margin: 0px 0px 20px 0px; color: rgba(0, 0, 0, 0.38); font-size: 12px; text-align: center;">&copy; 2021, PT Horizon Teknologi Indonesia</p>
    </div>
  </div>
  `;

  return emailHtmlTemplate('Reset Password', body);
};

export const getAccountApprovedEmail = (name: string, slug: string): string => {
  const url = `${config.TMS_WEB.BASE_URL}${slug}`;
  const body = `
    <div style="background-color: #000000; padding: 24px 32px 32px 32px;">
      <img src='${config.HZN.ASSET_BASE_URL}/icons/HorizonIconRed.png' height="20px" alt="hzn icon"
        style="margin: 0 auto; margin-bottom: 24px; display: block;" />
      <div style="background-color: #ffffff; border-radius: 8px; width: 100%;max-width: 700px;margin: 0 auto;">
        <div style="padding: 16px;color:#253858;font-size:14px;">
          <div style="min-height: 400px;">
            <h3 style="margin: 0 auto 8px auto; font-size: 16px; font-weight: 600;">Welcome ${name},</h3>

            <p style="margin: 0">Thank you for your registration to our platform and your patience for waiting the approval status of account.</p>

            <div style="width: 45%; color: #22C55E;  margin: 24px auto; text-align: center; padding: 14px 8px 14px 10px; background-color: #e7faef;">
                <img src='${config.HZN.ASSET_BASE_URL}/icons/checklist.png' alt='account-approved' style="vertical-align: bottom; display: inline; margin-right: 19px;" />
                <h2 style="display: inline-block; font-size: 20px; margin:0; padding:0; margin-bottom:5px;">
                ACCOUNT APPROVED
                </h2>
            </div>

            <p> We would like to inform you that <b>your account has been approved!</b></p>
            <p>Now you can sign in and enjoy all of our features.</p>
            <a href="${url}" style="color:#FFFFFF; background-color: #DC3931; border-radius: 10px; width: 140px; display: block; text-align: center; text-decoration: none; padding: 8px; margin-bottom: 25px; font-size: 14px; margin: 15px auto">
              Continue to Sign In
            </a>
          </div>
            <p style="margin: 0px 0px 20px 0px; color: rgba(0, 0, 0, 0.38); font-size: 12px; text-align: center;">&copy; 2021, PT Horizon Teknologi
              Indonesia</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return emailHtmlTemplate('Account Approved', body);
};

export const getAccountCreatedSPEmployeeEmail = (
  data: IUserController.IPostUserRegistrationsSPEmployeeRequest,
  serviceProviderName: string,
  token: string,
): string => {
  const url = `${config.TMS_WEB.BASE_URL}/reset-password?token=${token}`;
  const body = `
    <div style="background-color: #000000; padding: 24px 32px 32px 32px;">
      <img src='${config.HZN.ASSET_BASE_URL}/icons/HorizonIconRed.png' height="20px" alt="hzn icon"
        style="margin: 0 auto; margin-bottom: 24px; display: block;" />
      <div style="background-color: #ffffff; border-radius: 8px; width: 100%;max-width: 700px;margin: 0 auto;">
        <div style="padding: 16px;color:#253858;font-size:14px;">
          <div style="min-height: 400px;">
            <h3 style="margin: 0 auto 8px auto; font-size: 16px; font-weight: 600;">Dear ${data.name},</h3>

            <p style="margin: 0"><b>${serviceProviderName}</b> has been added you as new ${data.responsibility} of their company.<br>Here's your account details :</p><br>

            <table>
              <tr>
                <td>Email Registered</td>
                <td>: <b>${data.email}</b></td>
              </tr>
            </table>

            <p>Now you can login to our platform and if there any questions please don't hesitate to contact us through email at <a href="mailto: admin@hzn.one"
            style="text-decoration: none; color: #3b82f6;">admin@hzn.one</a> and you also contact ${serviceProviderName} directly.</p>

            <a href="${url}" style="color:#FFFFFF; background-color: #DC3931; border-radius: 10px; width: 140px; display: block; text-align: center; text-decoration: none; padding: 8px; margin-bottom: 25px; font-size: 14px; margin: 15px auto">
              Go to Login Page
            </a>
          </div>
            <p style="margin: 0px 0px 20px 0px; color: rgba(0, 0, 0, 0.38); font-size: 12px; text-align: center;">&copy; 2021, PT Horizon Teknologi
              Indonesia</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return emailHtmlTemplate('Account Approved', body);
};

export const getAccountRejectedEmail = (name: string): string => {
  const body = `
    <div style="background-color: #000000; padding: 24px 32px 32px 32px;">
      <img src='${config.HZN.ASSET_BASE_URL}/icons/HorizonIconRed.png' height="20px" alt="hzn icon"
        style="margin: 0 auto; margin-bottom: 24px; display: block;" />
      <div style="background-color: #ffffff; border-radius: 8px; width: 100%;max-width: 700px;margin: 0 auto;">
        <div style="padding: 16px;color:#253858;font-size:14px;">
          <div style="min-height: 400px;">
            <h3 style="margin: 0 auto 8px auto; font-size: 16px; font-weight: 600;">Welcome ${name},</h3>

            <p style="margin: 0">Thank you for your registration to our platform and your patience for waiting the approval status of account.</p>

            <div style="width: 45%; color: #f43e5e;  margin: 24px auto; text-align: center; padding: 14px 8px 14px 10px; background-color: #FEECEF;">
                <img src='${config.HZN.ASSET_BASE_URL}/icons/ClosedRed.png' alt='account-rejected' style="vertical-align: bottom; display: inline; margin-right: 19px;" />
                <h2 style="display: inline-block; font-size: 20px; margin:0; padding:0; margin-bottom:5px;">
                ACCOUNT REJECTED
                </h2>
            </div>

            <p> We would like to inform you that <b>your account has been rejected!</b></p>
            <p>Don’t worry! please contact our customer service at <span style="color: #3b82f6;">+6281234567890</span> so we can help to solve your activation problem.</p>
          </div>
            <p style="margin: 0px 0px 20px 0px; color: rgba(0, 0, 0, 0.38); font-size: 12px; text-align: center;">&copy; 2021, PT Horizon Teknologi
              Indonesia</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return emailHtmlTemplate('Account Rejected', body);
};