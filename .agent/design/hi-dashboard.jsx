// Login + Dashboard hi-fi

const HiLogin = () => (
  <div className="hi" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 720 }}>
    <div style={{ padding: '60px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Logo />
      <div style={{ marginTop: 60, maxWidth: 380 }}>
        <h1>Войти</h1>
        <p style={{ marginTop: 10, color: 'var(--fg-2)', fontSize: 15 }}>Без паролей. Пришлём одноразовую ссылку на почту.</p>
        <div style={{ marginTop: 28 }}>
          <label className="label">Email</label>
          <div className="input">
            <I name="mail" size={16} color="var(--fg-3)" />
            <span style={{ color: 'var(--fg-3)' }}>ivan.ivanovich@school42.ru</span>
          </div>
        </div>
        <Btn kind="primary" size="lg" iconRight="arrowRight" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>Получить ссылку</Btn>
        <p style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 16, textAlign: 'center' }}>Нет аккаунта? Просто введите email — создадим автоматически.</p>
      </div>
    </div>
    <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #2952C8 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(245,158,11,0.3) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.15) 0%, transparent 40%)' }}></div>
      <div style={{ position: 'relative', transform: 'rotate(-3deg)', boxShadow: 'var(--shadow-lg)' }}>
        <Doc width={300} height={400} title="Производная сложной функции" />
      </div>
      <div style={{ position: 'absolute', bottom: 40, left: 40, right: 40, color: 'white' }}>
        <div style={{ fontFamily: 'Manrope', fontSize: 22, fontWeight: 600, lineHeight: 1.3 }}>«Раньше тратила субботу. Теперь — 5 минут перед уроком.»</div>
        <div style={{ fontSize: 13, marginTop: 8, opacity: 0.85 }}>Анна Сергеевна, учитель алгебры</div>
      </div>
    </div>
  </div>
);

const HiDashboard = () => (
  <div className="hi" style={{ display: 'flex', minHeight: 800 }}>
    <Sidebar active="home" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Topbar search="Поиск по моим листам…" action={<Btn kind="primary" size="sm" icon="plus">Создать лист</Btn>} />
      <div style={{ padding: '32px 40px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h1>Привет, Иван Иваныч!</h1>
          <Badge kind="accent"><I name="zap" size={12} /> Бесплатный план · 3 / 5 листов</Badge>
        </div>
        <p style={{ color: 'var(--fg-2)', fontSize: 15 }}>Среда, 5 мая · сегодня 4 урока в расписании</p>

        {/* Hero CTA */}
        <div className="card" style={{ marginTop: 24, padding: 28, display: 'flex', alignItems: 'center', gap: 24, background: 'linear-gradient(135deg, var(--primary-soft) 0%, white 60%)', borderColor: 'transparent' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
            <I name="sparkles" size={28} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: 4 }}>Создать новый рабочий лист</h3>
            <p style={{ color: 'var(--fg-2)', fontSize: 14 }}>30–60 секунд от описания темы до готового PDF</p>
          </div>
          <Btn kind="primary" size="lg" iconRight="arrowRight">Поехали</Btn>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
          {[
            ['refresh','Повторить','прошлый «Логарифмы»'],
            ['layers','Каталог','шаблоны коллег'],
            ['clipboard','Проверить','работы учеников'],
            ['upload','Загрузить','свой материал'],
          ].map(([i,t,d]) => (
            <div key={t} className="card card-hover" style={{ padding: 16 }}>
              <I name={i} size={18} color="var(--primary)" />
              <div style={{ fontFamily: 'Manrope', fontWeight: 600, fontSize: 14, marginTop: 8 }}>{t}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{d}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 32 }}>
          {/* Recent worksheets */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3>Последние листы</h3>
              <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>Все листы <I name="arrowRight" size={14} /></span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                ['Производная','10 кл','2 мая','primary'],
                ['Логарифмы','11 кл','3 мая','primary'],
                ['Графики функций','9 кл','5 мая','accent'],
                ['Алгоритмы','8 кл','8 мая','primary'],
                ['Циклы while','8 кл','9 мая','accent'],
                ['Линейные','7 кл','12 мая','primary'],
              ].map(([t,k,d,c],i) => (
                <div key={i} className="card card-hover" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                    <Doc width={150} height={180} title={t} subject={`${k}`} tasks={3} dense />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{t}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <Badge kind={c}>{k}</Badge>
                    <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats card */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16 }}>За май</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <div>
                <div style={{ fontFamily: 'Manrope', fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>23</div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>создано листов</div>
              </div>
              <div>
                <div style={{ fontFamily: 'Manrope', fontSize: 32, fontWeight: 700, color: 'var(--accent)' }}>87</div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>проверок</div>
              </div>
            </div>
            {/* mini bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60, marginTop: 18 }}>
              {[30,55,40,75,60,90,45,80,65,95,70,85,50].map((h,i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 12 ? 'var(--accent)' : 'var(--primary-soft)', borderRadius: 3 }}></div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 6 }}>активность по дням</div>

            <div style={{ marginTop: 18, padding: 12, background: 'var(--surface)', borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Подсказка</div>
              <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4 }}>Загрузи лого школы — оно автоматически появится на всех листах.</div>
              <Btn kind="ghost" size="sm" iconRight="arrowRight" style={{ padding: '4px 0', marginTop: 6 }}>В настройки</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

window.HiLogin = HiLogin;
window.HiDashboard = HiDashboard;
