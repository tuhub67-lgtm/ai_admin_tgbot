import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './landing/LandingPage.jsx';
import PrivacyPage from './PrivacyPage.jsx';

// Кабинет (/app) строится в ЭТАПЕ B — пока лёгкая заглушка, чтобы роут существовал.
function CabinetStub() {
  return (
    <div className="container" style={{ padding: '80px 24px', textAlign: 'center', flex: 1 }}>
      <h1 className="h2">Кабинет скоро откроется</h1>
      <p className="caption" style={{ fontSize: 16, marginTop: 12 }}>
        Вход — по одноразовой ссылке через Telegram-бот. Раздел кабинета появится в следующем этапе.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/app/*" element={<CabinetStub />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
