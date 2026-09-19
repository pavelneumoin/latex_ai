/** Calendar month, clamped to the last day, while preserving paid time on renewal. */
export function subscriptionPeriodEnd(now:Date, existingEnd:Date|null):Date{
 const start=existingEnd&&existingEnd>now?existingEnd:now;
 const end=new Date(start);const day=end.getUTCDate();end.setUTCDate(1);
 end.setUTCMonth(end.getUTCMonth()+1);
 const lastDay=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).getUTCDate();
 end.setUTCDate(Math.min(day,lastDay));return end;
}
