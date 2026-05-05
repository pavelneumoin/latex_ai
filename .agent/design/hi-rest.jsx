// Check + Catalog + Settings hi-fi

const HiCheck = () => (
  <div className="hi" style={{ display: 'flex', minHeight: 800 }}>
    <Sidebar active="check" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Topbar action={<Btn kind="primary" size="sm" icon="upload">Загрузить ещё</Btn>} />
      <div style={{ padding: '32px 40px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg-3)', marginBottom: 8 }}>
          <span>Проверки</span>
          <I name="chevronRight" size={14} />
          <span style={{ color: 'var(--fg)' }}>10А — Производная сложной функции</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1>Проверка работ</h1>
            <p style={{ color: 'var(--fg-2)', fontSize: 14, marginTop: 4 }}>24 ученика · 22 загружено · средний балл 4.2</p>
          </div>
          <Btn kind="outline" icon="download">Ведомость в Excel</Btn>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
          {[['Сдали','22 / 24','primary'],['Сред. балл','4.2','accent'],['Отлично','9','success'],['Хорошо','10','primary'],['Ниже','3','error']].map(([t,v,c]) => (
            <div key={t} className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{t}</div>
              <div style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 26, marginTop: 4, color: c==='accent' ? 'var(--accent)' : c==='success' ? 'var(--success)' : c==='error' ? 'var(--error)' : 'var(--primary)' }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16 }}>Ученики</h3>
              <div className="tabs" style={{ padding: 2 }}>
                <span className="tab active" style={{ fontSize: 12, padding: '4px 10px' }}>Все</span>
                <span className="tab" style={{ fontSize: 12, padding: '4px 10px' }}>Проблемы</span>
                <span className="tab" style={{ fontSize: 12, padding: '4px 10px' }}>Не сдали</span>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr><th>Ученик</th><th>Работа</th><th>Балл</th><th>Ошибок</th><th></th></tr>
              </thead>
              <tbody>
                {[
                  ['Алексеев К.','📷 фото','5','0','primary'],
                  ['Борисова М.','📷 фото','5','0','primary'],
                  ['Волков Д.','📷 фото','4','2','primary'],
                  ['Григорьева А.','📷 фото','4','3','primary'],
                  ['Дёмин С.','📷 фото','3','5','accent'],
                  ['Ершова О.','📷 фото','5','1','primary'],
                  ['Жуков П.','📷 фото','2','7','error'],
                  ['Зайцева Е.','—','—','—',null],
                ].map(([n,w,b,e,c],i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={n.split(' ')[0][0] + n.split(' ')[1][0]} size={28} />
                        <span style={{ fontWeight: 500 }}>{n}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--fg-3)' }}>{w}</td>
                    <td>{b !== '—' ? <Badge kind={c}>{b}</Badge> : <span style={{ color: 'var(--fg-3)' }}>—</span>}</td>
                    <td style={{ color: 'var(--fg-2)' }}>{e}</td>
                    <td><Btn kind="ghost" size="sm" icon="eye"></Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          <div className="card" style={{ padding: 18, alignSelf: 'flex-start', position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Avatar name="ВД" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>Волков Дмитрий</div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>10А · загружено 14:32</div>
              </div>
              <Badge kind="primary">4 / 5</Badge>
            </div>
            <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ background: 'var(--surface-2)', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: 150, height: 200, background: 'white', borderRadius: 4, padding: 12, transform: 'rotate(-2deg)', boxShadow: 'var(--shadow-md)' }}>
                  <div style={{ fontFamily: 'Caveat, cursive', fontSize: 14, color: 'var(--fg)' }}>Решение №1:</div>
                  <div style={{ fontFamily: 'Caveat, cursive', fontSize: 12, color: 'var(--fg-2)', marginTop: 6, lineHeight: 1.4 }}>f'(x) = 2x · cos(x²)<br />f''(x) = 2cos(x²) − 4x²sin(x²)</div>
                  <div style={{ position: 'absolute', top: 30, right: 14, width: 28, height: 28, border: '2px solid var(--error)', borderRadius: 999, transform: 'rotate(8deg)' }}></div>
                </div>
                <Badge kind="error" style={{ position: 'absolute', top: 12, right: 12 }}>2 ошибки</Badge>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Найдено ИИ</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ padding: 10, background: '#FEF2F2', borderRadius: 8, fontSize: 13, borderLeft: '3px solid var(--error)' }}>
                  <strong>№3:</strong> ошибка в применении цепного правила (потерян множитель)
                </div>
                <div style={{ padding: 10, background: '#FEF2F2', borderRadius: 8, fontSize: 13, borderLeft: '3px solid var(--error)' }}>
                  <strong>№7:</strong> арифметическая ошибка в раскрытии скобок
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Btn kind="primary" size="sm" style={{ flex: 1, justifyContent: 'center' }}>Подтвердить балл</Btn>
              <Btn kind="outline" size="sm" icon="edit">Изменить</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const HiCatalog = () => (
  <div className="hi" style={{ display: 'flex', minHeight: 800 }}>
    <Sidebar active="catalog" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Topbar />
      <div style={{ padding: '32px 40px', flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <h1>Каталог</h1>
          <p style={{ color: 'var(--fg-2)', fontSize: 14, marginTop: 4 }}>1 247 листов от учителей со всей России · бесплатно</p>
        </div>

        <div className="input" style={{ minHeight: 50, padding: '8px 16px', maxWidth: 600, marginBottom: 24 }}>
          <I name="search" size={18} color="var(--fg-3)" />
          <span style={{ color: 'var(--fg-3)', fontSize: 15 }}>Производная, логарифмы, теорема Пифагора…</span>
          <Btn kind="primary" size="sm">Найти</Btn>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
          {/* Filters */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Предмет</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
              {[['Все',1247,true],['Алгебра',542,false],['Геометрия',287,false],['Информатика',418,false]].map(([t,n,a]) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: a ? 'var(--primary-soft)' : 'transparent', cursor: 'pointer' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: a ? 'var(--primary)' : 'var(--fg-2)' }}>{t}</span>
                  <span style={{ fontSize: 12, color: a ? 'var(--primary)' : 'var(--fg-3)' }}>{n}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Класс</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 24 }}>
              {[5,6,7,8,9,10,11].map(n => (
                <span key={n} className={'badge ' + (n===10 ? 'badge-primary' : 'badge-outline')} style={{ padding: '6px 0', justifyContent: 'center', cursor: 'pointer' }}>{n}</span>
              ))}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Тип</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['Контрольная',true],['Самостоятельная',false],['Закрепление',true],['Изучение нового',false]].map(([t,a]) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span className={'check' + (a ? ' on' : '')}>{a && '✓'}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>Найдено 287 листов</span>
              <Btn kind="outline" size="sm" iconRight="chevronDown">По популярности</Btn>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                ['Производная сложной функции','Анна С.','10','контрольная',124,4.9,true],
                ['Логарифмические уравнения','Михаил П.','11','закрепление',89,4.7,false],
                ['Теорема Пифагора — 3 уровня','Елена В.','8','самост.',156,4.8,true],
                ['Алгоритмы и блок-схемы','Дмитрий К.','8','изучение',67,4.6,false],
                ['Системы счисления','Анна С.','9','контрольная',98,4.7,false],
                ['Графики функций','Ольга М.','9','закрепление',112,4.8,true],
              ].map(([t,a,k,ty,d,r,verified],i) => (
                <div key={i} className="card card-hover" style={{ padding: 14 }}>
                  <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'center' }}>
                    <Doc width={150} height={190} title={t} subject={`${k} класс`} tasks={3} dense />
                  </div>
                  <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600, lineHeight: 1.3, minHeight: 36 }}>{t}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <Avatar name={a.split(' ')[0][0] + a.split(' ')[1][0]} size={20} style={{ fontSize: 9 }} />
                    <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>{a}</span>
                    {verified && <I name="check" size={12} color="var(--primary)" stroke={3} />}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--fg-3)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><I name="star" size={12} color="var(--accent)" /> {r}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><I name="download" size={12} /> {d}</span>
                    <Badge>{ty}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const HiSettings = () => (
  <div className="hi" style={{ display: 'flex', minHeight: 800 }}>
    <Sidebar active="" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Topbar />
      <div style={{ padding: '32px 40px', flex: 1, display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32 }}>
        <div>
          <h2>Настройки</h2>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[['Профиль','user',true],['Школа и брендинг','school',false],['Подписка','creditCard',false],['Шаблоны','file',false],['Уведомления','bell',false],['Безопасность','lock',false]].map(([t,i,a]) => (
              <div key={t} className={'nav-item' + (a ? ' active' : '')}>
                <I name={i} size={16} />
                {t}
              </div>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 720 }}>
          {/* Profile section */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>Профиль</h3>
            <p style={{ fontSize: 13, color: 'var(--fg-3)', marginBottom: 20 }}>Эти данные появляются в подписи листов</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <Avatar name="ИИ" size={64} style={{ fontSize: 22 }} />
              <div>
                <Btn kind="outline" size="sm" icon="upload">Загрузить фото</Btn>
                <p style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 6 }}>JPG, PNG · до 2 МБ</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 20 }}>
              <div>
                <label className="label">Имя</label>
                <div className="input"><span>Иван</span></div>
              </div>
              <div>
                <label className="label">Отчество</label>
                <div className="input"><span>Иванович</span></div>
              </div>
              <div>
                <label className="label">Фамилия</label>
                <div className="input"><span>Иванов</span></div>
              </div>
              <div>
                <label className="label">Email</label>
                <div className="input" style={{ background: 'var(--surface)' }}><span style={{ color: 'var(--fg-3)' }}>i.ivanov@school42.ru</span></div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label className="label">Предметы</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <Badge kind="primary"><I name="check" size={12} /> Алгебра</Badge>
                <Badge kind="primary"><I name="check" size={12} /> Геометрия</Badge>
                <Badge kind="outline">+ Информатика</Badge>
              </div>
            </div>
          </div>

          {/* School section */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>Школа и брендинг</h3>
            <p style={{ fontSize: 13, color: 'var(--fg-3)', marginBottom: 20 }}>Появятся в шапке каждого листа</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="label">Школа</label>
                  <div className="input"><span>МБОУ СОШ №42</span></div>
                </div>
                <div>
                  <label className="label">Город</label>
                  <div className="input"><span>Екатеринбург</span></div>
                </div>
                <div>
                  <label className="label">Цвет акцента</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['#1E40AF','#0F766E','#B91C1C','#7C3AED','#0F172A'].map((c,i) => (
                      <div key={c} style={{ width: 32, height: 32, borderRadius: 8, background: c, boxShadow: i===0 ? '0 0 0 3px var(--primary-soft)' : 'none', cursor: 'pointer' }}></div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Лого школы</label>
                <div style={{ aspectRatio: '1', border: '2px dashed var(--border-2)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--surface)' }}>
                  <I name="image" size={28} color="var(--fg-3)" />
                  <span style={{ fontSize: 12, color: 'var(--fg-3)', textAlign: 'center', padding: '0 8px' }}>Перетащи или <span style={{ color: 'var(--primary)', fontWeight: 500 }}>выбери</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, var(--primary-soft) 0%, white 60%)', borderColor: 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <Badge kind="primary">Бесплатный план</Badge>
                <h3 style={{ marginTop: 10 }}>3 из 5 листов в этом месяце</h3>
                <p style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4 }}>Обновится 1 июня</p>
              </div>
              <Btn kind="primary" icon="zap">Перейти на Pro</Btn>
            </div>
            <div className="progress" style={{ marginTop: 16 }}><div className="progress-bar" style={{ width: '60%', background: 'var(--accent)' }}></div></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
              {[['Pro','590 ₽/мес','безлимит листов'],['Школа','1990 ₽/мес','до 10 учителей'],['Регион','по запросу','для управлений']].map(([t,p,d],i) => (
                <div key={t} className="card" style={{ padding: 14, background: 'white' }}>
                  <div style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 14 }}>{t}</div>
                  <div style={{ fontFamily: 'Manrope', fontSize: 18, fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>{p}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

window.HiCheck = HiCheck;
window.HiCatalog = HiCatalog;
window.HiSettings = HiSettings;
