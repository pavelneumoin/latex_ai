"use client";
import {useRef,useState} from "react";
export type PreviewPage={src:string;label:string};
export function PageGallery({pages,title}:{pages:PreviewPage[];title:string}){
 const [index,setIndex]=useState(0),[zoom,setZoom]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null), touch=useRef<{x:number;y:number}|null>(null);
 const group=(label:string)=>label.replace(/ · \d+$/,"");
 const groups=Array.from(new Set(pages.map(p=>group(p.label))));
 const selected=pages[index]??pages[0]; if(!selected)return <p>Превью пока не добавлено.</p>;
 const indices=pages.map((_,i)=>i).filter(i=>group(pages[i].label)===group(selected.label));
 const position=indices.indexOf(index);
 function step(delta:number){setIndex(indices[(position+delta+indices.length)%indices.length]);setZoom(false);}
 const keys=(e:React.KeyboardEvent)=>{if((e.target as HTMLElement).closest("select,input,textarea"))return;if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();step(e.key==="ArrowRight"?1:-1);}if(e.key==="Home"){e.preventDefault();setIndex(indices[0]);}if(e.key==="End"){e.preventDefault();setIndex(indices[indices.length-1]);}};
 const swipe={onTouchStart:(e:React.TouchEvent)=>{if(e.touches.length===1)touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};else touch.current=null;},onTouchEnd:(e:React.TouchEvent)=>{if(!touch.current||zoom)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)step(dx<0?1:-1);touch.current=null;}};
 const controls=<div className="kit-gallery-controls"><button type="button" aria-label="Предыдущая страница" disabled={indices.length<2} onClick={()=>step(-1)}>←</button><span aria-live="polite">{position+1} / {indices.length}</span><button type="button" aria-label="Следующая страница" disabled={indices.length<2} onClick={()=>step(1)}>→</button></div>;
 return <section className="kit-gallery" aria-label="Предпросмотр комплекта" onKeyDown={keys}>
  <div className="kit-gallery-tabs"><select className="kit-gallery-select" aria-label="Материал для просмотра" value={group(selected.label)} onChange={e=>{setIndex(pages.findIndex(p=>group(p.label)===e.target.value));setZoom(false);}}>{groups.map(g=><option key={g}>{g}</option>)}</select>{groups.map(g=><button key={g} aria-pressed={group(selected.label)===g} onClick={()=>{setIndex(pages.findIndex(p=>group(p.label)===g));setZoom(false);}}>{g}</button>)}</div>
  <button type="button" className="kit-gallery-stage" data-format={selected.label.startsWith("Презентация")?"slide":"page"} aria-label="Увеличить страницу" onClick={()=>{setZoom(false);dialog.current?.showModal();}} {...swipe}><img src={selected.src} alt={title+". "+selected.label}/><span>↗ Увеличить</span></button>
  {controls}<div className="kit-gallery-thumbs">{indices.map((i,n)=><button key={i} aria-label={"Страница "+(n+1)} aria-pressed={index===i} onClick={()=>setIndex(i)}><img src={pages[i].src} alt="" loading="lazy"/><span>{n+1}</span></button>)}</div>
  <p className="kit-preview-note">Ознакомительные страницы · Полные материалы входят в комплект</p>
  <dialog ref={dialog} className="kit-gallery-dialog" aria-label={"Просмотр: "+title} onClose={e=>{e.stopPropagation();setZoom(false);}}>
   <div className="kit-dialog-top"><span>{selected.label}</span><button type="button" aria-pressed={zoom} onClick={()=>setZoom(!zoom)}>{zoom?"По размеру":"Увеличить +"}</button><button type="button" aria-label="Закрыть просмотр" onClick={()=>dialog.current?.close()}>✕</button></div>
   <div className={"kit-dialog-page "+(zoom?"is-zoomed":"")} {...swipe}><img src={selected.src} alt={title+". "+selected.label}/></div>{controls}
  </dialog>
 </section>;
}
