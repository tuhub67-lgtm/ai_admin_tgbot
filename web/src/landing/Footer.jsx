import { Link } from 'react-router-dom';
import { Button } from '../design/components/controls/Button.jsx';
import { Icon } from '../design/components/core/Icon.jsx';
import logoIvory from '../assets/logo-tile-ivory.png';
import { FOUNDER_TG, FOUNDER_TG_URL, CONTACT_EMAIL } from '../config.js';

function scrollToLead(e) {
  e.preventDefault();
  document.getElementById('lead')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const ivory = 'var(--ivory)';
const dim = 'color-mix(in srgb, var(--ivory) 66%, transparent)';

export function Footer() {
  return (
    <footer style={{ background: 'var(--charcoal)', color: ivory, marginTop: 'auto' }}>
      <div className="container" style={{ paddingTop: 56, paddingBottom: 40 }}>
        <div className="pk-footer-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 40, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={logoIvory} alt="" width={40} height={43} style={{ display: 'block', borderRadius: 9 }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
                Подхват<span style={{ color: 'var(--gold-400)' }}> AI+</span>
              </span>
            </div>
            <p style={{ color: dim, fontSize: 16, lineHeight: 1.5, marginTop: 14, maxWidth: 420 }}>
              ИИ-администратор «Анна» для частных стоматологий. Подхватываем пропущенные звонки
              и возвращаем пациентов — в MAX, Telegram и SMS.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px', marginTop: 18, fontSize: 16 }}>
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: ivory, textDecoration: 'none' }}>
                <Icon name="sms" size={18} color="var(--gold-300)" />{CONTACT_EMAIL}
              </a>
              <a href={FOUNDER_TG_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: ivory, textDecoration: 'none' }}>
                <Icon name="telegram" size={18} color="var(--gold-300)" />{FOUNDER_TG}
              </a>
            </div>
          </div>

          <div style={{ justifySelf: 'start' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>Готовы вернуть пациентов?</div>
            <a href="#lead" onClick={scrollToLead} style={{ textDecoration: 'none', display: 'inline-block', marginTop: 14 }}>
              <Button variant="primary" size="lg" icon="return">Подключить клинику</Button>
            </a>
          </div>
        </div>

        <div
          style={{
            display: 'flex', flexWrap: 'wrap', gap: '10px 20px', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 40, paddingTop: 20, borderTop: '1px solid color-mix(in srgb, var(--ivory) 16%, transparent)',
            color: dim, fontSize: 15,
          }}
        >
          <span>© 2026 Подхват AI+ · Сделано в России</span>
          <Link to="/privacy" style={{ color: dim, textDecoration: 'underline' }}>Политика конфиденциальности</Link>
        </div>
      </div>
    </footer>
  );
}
