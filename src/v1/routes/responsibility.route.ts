import express from 'express';

import auth from '@middlewares/auth';
import validate from '@middlewares/validate';
import { ResponsibilityController } from '@v1-controllers';
import { ResponsibilityValidation } from '@v1-validations';
import { UserEnum, ResponsibilityEnum } from '@definitions';

const router = express.Router();

router.route('/').post(
  auth({
    right: {
      roles: [UserEnum.Role.INTERNAL],
      accessTypes: [ResponsibilityEnum.AccessType.CREATE],
    },
  }),
  validate(ResponsibilityValidation.postResponsibility),
  ResponsibilityController.postResponsibility,
);
router.route('/:formattedResponsibilityId').get(
  auth({
    right: {
      roles: [UserEnum.Role.INTERNAL],
      accessTypes: [ResponsibilityEnum.AccessType.READ],
    },
  }),
  ResponsibilityController.getResponsibilityDetail,
);
router.route('/').get(
  auth({
    right: {
      roles: [UserEnum.Role.INTERNAL],
      accessTypes: [ResponsibilityEnum.AccessType.READ],
    },
  }),
  validate(ResponsibilityValidation.getResponsibilities),
  ResponsibilityController.getResponsibilities,
);
router.route('/:responsiblityId').put(
  auth({
    right: {
      roles: [UserEnum.Role.INTERNAL],
      accessTypes: [ResponsibilityEnum.AccessType.UPDATE],
    },
  }),
  validate(ResponsibilityValidation.putResponsibility),
  ResponsibilityController.putResponsibility,
);

export default router;
