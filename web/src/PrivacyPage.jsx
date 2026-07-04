import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './design/components/controls/Button.jsx';
import logoWine from './assets/logo-tile-wine.png';
import { CONTACT_EMAIL, FOUNDER_TG, FOUNDER_TG_URL } from './config.js';

const SECTIONS = [
  {
    h: '1. Кто обрабатывает данные',
    p: [
      'Сервис «Подхват AI+» — ИИ-администратор для стоматологических клиник. Оператором обработки персональных данных выступает владелец сервиса (далее — «мы»). Контакты для обращений указаны в разделе 8.',
    ],
  },
  {
    h: '2. Какие данные мы собираем',
    list: [
      'С формы заявки на сайте: имя, название клиники, номер телефона, город. Эти данные вы указываете добровольно, чтобы мы связались с вами.',
      'При работе сервиса в клинике: номер телефона пациента, время звонка, повод обращения и переписка с ассистентом «Анна», необходимые, чтобы записать пациента.',
      'Технические данные сайта: обезличенная статистика посещений через Яндекс.Метрику (если подключена) — для улучшения сайта.',
    ],
  },
  {
    h: '3. Чего мы НЕ собираем',
    list: [
      'Диагнозы, истории болезни и иные медицинские подробности. Ассистент «Анна» не запрашивает их, а в карточку лида попадают только повод и контакт — чувствительные фразы вычищаются до записи.',
      'Пароли: вход в кабинет — по одноразовой ссылке через Telegram-бот, регистрации с паролем нет.',
    ],
  },
  {
    h: '4. Зачем мы обрабатываем данные',
    list: [
      'Чтобы связаться с вами по заявке и подключить клинику.',
      'Чтобы подхватывать пропущенные звонки, вести диалог с пациентом и доводить до записи.',
      'Чтобы показывать владельцу клиники статистику и возвращённые средства.',
    ],
  },
  {
    h: '5. Где хранятся данные (152-ФЗ)',
    p: [
      'Персональные данные граждан РФ хранятся и обрабатываются на серверах, расположенных на территории Российской Федерации, в соответствии с Федеральным законом № 152-ФЗ «О персональных данных». Диалоги обрабатываются российской моделью GigaChat. Данные не передаются за пределы страны и третьим лицам, кроме случаев, необходимых для оказания услуги (например, российский SMS-провайдер) или предусмотренных законом.',
    ],
  },
  {
    h: '6. Сколько храним',
    p: [
      'Данные заявки храним до завершения переговоров и в течение срока, необходимого для исполнения договора. Данные пациентов клиники храним, пока действует подключение клиники, после чего удаляем или обезличиваем.',
    ],
  },
  {
    h: '7. Ваши права',
    list: [
      'Запросить, какие данные о вас мы храним.',
      'Потребовать исправить или удалить их.',
      'Отозвать согласие на обработку. Выгрузка и удаление базы клиники — по запросу.',
    ],
  },
  {
    h: '8. Как с нами связаться',
    p: [
      `По любым вопросам обработки данных и для реализации ваших прав напишите нам: ${CONTACT_EMAIL} или в Telegram ${FOUNDER_TG}.`,
    ],
  },
  {
    h: '9. Cookies и аналитика',
    p: [
      'Сайт может использовать Яндекс.Метрику для обезличенной статистики посещений. Вы можете отключить cookies в настройках браузера — это не помешает оставить заявку.',
    ],
  },
];

export default function PrivacyPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, gap: 16 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <img src={logoWine} alt="" width={36} height={39} style={{ borderRadius: 9 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: 'var(--text)' }}>
              Подхват<span style={{ color: 'var(--text-gold)' }}> AI+</span>
            </span>
          </Link>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" icon="return">На главную</Button>
          </Link>
        </div>
      </header>

      <main className="container" style={{ maxWidth: 760, padding: '48px 24px 80px', flex: 1 }}>
        <h1 className="h1" style={{ fontSize: 'clamp(30px, 5vw, 40px)' }}>Политика конфиденциальности</h1>
        <p className="caption" style={{ fontSize: 16, marginTop: 10 }}>
          Коротко и честно: какие данные мы собираем, зачем и как их защищаем. Действует для сайта и сервиса «Подхват&nbsp;AI+».
        </p>

        {SECTIONS.map((s) => (
          <section key={s.h} style={{ marginTop: 32 }}>
            <h2 className="h3" style={{ marginBottom: 10 }}>{s.h}</h2>
            {s.p?.map((t, i) => (
              <p key={i} style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 10px' }}>{t}</p>
            ))}
            {s.list && (
              <ul style={{ margin: '4px 0 0', paddingLeft: 22, display: 'grid', gap: 8 }}>
                {s.list.map((t, i) => (
                  <li key={i} style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{t}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <p className="caption" style={{ fontSize: 15, marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          Остались вопросы по данным? Напишите основателю:{' '}
          <a href={FOUNDER_TG_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-gold)' }}>{FOUNDER_TG}</a>.
        </p>
      </main>
    </>
  );
}
