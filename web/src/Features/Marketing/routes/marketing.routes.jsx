import { Route } from 'react-router-dom';
import HelpCenterPage from '../pages/help-center.pages';
import ContactPage from '../pages/contact.pages';
import LegalPage from '../pages/legal.pages';
import SecurityPage from '../pages/security.pages';

export const marketingRouteElements = (
  <>
    <Route path="/help" element={<HelpCenterPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/legal" element={<LegalPage />} />
    <Route path="/security" element={<SecurityPage />} />
  </>
);

export default marketingRouteElements;
