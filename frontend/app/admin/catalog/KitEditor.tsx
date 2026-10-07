"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {catalogTaxonomy} from "@/lib/catalog-taxonomy";
type Fields={title:string;slug:string;description:string;subject:string;examTask:number|null;topic:string;subtopic:string;kind:string;composition:string[];diskFolderUrl:string;bundleTier:string;isPublished:boolean;isFree:boolean};
const blank:Fields={title:"",slug:"",description:"",subject:"math",examTask:null,topic:"",subtopic:"",kind:"lesson_kit",composition:["Презентация","Рабочий лист","Домашнее задание"],diskFolderUrl:"",bundleTier:"basic",isPublished:false,isFree:false};
export function KitEditor({id,initial,labels}:{id?:string;initial?:Fields;labels:string[]}){
 const [form,setForm]=useState<Fields>(initial||blank),[parts,setParts]=useState((initial||blank).composition.join("\n")),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState(false),[label,setLabel]=useState("Презентация · 1");
 const [previewNames,setPreviewNames]=useState(labels);
 const router=useRouter();const set=(key:keyof Fields,value:unknown)=>setForm(p=>({...p,[key]:value}));
 const topics=catalogTaxonomy[form.subject]?.find(t=>t.number===form.examTask)?.topics||[];
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");setError(false);try{const r=await fetch("/api/admin/kits"+(id?"/"+id:""),{method:id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,composition:parts.split("\n").map(s=>s.trim()).filter(Boolean)})});const data=await r.json();if(!r.ok)throw new Error(data.error);if(!id)router.replace("/admin/catalog/"+data.id);else{setMessage("Сохранено");}}catch(e){setError(true);setMessage(e instanceof Error?e.message:"Ошибка сохранения");}finally{setBusy(false);}}
 async function upload(file?:File){if(!file||!id)return;setBusy(true);setError(false);setMessage("");try{if(file.size>2*1024*1024)throw new Error("Картинка должна быть меньше 2 МБ");const r=await fetch("/api/admin/kits/"+id+"/previews?label="+encodeURIComponent(label),{method:"POST",body:file,headers:{"Content-Type":file.type}});const data=await r.json();if(!r.ok)throw new Error(data.error);setPreviewNames(current=>[...current,label]);setMessage("Страница добавлена");}catch(e){setError(true);setMessage(e instanceof Error?e.message:"Ошибка загрузки");}finally{setBusy(false);}}
 return <><form onSubmit={save} className="kit-editor">
 <label className="full">Название<input required maxLength={180} value={form.title} onChange={e=>set("title",e.target.value)}/></label>
 <label>Адрес комплекта<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} placeholder="ege-math-circle" value={form.slug} onChange={e=>set("slug",e.target.value)}/></label>
 <label>Предмет<select value={form.subject} onChange={e=>set("subject",e.target.value)}><option value="math">Математика</option><option value="informatics">Информатика</option></select></label>
 <label>Номер задания ЕГЭ<input type="number" min="1" max="27" list="task-options" value={form.examTask??""} onChange={e=>set("examTask",e.target.value?Number(e.target.value):null)}/><datalist id="task-options">{catalogTaxonomy[form.subject]?.map(t=><option key={t.number} value={t.number}>{t.title}</option>)}</datalist></label>
 <label>Тип комплекта<select value={form.kind} onChange={e=>set("kind",e.target.value)}><option value="lesson_kit">Комплект урока</option><option value="worksheet">Рабочий лист</option><option value="presentation">Презентация</option><option value="test">Проверочная работа</option><option value="course_bundle">Комплект курса</option></select></label>
 <label>Тема<input list="topic-options" value={form.topic} onChange={e=>set("topic",e.target.value)}/><datalist id="topic-options">{topics.map(t=><option key={t}>{t}</option>)}</datalist></label>
 <label>Подтема<input value={form.subtopic} onChange={e=>set("subtopic",e.target.value)}/></label>
 <label className="full">Короткое описание<textarea maxLength={4000} value={form.description} onChange={e=>set("description",e.target.value)}/></label>
 <label className="full">Состав — каждый пункт с новой строки<textarea value={parts} onChange={e=>setParts(e.target.value)}/></label>
 <label className="full">Ссылка на весь комплект Яндекс Диска<input type="url" placeholder="https://disk.yandex.ru/d/…" value={form.diskFolderUrl} onChange={e=>set("diskFolderUrl",e.target.value)}/><small>Ссылка на общую папку или ZIP. Пока её нет, скачивание будет недоступно.</small></label>
 <label>Состав доступа<select value={form.bundleTier} onChange={e=>set("bundleTier",e.target.value)}><option value="basic">PDF</option><option value="source">PDF и исходники</option></select></label>
 <div><label className="check"><input type="checkbox" checked={form.isPublished} onChange={e=>set("isPublished",e.target.checked)}/>Опубликовать</label><label className="check"><input type="checkbox" checked={form.isFree} onChange={e=>set("isFree",e.target.checked)}/>Бесплатный комплект</label></div>
 <button className="btn btn-primary" disabled={busy}>{busy?"Сохраняем…":"Сохранить комплект"}</button>{id&&<a className="btn btn-outline" href={"/catalog/"+form.slug}>Посмотреть комплект ↗</a>}
 </form><p role="status" className={"editor-message "+(error?"editor-error":"")}>{message}</p>
 {id?<section className="kit-editor"><div className="full"><h2>Превью страниц</h2><p>Небольшие PNG, JPG или WebP до 2 МБ. Сами PDF остаются на Диске. Добавляйте только страницы, которые можно показать посетителям.</p></div><label>Название материала и страница<input value={label} onChange={e=>setLabel(e.target.value)} maxLength={120}/><small>Например: Рабочий лист · 2</small></label><label>Добавить страницу<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value="";}}/></label><div className="admin-preview-list full">{previewNames.map((text,i)=><div key={i}><img src={"/api/preview/"+id+"?p="+i+"&size=thumb"} alt={text} loading="lazy"/><small>{text}</small></div>)}</div></section>:<p>Сохраните черновик, затем добавьте изображения превью.</p>}
 </>;
}
