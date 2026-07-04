import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './landing/LandingPage.jsx';
import PrivacyPage from './PrivacyPage.jsx';
import CabinetLayout from './app/CabinetLayout.jsx';
import Enter from './app/Enter.jsx';
import Today from './app/Today.jsx';
import Money from './app/Money.jsx';
import Settings from './app/Settings.jsx';
import Onboarding from './app/Onboarding.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Вход по одноразовой ссылке — без оболочки кабинета */}
      <Route path="/app/enter" element={<Enter />} />

      {/* Кабинет: оболочка с гардом авторизации, вложенные вкладки */}
      <Route path="/app" element={<CabinetLayout />}>
        <Route index element={<Today />} />
        <Route path="money" element={<Money />} />
        <Route path="settings" element={<Settings />} />
        <Route path="onboarding" element={<Onboarding />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
