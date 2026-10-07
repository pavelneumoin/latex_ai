"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconSearch, IconArrowRight, IconFolder, IconX } from "../_components/Icons";
import { kitSummary, subjectName, PRODUCT_KIND_LABEL } from "@/lib/products";
import { scoreProductSearch } from "@/lib/product-search";
import { catalogTaxonomy } from "@/lib/catalog-taxonomy";
export interface CatalogItem {
 id:string; slug:string; title:string; description:string|null; subject:string; course:string|null;
 courseSlug:string|null; audience:string|null; kind:string; isFree:boolean; priceBasic:number;
 previewPath:string|null; createdAt:string; assets:{kind:string;tier:string}[];
 examTask:number|null; topic:string|null; subtopic:string|null; composition:string[]; fan:number[]; isPublished:boolean;
}
export function CatalogView({products,admin=false}:{products:CatalogItem[];admin?:boolean}) {
 const params=useSearchParams(), router=useRouter(), pathname=usePathname();
 const [query,setQuery]=useState(params.get("q")||""); const input=useRef<HTMLInputElement>(null);
 const subject=params.get("subject")||"", task=params.get("task")||"", topic=params.get("topic")||"", kind=params.get("kind")||"", format=params.get("format")||"";
 useEffect(()=>setQuery(params.get("q")||""),[params]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();input.current?.focus();}};document.addEventListener("keydown",key);return()=>document.removeEventListener("keydown",key);},[]);
 function update(patch:Record<string,string>){const next=new URLSearchParams(params.toString());if(query.trim())next.set("q",query.trim());else next.delete("q");Object.entries(patch).forEach(([k,v])=>v?next.set(k,v):next.delete(k));router.replace(pathname+"?"+next,{scroll:false});}
 const filtered=!!(subject||task||topic||kind||format||query);
 const tasks=subject?catalogTaxonomy[subject]||[]:Array.from(new Set(products.map(p=>p.examTask).filter(Boolean))).sort((a,b)=>a!-b!).map(number=>({number:number!,title:""}));
 const topics=Array.from(new Set(products.filter(p=>(!subject||p.subject===subject)&&(!task||String(p.examTask)===task)).flatMap(p=>[p.topic,p.subtopic].filter(Boolean) as string[])));
 const visible=products.filter(p=>(!subject||p.subject===subject)&&(!task||String(p.examTask)===task)&&(!topic||p.topic===topic||p.subtopic===topic)&&(!kind||p.kind===kind)&&(!format||p.assets.some(a=>a.kind===format))&&(!query.trim()||scoreProductSearch({...p,description:[p.description,p.topic,p.subtopic,...p.composition].join(" ")},query)!==null));
 function reset(){setQuery("");router.replace(pathname,{scroll:false});}
 return <main className="compact-catalog">
  <div className="catalog-intro"><div><span className="catalog-kicker">НЕУМОШКА · УЧИТЕЛЯМ</span><h1>Материалы к уроку</h1><p>Одна тема — один комплект. Для экрана, печати и планшета.</p></div><div className="catalog-shortcuts">{admin&&<Link href="/admin/catalog">Управление комплектами ↗</Link>}<Link href="/cabinet/library">Избранное ↗</Link></div></div>
  <section className="catalog-filterbar" aria-label="Поиск и фильтры">
   <form className="library-search" onSubmit={e=>{e.preventDefault();update({q:query.trim()});}}><IconSearch size={20}/><input ref={input} aria-label="Поиск материалов" placeholder="Название, тема или номер задания" value={query} maxLength={120} onChange={e=>setQuery(e.target.value)}/>{query&&<button type="button" aria-label="Очистить поиск" onClick={()=>{setQuery("");update({q:""});}}><IconX size={17}/></button>}<button type="submit" className="search-submit">Найти</button></form>
   <div className="catalog-selects">
    <label>Предмет<select value={subject} onChange={e=>update({subject:e.target.value,task:"",topic:""})}><option value="">Все предметы</option><option value="math">Математика</option><option value="informatics">Информатика</option></select></label>
    <label>Задание ЕГЭ<select value={task} onChange={e=>update({task:e.target.value,topic:""})}><option value="">Все задания</option>{tasks.map(t=><option key={t.number} value={t.number}>№ {t.number}{t.title?" · "+t.title:""}</option>)}</select></label>
    <label>Тема / подтема<select value={topic} onChange={e=>update({topic:e.target.value})}><option value="">Все темы</option>{topics.map(t=><option key={t}>{t}</option>)}</select></label>
    <label>Тип комплекта<select value={kind} onChange={e=>update({kind:e.target.value})}><option value="">Все типы</option>{Object.entries(PRODUCT_KIND_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
   </div>
   <div className="catalog-format-row"><span>В составе</span>{[["","Всё"],["presentation_pdf","Презентация"],["worksheet_pdf","Рабочий лист"],["homework_pdf","ДЗ"],["test_pdf","Проверочная"]].map(([id,label])=><button key={id} aria-pressed={format===id} onClick={()=>update({format:id})}>{label}</button>)}</div>
  </section>
  <div className="catalog-results"><span role="status" aria-live="polite">Найдено: <b>{visible.length}</b> из {products.length} комплектов</span>{filtered&&<button onClick={reset}>Сбросить всё ×</button>}<Link href="/materials">Навигатор ЕГЭ ↗</Link></div>
  {visible.length?<div className="compact-kit-grid">{visible.map(p=><Link className={"compact-kit "+p.subject} href={"/catalog/"+p.slug} key={p.id}>
   <div className="kit-fan" aria-hidden="true">{p.fan.length?p.fan.slice().reverse().map((idx,j)=><img key={idx} className={"fan-page fan-page-"+(p.fan.length-1-j)} src={"/api/preview/"+p.id+"?p="+idx+"&size=thumb"} alt="" loading="lazy"/>):p.previewPath?<img className="fan-page fan-page-0" src={"/api/preview/"+p.id} alt="" loading="lazy"/>:<IconFolder size={48}/>}</div>
   <div className="compact-kit-body"><div className="kit-eyebrow"><span>{subjectName(p.subject)}</span><span>ЕГЭ{p.examTask?" · № "+p.examTask:""}</span></div><h2>{p.title}</h2><div className="kit-composition">{(p.composition.length?p.composition:kitSummary(p.assets)).map((label,i)=><span key={i}>{label}</span>)}</div><div className="kit-bottom"><span>{!p.isPublished?"Черновик":p.isFree?"Бесплатно":"По подписке"}</span><b>Посмотреть <IconArrowRight size={16}/></b></div></div>
  </Link>)}</div>:<div className="catalog-empty"><IconFolder size={32}/><h2>Комплектов не найдено</h2><p>Измените запрос или уберите часть фильтров.</p><button className="btn btn-outline" onClick={reset}>Показать все комплекты</button></div>}
  <footer className="compact-footer"><span>Неумошка · Материалы для учителей</span><Link href="/privacy">Конфиденциальность</Link></footer>
 </main>;
}
