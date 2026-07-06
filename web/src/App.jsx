import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { LandingPage } from './Features/Landing/landing.pages';
import { authRouteElements } from './Features/Auth/routes/auth.routes';
import { dashboardRouteElements } from './Features/Dashboard/routes/dashboard.routes';
import { marketingRouteElements } from './Features/Marketing/routes/marketing.routes';
import PublicStatusPage from './Features/StatusPages/pages/public-status.pages';
import InviteAcceptPage from './Features/Team/pages/invite-accept.pages';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/status/:slug" element={<PublicStatusPage />} />
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        {marketingRouteElements}
        {authRouteElements}
        {dashboardRouteElements}
      </Routes>
    </Router>
  );
}

export default App;
