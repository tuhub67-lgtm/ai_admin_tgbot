import React from 'react';
import { OrnamentSolar } from '../components/core/BearMark.jsx';

/* Шаблоны постов: 9:16 (1080×1920) и 1:1 (1080×1080).
   Рисуются в натуральном размере, масштабируются обёрткой (scale).
   Орнамент — разрешён: соцсети = «обложки», прозрачность ≤6%. */

function PostFrame({ w, h, scale = 0.3, children, style }) {
  return (
    <div style={{ width: w * scale, height: h * scale, flex: 'none', position: 'relative', ...style }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

/* 9:16 «кейс-цифра» — мотив Прибыль. Винный фон, золотая цифра. */
export function SocialPost916({ scale = 0.3, clinic = 'клиника «Жемчуг»', sum = '47 200', note = 'вернул ИИ-администратор за неделю', style }) {
  return (
    <PostFrame w={1080} h={1920} scale={scale} style={style}>
      <div style={{ width: 1080, height: 1920, background: '#6F0D1E', color: '#FCF2DC', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <OrnamentSolar size={880} strokeWidth={2} style={{ position: 'absolute', right: -300, bottom: -260, color: '#FCF2DC', opacity: .05 }} />
        {/* шапка */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '88px 96px 0' }}>
          <img src="assets/logo-tile-ivory.png" alt="" width="112" height="121" style={{ display: 'block', borderRadius: 24 }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, letterSpacing: '.02em' }}>Подхват AI+</div>
        </div>
        {/* центр */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 96px', position: 'relative' }}>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#E7C258' }}>{clinic} · неделя</div>
          <div className="tnum" style={{ fontFamily: 'var(--font-display)', fontSize: 190, lineHeight: 1.02, fontWeight: 800, letterSpacing: '-0.02em', color: '#E7C258', fontFeatureSettings: "'tnum' 1", marginTop: 28, whiteSpace: 'nowrap' }}>
            {sum}<span style={{ fontWeight: 600, opacity: .9, marginLeft: '.1em' }}>₽</span>
          </div>
          <div style={{ width: 128, height: 8, background: '#E7C258', clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)', margin: '44px 0' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 62, lineHeight: 1.22, fontWeight: 600, maxWidth: 760, textWrap: 'balance' }}>{note}</div>
          <div style={{ fontSize: 40, lineHeight: 1.4, color: 'rgba(252,242,220,.72)', marginTop: 36, maxWidth: 720 }}>
            12 пропущенных подхвачено · 6 пациентов записаны
          </div>
        </div>
        {/* подвал */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, padding: '0 96px 88px' }}>
          <div style={{ fontSize: 38, color: 'rgba(252,242,220,.72)' }}>подхватим пропущенные звонки</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, border: '3px solid rgba(231,194,88,.65)', borderRadius: 20, padding: '20px 36px', fontSize: 38, fontWeight: 600, color: '#E7C258' }}>
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M12 3v10M8 9.5l4 4 4-4" /><path d="M4 15v5h16v-5" /></svg>
            RuStore
          </div>
        </div>
      </div>
    </PostFrame>
  );
}

/* 1:1 «боль → решение» — мотив Покой. Слоновая кость, счёт потери. */
export function SocialPost11({ scale = 0.3, style }) {
  return (
    <PostFrame w={1080} h={1080} scale={scale} style={style}>
      <div style={{ width: 1080, height: 1080, background: '#FCF2DC', color: '#1C1A17', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <OrnamentSolar size={720} strokeWidth={2} style={{ position: 'absolute', right: -240, top: -220, color: '#1C1A17', opacity: .05 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '80px 88px 0', position: 'relative' }}>
          <img src="assets/logo-tile-wine.png" alt="" width="96" height="104" style={{ display: 'block', borderRadius: 20 }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: '#6F0D1E' }}>Подхват AI+</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 88px', position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 84, lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.01em', maxWidth: 880, textWrap: 'balance' }}>
            Один пропущенный звонок — <span className="tnum" style={{ color: '#6F0D1E', fontFeatureSettings: "'tnum' 1" }}>−8 000 ₽</span>
          </div>
          <div style={{ fontSize: 44, lineHeight: 1.4, color: '#5C554A', marginTop: 32, maxWidth: 800 }}>
            Анна подхватит за 30 секунд: напишет пациенту, договорится, запишет. Вы — спокойны.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '0 88px 80px', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#E7C258', color: '#1C1A17', clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)', borderRadius: '16px 0 16px 16px', padding: '22px 40px', fontSize: 40, fontWeight: 600, fontFamily: 'var(--font-display)' }}>
            14 дней бесплатно
          </div>
          <div className="tnum" style={{ fontSize: 38, color: '#5C554A', fontFeatureSettings: "'tnum' 1" }}>
            дальше — <span style={{ textDecoration: 'line-through' }}>4 900</span> <strong style={{ color: '#1C1A17' }}>1 590 ₽/мес</strong>
          </div>
        </div>
      </div>
    </PostFrame>
  );
}
