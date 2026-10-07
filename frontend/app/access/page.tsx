import Link from "next/link";
import { Header } from "../_components/Header";

export default function AccessPage() {
  return <div className="hi library-site"><Header /><main className="kit-detail" style={{maxWidth:720}}>
    <span className="eyebrow">НЕУМОШКА · УЧИТЕЛЯМ</span>
    <h1>Доступ к библиотеке</h1>
    <p style={{margin:"16px 0",lineHeight:1.7}}>Логин и пароль выдаёт администратор. Электронная почта для входа не нужна.</p>
    <p style={{margin:"16px 0",lineHeight:1.7}}>В каталоге можно выбрать тему и полистать страницы. После входа в аккаунт с доступом вы сможете скачать комплект на Яндекс Диске.</p>
    <div style={{display:"flex",gap:12,flexWrap:"wrap",margin:"24px 0"}}><Link href="/login" className="btn btn-primary">У меня есть логин</Link><Link href="/catalog" className="btn btn-outline">Посмотреть материалы</Link></div>
    <p className="muted">По вопросам доступа — администратору группы <a href="https://vk.ru/club236910937" target="_blank" rel="noopener noreferrer">«ЕГЭ 2027 Математика. Презентации. Рабочие листы» ↗</a>.</p>
  </main></div>;
}
