import { NextResponse } from "next/server";
/** Route-level gate, independent of middleware, until the tools are released. */
export function developmentOnly<T extends (...args: never[]) => unknown>(_handler:T){
 return async (..._args:Parameters<T>) => NextResponse.json({error:"under_development",message:"Этот инструмент пока недоступен"},{status:403});
}
