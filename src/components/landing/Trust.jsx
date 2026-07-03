import React from 'react';
import { Icon } from '../../design/components/core/Icon.jsx';
import { Button } from '../../design/components/controls/Button.jsx';
import { Section } from './Section.jsx';
import { TG_USERNAME, TG_URL, isPlaceholder } from '../../config.js';

const items = [
  { icon: 'server', title: 'Данные — в России', text: 'Серверы в РФ. База пациентов и записи разговоров не покидают страну — по 152-ФЗ.' },
  { icon: 'lock', title: 'Карточки без диагнозов', text: 'В карточках и в записях диалогов — только повод обращения и контакты. Медицинские детали не храним.' },
  { icon: 'shield', title: 'По договору', text: 'Работаем по договору и с вашего согласия на обработку данных. Шаблоны документов дадим при подключении.' },
  { icon: 'dialog', title: 'Российская модель GigaChat', text: 'Диалоги ведёт российская модель GigaChat (Сбер). Никаких зарубежных облаков.' },
];

export function Trust() {
  const tgPlaceholder = isPlaceholder(TG_USERNAME);
  return (
    <Section bg="var(--surface-subtle)">
      <p className="lp-overline">Покой</p>
      <h2 className="lp-h2">Ничего не потеряно. И никуда не утекло</h2>

      <div
        style={{ display: 'grid', gap: 'var(--sp-4)', marginTop: 'var(--sp-8)', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}
      >
        {items.map((it) => (
          <div key={it.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-card)', padding: 'var(--sp-6)', boxShadow: 'var(--shadow-card)' }}>
            <span
              aria-hidden="true"
              style={{ display: 'inline-flex', width: 48, height: 48, alignItems: 'center', justifyContent: 'center', background: 'var(--surface-brand)', color: 'var(--gold-300)', borderRadius: 'var(--r-card-sm)' }}
            >
              <Icon name={it.icon} size={24} />
            </span>
            <h3 className="h4" style={{ marginTop: 'var(--sp-4)' }}>{it.title}</h3>
            <p style={{ margin: 'var(--sp-2) 0 0', fontSize: 'var(--fs-body)', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{it.text}</p>
          </div>
        ))}
      </div>

      {/* Живой контакт основателя */}
      <div
        className="facet-hero"
        style={{
          marginTop: 'var(--sp-6)', background: 'var(--surface-brand)', color: 'var(--text-on-brand)',
          borderRadius: 'var(--r-card)', padding: 'var(--sp-8)',
          display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-4)', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ maxWidth: '48ch' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h4)', fontWeight: 600 }}>
            За каждым подключением — основатель лично
          </div>
          <p style={{ margin: 'var(--sp-2) 0 0', color: 'var(--gold-200)', fontSize: 'var(--fs-body)', lineHeight: 1.5 }}>
            Не колл-центр и не бот-конструктор. Если что-то пойдёт не так — рядом живой человек, который знает вашу клинику.
          </p>
        </div>
        {tgPlaceholder ? (
          <span style={{ fontSize: 'var(--fs-body)', color: 'var(--gold-200)' }}>
            Написать: {TG_USERNAME}
          </span>
        ) : (
          <Button variant="primary" size="lg" icon="telegram" onClick={() => window.open(TG_URL, '_blank', 'noopener')}>
            Написать основателю
          </Button>
        )}
      </div>
    </Section>
  );
}
