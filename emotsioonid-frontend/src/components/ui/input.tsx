import * as React from 'react';
const cn=(...xs:(string|undefined)[])=>xs.filter(Boolean).join(' ');
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>{}
export const Input=React.forwardRef<HTMLInputElement,InputProps>(({className,...props},ref)=>(
  <input ref={ref} className={cn('w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white placeholder-white/30 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',className)} {...props}/>
));
Input.displayName='Input'; export default Input;
