import express from 'express';
import validate from '@middlewares/validate';
import { AuthController } from '@v1-controllers';
import { AuthValidation } from '@v1-validations';

const router = express.Router();

router.route('/login').post(validate(AuthValidation.postLogin), AuthController.postLogin);

router
  .route('/reset-password/emails')
  .post(validate(AuthValidation.postResetPasswordEmail), AuthController.postResetPasswordEmail);

router.route('/reset-password').patch(validate(AuthValidation.patchResetPassword), AuthController.patchResetPassword);

export default router;
