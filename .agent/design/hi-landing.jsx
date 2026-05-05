// Landing page hi-fi
const HiLanding = () => (
  <div className="hi" style={{ width: '100%', minHeight: 900 }}>
    {/* Top nav */}
    <div style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <Logo />
        <div style={{ flex: 1, display: 'flex', gap: 24, marginLeft: 32 }}>
          <span style={{ fontSize: 14, color: 'var(--fg-2)', fontWeight: 500 }}>Возможности</span>
          <span style={{ fontSize: 14, color: 'var(--fg-2)', fontWeight: 500 }}>Каталог</span>
          <span style={{ fontSize: 14, color: 'var(--fg-2)', fontWeight: 500 }}>Цены</span>
          <span style={{ fontSize: 14, color: 'var(--fg-2)', fontWeight: 500 }}>FAQ</span>
        </div>
        <Btn kind="ghost" size="sm">Войти</Btn>
        <Btn kind="primary" size="sm">Создать лист</Btn>
      </div>
    </div>

    {/* Hero */}
    <section style={{ padding: '80px 32px 60px', background: 'linear-gradient(180deg, white 0%, var(--surface) 100%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div>
          <Badge kind="primary"><I name="zap" size={12} /> Для учителей математики и информатики</Badge>
          <h1 style={{ fontSize: 56, marginTop: 20, marginBottom: 20, lineHeight: 1.05 }}>
            Рабочий лист<br />за минуту.<br />
            <span style={{ color: 'var(--primary)' }}>Печатай и веди урок.</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--fg-2)', maxWidth: 480, marginBottom: 32 }}>
            Опиши тему — нейросеть соберёт задачи, оформит лист, добавит твоё лого. Скачай PDF. Раздай детям.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <Btn kind="primary" size="lg" icon="sparkles">Создать лист бесплатно</Btn>
            <Btn kind="outline" size="lg" icon="play">Посмотреть пример</Btn>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--fg-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><I name="check" size={14} color="var(--success)" /> 5 листов в месяц бесплатно</span>
            <span>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><I name="check" size={14} color="var(--success)" /> Без карты</span>
          </div>
        </div>
        {/* Visual: stacked docs with floating chips */}
        <div style={{ position: 'relative', height: 460 }}>
          <div style={{ position: 'absolute', top: 30, right: 80, transform: 'rotate(4deg)', boxShadow: 'var(--shadow-lg)' }}>
            <Doc width={240} height={320} title="Логарифмы · вариант 2" subject="Алгебра · 11" tasks={4} />
          </div>
          <div style={{ position: 'absolute', top: 60, left: 30, transform: 'rotate(-3deg)', boxShadow: 'var(--shadow-lg)' }}>
            <Doc width={250} height={340} title="Производная сложной функции" subject="Алгебра · 10" tasks={5} />
          </div>
          <div style={{ position: 'absolute', top: 0, right: 0, background: 'white', padding: '8px 14px', borderRadius: 999, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
            <I name="sparkles" size={14} color="var(--accent)" /> Теория с пропусками
          </div>
          <div style={{ position: 'absolute', bottom: 80, right: 20, background: 'white', padding: '8px 14px', borderRadius: 999, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
            <I name="grid" size={14} color="var(--primary)" /> Клетчатое поле
          </div>
          <div style={{ position: 'absolute', bottom: 20, left: 60, background: 'white', padding: '8px 14px', borderRadius: 999, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
            <I name="image" size={14} color="var(--success)" /> Ваше лого
          </div>
        </div>
      </div>
    </section>

    {/* Stats strip */}
    <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[['12k+','листов создано'],['1 240','учителей'],['58 сек','среднее время'],['4.8 / 5','оценка']].map(([n,l],i) => (
          <div key={i} style={{ padding: 28, borderRight: i<3 ? '1px solid var(--border)' : 'none', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Manrope', fontSize: 32, fontWeight: 700 }}>{n}</div>
            <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
    </section>

    {/* How it works */}
    <section className="hi-section">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Badge>★ Как это работает</Badge>
        <h2 style={{ marginTop: 12, marginBottom: 36 }}>От описания до PDF — за минуту</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            ['1','Опиши тему','«Производная сложной функции, 10 класс, 12 задач»', 'edit'],
            ['2','Выбери опции','клетчатое поле, теория с пропусками, ответы отдельно', 'settings'],
            ['3','Скачай PDF','готовый лист с твоим лого — печатай и раздавай', 'download'],
          ].map(([n,t,d,i]) => (
            <div key={n} className="card" style={{ padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <I name={i} size={22} />
              </div>
              <div style={{ fontFamily: 'Manrope', fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', letterSpacing: '0.08em' }}>ШАГ {n}</div>
              <h3 style={{ marginTop: 4, marginBottom: 8 }}>{t}</h3>
              <p style={{ fontSize: 14, color: 'var(--fg-2)' }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="hi-section" style={{ background: 'var(--surface)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Badge>Возможности</Badge>
        <h2 style={{ marginTop: 12, marginBottom: 36 }}>Что внутри листа</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            ['book','Теория с пропусками','для активного конспектирования прямо во время урока'],
            ['grid','Клетчатое поле','место для решений, графиков и черновиков'],
            ['image','Свой логотип','лого школы и водяной знак на каждой странице'],
            ['file','Ответы отдельно','в конце листа или на отдельной странице'],
            ['clipboard','Автопроверка по фото','загрузи работы — получи ведомость в Excel'],
            ['layers','Каталог готовых','тысячи листов от других учителей'],
          ].map(([i,t,d]) => (
            <div key={t} className="card" style={{ padding: 24 }}>
              <I name={i} size={22} color="var(--primary)" />
              <div style={{ fontFamily: 'Manrope', fontWeight: 600, fontSize: 16, marginTop: 12, marginBottom: 4 }}>{t}</div>
              <div style={{ fontSize: 14, color: 'var(--fg-2)' }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Testimonials */}
    <section className="hi-section">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Badge>Отзывы</Badge>
        <h2 style={{ marginTop: 12, marginBottom: 36 }}>Учителя экономят до 4 часов в неделю</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            ['Анна Сергеевна','Учитель алгебры · 18 лет стажа','Раньше тратила субботу на подготовку. Теперь — пять минут перед уроком. И дети довольны, что задачи разные.'],
            ['Михаил Петрович','Учитель информатики · лицей №42','Каталог — это золото. Беру шаблон коллеги, меняю пару задач под свой класс.'],
            ['Елена Викторовна','Заведующая кафедрой','Внедрили на всю кафедру. Качество листов стабильно высокое, дети не скучают.'],
          ].map(([n,r,t],i) => (
            <div key={n} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                {[1,2,3,4,5].map(s => <I key={s} name="star" size={14} color="var(--accent)" />)}
              </div>
              <p style={{ fontSize: 15, color: 'var(--fg)', lineHeight: 1.55, marginBottom: 16 }}>«{t}»</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={n.split(' ').map(w => w[0]).join('').slice(0,2)} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{n}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="hi-section" style={{ background: 'var(--primary)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', color: 'white' }}>
        <h2 style={{ color: 'white', fontSize: 40 }}>Попробовать бесплатно</h2>
        <p style={{ fontSize: 18, marginTop: 12, marginBottom: 28, opacity: 0.85 }}>5 листов в месяц · без карты · без обязательств</p>
        <Btn kind="primary" size="lg" icon="sparkles">Создать первый лист</Btn>
      </div>
    </section>

    {/* Footer */}
    <footer style={{ background: 'var(--surface)', padding: '40px 32px 32px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32 }}>
        <div>
          <Logo />
          <p style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 12, maxWidth: 280 }}>Сервис для учителей математики и информатики. Работает на Claude Haiku.</p>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Продукт</div>
          {['Возможности','Каталог','Цены','API'].map(t => <div key={t} style={{ fontSize: 13, color: 'var(--fg-2)', padding: '4px 0' }}>{t}</div>)}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Поддержка</div>
          {['FAQ','Контакты','Блог','Соцсети'].map(t => <div key={t} style={{ fontSize: 13, color: 'var(--fg-2)', padding: '4px 0' }}>{t}</div>)}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Документы</div>
          {['Условия','Политика','Оферта','Cookies'].map(t => <div key={t} style={{ fontSize: 13, color: 'var(--fg-2)', padding: '4px 0' }}>{t}</div>)}
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: '32px auto 0', paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-3)' }}>
        <div>© 2026 WorksheetAI</div>
        <div>Сделано для русских учителей</div>
      </div>
    </footer>
  </div>
);

window.HiLanding = HiLanding;
