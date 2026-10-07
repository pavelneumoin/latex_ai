"use client";
import {PageGallery} from "../../_components/PageGallery";
export function PreviewGallery({productId,pageCount,title,labels}:{productId:string;pageCount:number;title:string;labels:string[]}){
 return <PageGallery title={title} pages={Array.from({length:pageCount},(_,i)=>({src:`/api/preview/${productId}?p=${i}`,label:labels[i]||`Страница · ${i+1}`}))}/>;
}
