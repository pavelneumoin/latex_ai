// My worksheets + Detail hi-fi

const HiMine = () => (
  <div className="hi" style={{ display: 'flex', minHeight: 800 }}>
    <Sidebar active="mine" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Topbar action={<Btn kind="primary" size="sm" icon="plus">Создать лист</Btn>} />
      <div style={{ padding: '32px 40px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1>Мои листы</h1>
            <p style={{ color: 'var(--fg-2)', fontSize: 14, marginTop: 4 }}>23 листа · 4 папки</p>
          </div>
          <div className="tabs">
            <span className="tab active"><I name="grid" size={14} /></span>
            <span className="tab"><I name="list" size={14} /></span>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="input" style={{ width: 280, minHeight: 38, padding: '6px 12px' }}>
            <I name="search" size={16} color="var(--fg-3)" />
            <span style={{ color: 'var(--fg-3)', fontSize: 14 }}>Поиск по названию…</span>
          </div>
          <Badge kind="primary" style={{ padding: '6px 12px', cursor: 'pointer' }}>Все</Badge>
          <Badge kind="outline" style={{ padding: '6px 12px', cursor: 'pointer' }}>Алгебра</Badge>
          <Badge kind="outline" style={{ padding: '6px 12px', cursor: 'pointer' }}>Геометрия</Badge>
          <Badge kind="outline" style={{ padding: '6px 12px', cursor: 'pointer' }}>Информатика</Badge>
          <div style={{ flex: 1 }}></div>
          <Btn kind="outline" size="sm" icon="filter">Фильтры</Btn>
          <Btn kind="outline" size="sm" iconRight="chevronDown">По дате</Btn>
        </div>

        {/* Folders */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Папки</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[['10А — алгебра',8,'primary'],['10Б — алгебра',6,'primary'],['Олимпиадные',5,'accent'],['Архив 2024',4,null]].map(([t,n,c],i) => (
              <div key={i} className="card card-hover" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c==='accent' ? 'var(--accent-soft)' : 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                  <I name="folder" size={20} color={c==='accent' ? 'var(--accent)' : 'var(--primary)'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{n} листов</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worksheets grid */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Листы</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              ['Производная сложной функции','Алгебра · 10А','5 мая',12,'primary'],
              ['Логарифмические уравнения','Алгебра · 11Б','3 мая',10,'primary'],
              ['Графики функций','Алгебра · 9В','5 мая',8,'accent'],
              ['Алгоритмы и блок-схемы','Информатика · 8А','8 мая',6,'primary'],
              ['Циклы while и for','Информатика · 8А','9 мая',9,'accent'],
              ['Линейные уравнения','Алгебра · 7Б','12 мая',12,'primary'],
              ['Теорема Пифагора','Геометрия · 8В','15 мая',10,'primary'],
              ['Системы счисления','Информатика · 9А','17 мая',8,'accent'],
            ].map(([t,s,d,n,c],i) => (
              <div key={i} className="card card-hover" style={{ padding: 14 }}>
                <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'center', position: 'relative' }}>
                  <Doc width={150} height={190} title={t} subject={s} tasks={3} dense />
                  <button className="btn btn-ghost btn-icon" style={{ position: 'absolute', top: 8, right: 8, background: 'white', boxShadow: 'var(--shadow-sm)' }}><I name="more" size={14} /></button>
                </div>
                <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, lineHeight: 1.3, minHeight: 36 }}>{t}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>{s}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <Badge kind={c}>{n} задач</Badge>
                  <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>{d}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const HiDetail = () => (
  <div className="hi" style={{ display: 'flex', minHeight: 800 }}>
    <Sidebar active="mine" />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg-3)' }}>
          <span>Мои листы</span>
          <I name="chevronRight" size={14} />
          <span>10А — алгебра</span>
          <I name="chevronRight" size={14} />
          <span style={{ color: 'var(--fg)' }}>Производная сложной функции</span>
        </div>
        <div style={{ flex: 1 }}></div>
        <Btn kind="ghost" size="sm" icon="bookmark">В каталог</Btn>
        <Btn kind="outline" size="sm" icon="edit">Редактировать</Btn>
        <Btn kind="primary" size="sm" icon="download">PDF</Btn>
      </div>
      <div style={{ padding: '24px 40px 40px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, flex: 1 }}>
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <Badge kind="primary">Алгебра</Badge>
            <Badge>10 класс</Badge>
            <Badge>контрольная</Badge>
            <Badge kind="accent">12 задач</Badge>
          </div>
          <h1>Производная сложной функции</h1>
          <p style={{ color: 'var(--fg-2)', marginTop: 8, fontSize: 15 }}>Цепное правило. Дифференцирование функций вида f(g(x)).</p>

          {/* Pages */}
          <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
            {[
              ['Стр. 1 — Лист',true],
              ['Стр. 2 — Задачи',false],
              ['Стр. 3 — Ответы',false],
            ].map(([l,a],i) => (
              <div key={i} className="card" style={{ padding: 12, borderColor: a ? 'var(--primary)' : undefined, boxShadow: a ? '0 0 0 3px var(--primary-soft)' : undefined }}>
                <Doc width={180} height={240} tasks={4} dense />
                <div style={{ fontSize: 12, fontWeight: 500, color: a ? 'var(--primary)' : 'var(--fg-2)', marginTop: 10, textAlign: 'center' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 28 }}>
            {[['Скачиваний','12','download'],['Проверено','24','clipboard'],['Сред. балл','4.2','star'],['Время','45 мин','clock']].map(([t,v,ic]) => (
              <div key={t} className="card-flat" style={{ padding: 14 }}>
                <I name={ic} size={14} color="var(--fg-3)" />
                <div style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 22, marginTop: 6 }}>{v}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{t}</div>
              </div>
            ))}
          </div>

          {/* Versions */}
          <div style={{ marginTop: 28 }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>История версий</h3>
            <div className="card" style={{ padding: 0 }}>
              {[
                ['v3 — текущая','5 мая, 14:32','+ убрал задачу №7, изменил вариант'],
                ['v2','3 мая, 09:15','+ добавил теорию с пропусками'],
                ['v1','3 мая, 08:48','исходная версия'],
              ].map(([v,d,c],i) => (
                <div key={i} style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, borderBottom: i<2 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: i===0 ? 'var(--success)' : 'var(--border-2)' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{c}</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{d}</span>
                  {i>0 && <Btn kind="ghost" size="sm">Восстановить</Btn>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Действия</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <Btn kind="primary" icon="download" style={{ justifyContent: 'flex-start' }}>Скачать PDF</Btn>
              <Btn kind="outline" icon="print" style={{ justifyContent: 'flex-start' }}>Распечатать</Btn>
              <Btn kind="outline" icon="copy" style={{ justifyContent: 'flex-start' }}>Дублировать</Btn>
              <Btn kind="outline" icon="refresh" style={{ justifyContent: 'flex-start' }}>Перегенерировать</Btn>
              <Btn kind="outline" icon="clipboard" style={{ justifyContent: 'flex-start' }}>Проверить работы</Btn>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Параметры</div>
            <div style={{ marginTop: 12, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['Папка','10А — алгебра'],['Создан','3 мая 2026'],['Изменён','5 мая 2026'],['Тип урока','Контрольная'],['Опции','Теория, клетка, лого']].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ color: 'var(--fg-3)' }}>{k}</span>
                  <span style={{ fontWeight: 500, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <Btn kind="ghost" icon="trash" style={{ color: 'var(--error)', justifyContent: 'flex-start' }}>Удалить лист</Btn>
        </div>
      </div>
    </div>
  </div>
);

window.HiMine = HiMine;
window.HiDetail = HiDetail;
