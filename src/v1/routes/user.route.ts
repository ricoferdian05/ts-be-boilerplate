import express from 'express';
import auth from '@middlewares/auth';
import validate from '@middlewares/validate';

import { UserController } from '@v1-controllers';
import { UserValidation } from '@v1-validations';
import { ResponsibilityEnum, UserEnum } from '@definitions';

const router = express.Router();

router.route('/').get(
  auth({
    right: {
      roles: [UserEnum.Role.INTERNAL],
      accessTypes: [ResponsibilityEnum.AccessType.READ],
    },
  }),
  validate(UserValidation.getUsers),
  UserController.getUsers,
);

router.route('/internals').post(
  auth({
    right: {
      roles: [UserEnum.Role.INTERNAL],
      accessTypes: [ResponsibilityEnum.AccessType.CREATE],
    },
  }),
  validate(UserValidation.postUserInternals),
  UserController.postUserInternals,
);

router.route('/links').post(
  auth({
    right: {
      roles: [
        UserEnum.Role.INTERNAL,
        UserEnum.Role.CUSTOMER
      ],
      accessTypes: [ResponsibilityEnum.AccessType.CREATE],
    },
  }),
  validate(UserValidation.postUserLinks),
  UserController.postUserLinks,
);

router.route('/links').get(
  auth({
    right: {
      roles: [
        UserEnum.Role.INTERNAL,
        UserEnum.Role.CUSTOMER
      ],
      accessTypes: [ResponsibilityEnum.AccessType.READ],
    },
  }),
  validate(UserValidation.getUserLinks),
  UserController.getUserLinks,
);

router.route('/profile').get(
  auth({
    right: {
      roles: ['*'],
    },
  }),
  UserController.getUserDetails,
);

router.route('/options').get(
  auth({
    right: {
      roles: [
        UserEnum.Role.INTERNAL,
        UserEnum.Role.CUSTOMER,
      ],
      accessTypes: [ResponsibilityEnum.AccessType.READ],
    },
  }),
  validate(UserValidation.getUserOptions),
  UserController.getUserOptions,
);

router.route('/:userId').get(
  auth({
    right: {
      roles: ['*'],
      accessTypes: [ResponsibilityEnum.AccessType.READ],
    },
  }),
  UserController.getUserDetails,
);

export default router;
