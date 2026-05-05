// WorksheetAI hi-fi — shared primitives

// Inline SVG Lucide icons
const I = ({ name, size = 16, color = 'currentColor', stroke = 2 }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', style: { flex: '0 0 auto' } };
  const paths = {
    sparkles: <><path d="M12 3l1.9 5.8L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-2.2L12 3z"/><path d="M19 3l.7 2.1L22 6l-2.3.7L19 9"/><path d="M5 14l.5 1.5L7 16l-1.5.5L5 18"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    folder: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    chevronRight: <><polyline points="9 18 15 12 9 6"/></>,
    chevronDown: <><polyline points="6 9 12 15 18 9"/></>,
    chevronLeft: <><polyline points="15 18 9 12 15 6"/></>,
    more: <><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></>,
    moreH: <><circle cx="12" cy="12" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    layout: <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>,
    clipboard: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><polyline points="21 15 16 10 5 21"/></>,
    palette: <><circle cx="12" cy="12" r="9"/><circle cx="7.5" cy="10.5" r="1.5"/><circle cx="12" cy="7.5" r="1.5"/><circle cx="16.5" cy="10.5" r="1.5"/><path d="M12 22a4 4 0 0 1-4-4c0-2 2-3 2-5"/></>,
    star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    print: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    arrowUp: <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    arrowDown: <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
    bookmark: <><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></>,
    school: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    creditCard: <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    refresh: <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
  };
  return <svg {...props}>{paths[name] || null}</svg>;
};

const Logo = ({ size = 'md' }) => (
  <a className="logo" style={{ fontSize: size === 'lg' ? 22 : size === 'sm' ? 16 : 18 }}>
    <span className="logo-mark" style={{ width: size === 'lg' ? 36 : size === 'sm' ? 26 : 30, height: size === 'lg' ? 36 : size === 'sm' ? 26 : 30 }}></span>
    <span>worksheet<span style={{ color: 'var(--accent)' }}>·ai</span></span>
  </a>
);

const Btn = ({ children, kind = 'primary', size, icon, iconRight, style, ...rest }) => (
  <button className={`btn btn-${kind} ${size ? 'btn-' + size : ''}`} style={style} {...rest}>
    {icon && <I name={icon} size={size === 'lg' ? 18 : 16} />}
    {children}
    {iconRight && <I name={iconRight} size={size === 'lg' ? 18 : 16} />}
  </button>
);

const Badge = ({ children, kind, style }) => (
  <span className={`badge ${kind ? 'badge-' + kind : ''}`} style={style}>{children}</span>
);

const Avatar = ({ name = 'ИИ', src, size = 36, style }) => (
  <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4, ...style }}>{name}</span>
);

// Hi-fi PDF doc preview
const Doc = ({ width = 220, height = 300, title = 'Производная сложной функции', subject = 'Алгебра · 10 класс', tasks = 5, accent = 'var(--primary)', logo, dense, style }) => (
  <div className="doc" style={{ width, height, ...style }}>
    <div className="doc-header" style={{ background: 'white' }}>
      <span style={{ color: accent, fontWeight: 700 }}>МБОУ №42</span>
      <span style={{ color: 'var(--fg-3)' }}>{subject}</span>
    </div>
    <div style={{ padding: '12px 14px' }}>
      <div style={{ fontFamily: 'Manrope', fontSize: 12, fontWeight: 700, color: 'var(--fg)', lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontSize: 9, color: 'var(--fg-3)', marginTop: 2 }}>Ф.И. ученика _________________</div>
      <div style={{ height: 1, background: 'var(--border)', marginTop: 8 }}></div>
      {Array.from({ length: tasks }).map((_, i) => (
        <div key={i} style={{ marginTop: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: accent, marginBottom: 3 }}>№ {i+1}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ height: 3, background: 'rgba(15,23,42,0.7)', borderRadius: 1, width: `${78 + i*3 % 18}%` }}></div>
            <div style={{ height: 3, background: 'rgba(15,23,42,0.5)', borderRadius: 1, width: `${50 + i*7 % 30}%` }}></div>
            {!dense && <div style={{ height: 3, background: 'rgba(15,23,42,0.3)', borderRadius: 1, width: `${30 + i*5 % 20}%` }}></div>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Dotted grid placeholder
const GridPlaceholder = ({ width, height, label, style }) => (
  <div style={{ width, height, background: 'var(--surface)', backgroundImage: 'radial-gradient(circle, var(--border-2) 1px, transparent 1px)', backgroundSize: '14px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-3)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', ...style }}>
    {label}
  </div>
);

const Sidebar = ({ active = 'create' }) => {
  const items = [
    { id: 'home', label: 'Главная', icon: 'home' },
    { id: 'create', label: 'Создать лист', icon: 'sparkles' },
    { id: 'mine', label: 'Мои листы', icon: 'folder' },
    { id: 'check', label: 'Проверки', icon: 'clipboard' },
    { id: 'catalog', label: 'Каталог', icon: 'layers' },
  ];
  return (
    <aside className="sidebar">
      <div style={{ padding: '0 8px 16px' }}><Logo size="sm" /></div>
      {items.map(it => (
        <div key={it.id} className={'nav-item' + (active === it.id ? ' active' : '')}>
          <I name={it.icon} size={18} stroke={active === it.id ? 2.2 : 2} />
          {it.label}
        </div>
      ))}
      <div style={{ flex: 1 }}></div>
      <div className="nav-item">
        <I name="settings" size={18} />
        Настройки
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px', marginTop: 8, borderTop: '1px solid var(--border)' }}>
        <Avatar name="ИИ" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Иван И.</div>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Школа №42</div>
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ title, search, action }) => (
  <div className="topbar">
    {title && <div style={{ fontFamily: 'Manrope', fontWeight: 600, fontSize: 16 }}>{title}</div>}
    <div style={{ flex: 1 }}></div>
    {search && (
      <div className="input" style={{ width: 280, minHeight: 38, padding: '6px 12px' }}>
        <I name="search" size={16} color="var(--fg-3)" />
        <span style={{ color: 'var(--fg-3)', fontSize: 14 }}>{search}</span>
      </div>
    )}
    <button className="btn btn-ghost btn-icon"><I name="bell" size={18} /></button>
    {action}
  </div>
);

Object.assign(window, { I, Logo, Btn, Badge, Avatar, Doc, GridPlaceholder, Sidebar, Topbar });
