import { useEffect, useState } from 'react';
import { Button } from '../design/components/controls/Button.jsx';
import logoWine from '../assets/logo-tile-wine.png';
import { BOT_LOGIN_URL } from '../config.js';
import { reachGoal, GOALS } from '../lib/metrika.js';

function scrollToLead(e) {
  e.preventDefault();
  const el = document.getElementById('lead');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: scrolled ? 'color-mix(in srgb, var(--bg) 88%, transparent)' : 'var(--bg)',
        backdropFilter: scrolled ? 'saturate(1.4) blur(10px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
        transition: 'background var(--motion-base), border-color var(--motion-base)',
      }}
    >
      <div
        className="container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 64 }}
      >
        <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <img src={logoWine} alt="" width={38} height={41} style={{ display: 'block', borderRadius: 9 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
            Подхват<span style={{ color: 'var(--text-gold)' }}> AI+</span>
          </span>
        </a>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a
            href={BOT_LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => reachGoal(GOALS.LOGIN_CLICK)}
            style={{ textDecoration: 'none' }}
            className="pk-hide-mobile"
          >
            <Button variant="secondary" size="sm" icon="patient">Войти</Button>
          </a>
          <a href="#lead" onClick={scrollToLead} style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm" icon="return">Подключить клинику</Button>
          </a>
        </nav>
      </div>
    </header>
  );
}
