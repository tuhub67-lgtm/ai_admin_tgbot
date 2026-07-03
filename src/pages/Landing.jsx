import React from 'react';
import { Seo } from '../components/common/Seo.jsx';
import { Header } from '../components/landing/Header.jsx';
import { Hero } from '../components/landing/Hero.jsx';
import { Section } from '../components/landing/Section.jsx';
import { LossCalculator } from '../components/landing/LossCalculator.jsx';
import { HowItWorks } from '../components/landing/HowItWorks.jsx';
import { LiveDialog } from '../components/landing/LiveDialog.jsx';
import { Trust } from '../components/landing/Trust.jsx';
import { Pricing } from '../components/landing/Pricing.jsx';
import { LeadForm } from '../components/landing/LeadForm.jsx';
import { RuStoreSection } from '../components/landing/RuStoreSection.jsx';
import { Faq } from '../components/landing/Faq.jsx';
import { Footer } from '../components/landing/Footer.jsx';

export default function Landing() {
  return (
    <>
      <Seo
        title="Подхват AI+ — ИИ-администратор клиники возвращает пациентов с пропущенных звонков"
        description="Клиника теряет 100–150 тыс. ₽ в месяц на пропущенных звонках. Подхват AI+ отвечает за 30 секунд в MAX, SMS и Telegram, доводит до записи и показывает возвращённые рубли. Данные — в России, 152-ФЗ."
      />
      <Header />
      <main>
        <Hero />

        <Section id="calc" bg="var(--surface-subtle)">
          <p className="lp-overline">Калькулятор потерь</p>
          <h2 className="lp-h2">Посчитайте, сколько уносят пропущенные</h2>
          <p className="lp-lead">Двигайте ползунки — считаем по вашим цифрам. Формула открыта, без звёздочек и сносок.</p>
          <div style={{ marginTop: 'var(--sp-8)' }}>
            <LossCalculator />
          </div>
        </Section>

        <HowItWorks />
        <LiveDialog />
        <Trust />
        <Pricing />
        <LeadForm />
        <RuStoreSection />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
