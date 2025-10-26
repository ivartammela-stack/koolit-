import * as React from 'react';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'default'|'outline'|'ghost'|'link' }
const cn = (...xs:(string|undefined)[])=>xs.filter(Boolean).join(' ');
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({className,variant='default',...props},ref)=>{
  const base='inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none';
  const variants={default:'bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white shadow',
                  outline:'border border-white/15 bg-white/5 text-white hover:bg-white/10',
                  ghost:'text-cyan-300 hover:text-white',
                  link:'text-cyan-300 hover:text-white underline-offset-4 hover:underline'} as const;
  return <button ref={ref} className={cn(base,variants[variant],className)} {...props}/>;
});
Button.displayName='Button'; export default Button;