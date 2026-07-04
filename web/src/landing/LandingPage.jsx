import { useEffect } from 'react';
import { Header } from './Header.jsx';
import { Hero } from './Hero.jsx';
import { Calculator } from './Calculator.jsx';
import { HowItWorks } from './HowItWorks.jsx';
import { LiveDialog } from './LiveDialog.jsx';
import { TrustSection } from './TrustSection.jsx';
import { Pricing } from './Pricing.jsx';
import { LeadForm } from './LeadForm.jsx';
import { RuStore } from './RuStore.jsx';
import { Faq } from './Faq.jsx';
import { Footer } from './Footer.jsx';
import { initMetrika } from '../lib/metrika.js';

export default function LandingPage() {
  useEffect(() => { initMetrika(); }, []);
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Calculator />
        <HowItWorks />
        <LiveDialog />
        <TrustSection />
        <Pricing />
        <LeadForm />
        <RuStore />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
