import * as React from 'react';
const cn=(...xs:(string|undefined)[])=>xs.filter(Boolean).join(' ');
export function Label({className,...props}:React.LabelHTMLAttributes<HTMLLabelElement>){return <label className={cn('mb-1 block text-sm text-cyan-200/90',className)} {...props}/>}
export default Label;