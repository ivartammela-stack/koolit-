import * as React from 'react';
const cn=(...xs:(string|undefined)[])=>xs.filter(Boolean).join(' ');
export function Card({className,...props}:React.HTMLAttributes<HTMLDivElement>){return <div className={cn('rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur',className)} {...props}/>}
export function CardContent({className,...props}:React.HTMLAttributes<HTMLDivElement>){return <div className={cn('p-6',className)} {...props}/>}
export default Card;
