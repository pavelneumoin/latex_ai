// Create + Progress hi-fi

const HiCreate = () => (
  <div className="hi" style={{ display: 'flex', minHeight: 800 }}>
    <Sidebar active="create" />
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minWidth: 0 }}>
      {/* Form pane */}
      <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', maxHeight: 800 }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, color: 'var(--fg-3)', marginBottom: 4 }}>Шаг 1 · Опиши лист</div>
          <h2>Новый рабочий лист</h2>
        </div>
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Source tabs */}
          <div className="tabs" style={{ alignSelf: 'flex-start' }}>
            <span className="tab active">По теме</span>
            <span className="tab">Из материала</span>
          </div>

          <div>
            <label className="label">Предмет</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="card" style={{ padding: 12, borderColor: 'var(--primary)', boxShadow: '0 0 0 3px var(--primary-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="radio on"></span>
                <I name="chart" size={18} color="var(--primary)" />
                <span style={{ fontWeight: 500, fontSize: 14 }}>Математика</span>
              </div>
              <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="radio"></span>
                <I name="layout" size={18} color="var(--fg-3)" />
                <span style={{ fontWeight: 500, fontSize: 14 }}>Информатика</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Класс</label>
              <div className="select" style={{ justifyContent: 'space-between' }}>
                <span>10 класс</span>
                <I name="chevronDown" size={16} color="var(--fg-3)" />
              </div>
            </div>
            <div>
              <label className="label">Число задач</label>
              <div className="card-flat" style={{ padding: '10px 14px', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--fg-2)' }}>
                  <span>1</span>
                  <span style={{ fontFamily: 'Manrope', fontWeight: 700, color: 'var(--fg)', fontSize: 16 }}>12</span>
                  <span>20</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 8, position: 'relative' }}>
                  <div style={{ width: '60%', height: '100%', background: 'var(--primary)', borderRadius: 2 }}></div>
                  <div style={{ position: 'absolute', left: '60%', top: '50%', width: 16, height: 16, background: 'white', border: '2px solid var(--primary)', borderRadius: 999, transform: 'translate(-50%, -50%)', boxShadow: 'var(--shadow-sm)' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Тема урока</label>
            <div className="textarea" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--fg)' }}>Производная сложной функции, цепное правило</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>часто:</span>
              <Badge kind="outline">квадратные уравнения</Badge>
              <Badge kind="outline">теорема Пифагора</Badge>
              <Badge kind="outline">логарифмы</Badge>
            </div>
          </div>

          <div>
            <label className="label">Тип урока</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {['Изучение нового','Закрепление','Контрольная','Самостоятельная'].map((t,i) => (
                <div key={t} className="card" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, borderColor: i===2 ? 'var(--primary)' : undefined, boxShadow: i===2 ? '0 0 0 3px var(--primary-soft)' : undefined }}>
                  <span className={'radio' + (i===2 ? ' on' : '')}></span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Accordion */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <I name="settings" size={16} color="var(--fg-2)" />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Дополнительные опции</span>
              </div>
              <I name="chevronDown" size={16} color="var(--fg-3)" />
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Теория с пропусками</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>для активного конспектирования</div>
                </div>
                <span className="switch on"></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Клетчатое поле</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>место для решений и графиков</div>
                </div>
                <span className="switch on"></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Лого школы</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>в правом верхнем углу</div>
                </div>
                <span className="switch on"></span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Ответы</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Не показывать','В конце листа','Отдельной страницей'].map((t,i) => (
                    <span key={t} className={'badge ' + (i===2 ? 'badge-primary' : 'badge-outline')} style={{ padding: '5px 12px', cursor: 'pointer' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Btn kind="primary" size="lg" icon="sparkles" style={{ width: '100%', justifyContent: 'center' }}>Сгенерировать рабочий лист</Btn>
          <p style={{ fontSize: 12, color: 'var(--fg-3)', textAlign: 'center', margin: 0 }}>30–60 секунд · работает на Claude Haiku</p>
        </div>
      </div>

      {/* Preview pane */}
      <div style={{ background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3>Предпросмотр</h3>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <Badge kind="primary">10 класс</Badge>
              <Badge>контрольная</Badge>
              <Badge>12 задач</Badge>
              <Badge kind="accent">+ теория</Badge>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg-3)' }}>
            <Btn kind="ghost" size="sm" icon="chevronLeft"></Btn>
            <span>1 / 3</span>
            <Btn kind="ghost" size="sm" icon="chevronRight"></Btn>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Doc width={340} height={460} tasks={6} style={{ boxShadow: 'var(--shadow-lg)' }} />
        </div>
        <div style={{ padding: 20, borderTop: '1px solid var(--border)', background: 'white', display: 'flex', gap: 8 }}>
          <Btn kind="primary" icon="download" style={{ flex: 1, justifyContent: 'center' }}>Скачать PDF</Btn>
          <Btn kind="outline" icon="bookmark">Сохранить</Btn>
          <Btn kind="outline" icon="layers">В каталог</Btn>
        </div>
      </div>
    </div>
  </div>
);

const HiProgress = () => (
  <div className="hi" style={{ display: 'flex', minHeight: 800, position: 'relative' }}>
    <Sidebar active="create" />
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minWidth: 0, opacity: 0.4, pointerEvents: 'none' }}>
      <div style={{ padding: 24 }}><h2>Новый рабочий лист</h2></div>
      <div style={{ background: 'var(--surface)' }}></div>
    </div>
    {/* Modal */}
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div className="card" style={{ width: 480, padding: 32, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I name="sparkles" size={28} color="var(--accent)" />
          </div>
          <div style={{ flex: 1 }}>
            <h3>Собираем ваш лист</h3>
            <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 2 }}>осталось примерно 25 секунд</div>
          </div>
          <span style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 20, color: 'var(--primary)' }}>60%</span>
        </div>
        <div className="progress"><div className="progress-bar" style={{ width: '60%' }}></div></div>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['Генерируем задачи','done'],
            ['Решаем эталонные ответы','done'],
            ['Собираем PDF · стр 2 из 3','active'],
            ['Готово!','wait'],
          ].map(([t,s]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: s==='wait' ? 0.4 : 1 }}>
              <div style={{ width: 24, height: 24, borderRadius: 999, background: s==='done' ? 'var(--success)' : s==='active' ? 'var(--accent)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                {s==='done' && <I name="check" size={14} color="white" stroke={3} />}
                {s==='active' && <div style={{ width: 8, height: 8, background: 'white', borderRadius: 999 }}></div>}
              </div>
              <span style={{ fontSize: 14, fontWeight: s==='active' ? 600 : 500 }}>{t}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: 14, background: 'var(--surface)', borderRadius: 12, borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>★ Пока ждёшь</div>
          <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4 }}>Знаешь, что Wildcat поддерживает векторные шрифты? Лист будет идеальным в печати.</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn kind="ghost" size="sm">Отменить</Btn>
        </div>
      </div>
    </div>
  </div>
);

window.HiCreate = HiCreate;
window.HiProgress = HiProgress;
