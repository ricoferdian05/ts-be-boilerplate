import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import responsibilityRoute from './responsibility.route';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/responsibilities',
    route: responsibilityRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
