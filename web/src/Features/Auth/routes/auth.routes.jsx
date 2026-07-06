import { Route } from 'react-router-dom';
import LoginPage from '../pages/login.pages';
import SignupPage from '../pages/signup.pages';
import ForgotPasswordPage from '../pages/forgot-password.pages';
import ResetPasswordPage from '../pages/reset-password.pages';

export const authRouteElements = (
  <>
    <Route path="/auth/login" element={<LoginPage />} />
    <Route path="/auth/signup" element={<SignupPage />} />
    <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/auth/reset-password/:token" element={<ResetPasswordPage />} />
  </>
);

export default authRouteElements;
