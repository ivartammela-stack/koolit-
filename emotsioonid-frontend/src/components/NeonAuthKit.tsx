import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Globe2, Lock, Mail } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const dict = {
  et: {
    title: "Tere tulemast tagasi",
    subtitle: "Logi oma kontole",
    email: "E-post",
    emailPlaceholder: "sinunimi@näide.ee",
    password: "Parool",
    passwordPlaceholder: "••••••••",
    remember: "Jäta mind meelde",
    signIn: "Logi sisse",
    forgot: "Unustasid parooli?",
    or: "või",
    register: "Registreeru uueks kasutajaks",
    errors: {
      emailRequired: "E-post on kohustuslik",
      emailInvalid: "Palun sisesta korrektne e-post",
      passwordRequired: "Parool on kohustuslik",
    },
  },
  en: {
    title: "Welcome back",
    subtitle: "Sign in to your account",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "••••••••",
    remember: "Remember me",
    signIn: "Sign in",
    forgot: "Forgot password?",
    or: "or",
    register: "Create a new account",
    errors: {
      emailRequired: "Email is required",
      emailInvalid: "Please enter a valid email",
      passwordRequired: "Password is required",
    },
  },
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NeonBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(closest-side, #00FFC6, transparent)" }}
        animate={{ x: [0, 40, -20, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(closest-side, #7C3AED, transparent)" }}
        animate={{ x: [0, -30, 10, 0], y: [0, 25, -15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70"
        animate={{ y: [0, 600, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-70"
        animate={{ y: [0, -600, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 [background:linear-gradient(transparent,rgba(0,0,0,0.6)),repeating-linear-gradient(0deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_60px),repeating-linear-gradient(90deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_60px)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
    </div>
  );
}

function FieldWrapper({ label, icon, children }:{label:string; icon?:React.ReactNode; children:React.ReactNode;}){
  return (
    <label className="group relative block">
      <div className="mb-1 flex items-center gap-2 text-sm text-cyan-200/90">
        {icon}
        <span>{label}</span>
      </div>
      <div className="relative rounded-2xl bg-white/5 ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-cyan-400/80">
        <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 blur-md transition-opacity duration-300 group-focus-within:opacity-100" style={{background:"linear-gradient(90deg, rgba(34,211,238,0.6), rgba(168,85,247,0.6))"}}/>
        <div className="relative">{children}</div>
      </div>
    </label>
  );
}

export const LanguageSwitcher:React.FC<{locale:keyof typeof dict; setLocale:(l:keyof typeof dict)=>void;}> = ({ locale, setLocale }) => (
  <button onClick={() => setLocale(locale === "et" ? "en" : "et")} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 backdrop-blur hover:bg_white/10 transition" aria-label="Switch language" title="Switch language">
    <Globe2 className="h-4 w-4" />
    <span className="uppercase">{locale}</span>
  </button>
);

const PasswordInput:React.FC<{value:string; onChange:(v:string)=>void; placeholder?:string;}> = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center">
      <Lock className="ml-3 h-4 w-4 text-white/60" />
      <input type={show ? "text" : "password"} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent px-3 py-3 text-white placeholder-white/30 outline-none" autoComplete="current-password" />
      <button type="button" onClick={()=>setShow(s=>!s)} className="mr-3 rounded-md px-2 py-1 text-white/70 hover:text-white focus:outline-none" aria-label={show?"Hide password":"Show password"}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

const EmailInput:React.FC<{value:string; onChange:(v:string)=>void; placeholder?:string;}> = ({ value, onChange, placeholder }) => (
  <div className="flex items-center">
    <Mail className="ml-3 h-4 w-4 text-white/60" />
    <input type="email" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent px-3 py-3 text-white placeholder-white/30 outline-none" autoComplete="email" />
  </div>
);

export interface LoginProps {
  defaultLocale?: keyof typeof dict;
  onSignIn?: (payload: { email: string; password: string; remember: boolean; locale: keyof typeof dict; }) => Promise<void> | void;
  onForgotPassword?: (email?: string) => void;
  onRegister?: () => void;
}

export const FuturisticLogin:React.FC<LoginProps> = ({ defaultLocale = "et", onSignIn, onForgotPassword, onRegister }) => {
  const [locale, setLocale] = useState<keyof typeof dict>(defaultLocale);
  const t = useMemo(()=>dict[locale],[locale]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?:string; password?:string}>({});
  const [formError, setFormError] = useState<string|null>(null);

  const validate = () => {
    const next: {email?:string; password?:string} = {};
    if(!email) next.email = t.errors.emailRequired; else if(!emailRegex.test(email)) next.email = t.errors.emailInvalid;
    if(!password) next.password = t.errors.passwordRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if(!validate()) return;
    try{
      setLoading(true);
      await onSignIn?.({ email, password, remember, locale });
    }catch(err:any){ setFormError(err?.message || "Sign-in failed"); }
    finally{ setLoading(false); }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05060A]">
      <NeonBackground />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <motion.h1 className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-4xl font-black text-transparent md:text-5xl">{t.title}</motion.h1>
          <motion.p className="mt-3 max-w-md text-white/70">{t.subtitle}</motion.p>
        </div>
        <motion.div className="order-1 md:order-2">
          <div className="relative">
            <div className="pointer-events-none absolute -inset-0.5 rounded-[1.75rem] bg-gradient-to-r from-cyan-400/40 via-white/10 to-fuchsia-500/40 blur-xl" />
            <form onSubmit={handleSubmit} className="relative rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text_white/90">{t.subtitle}</h2>
                <LanguageSwitcher locale={locale} setLocale={setLocale} />
              </div>
              <div className="space-y-5">
                <FieldWrapper label={t.email} icon={<Mail className="h-4 w-4" />}> <EmailInput value={email} onChange={setEmail} placeholder={t.emailPlaceholder} /> </FieldWrapper>
                {errors.email && <p className="mt-1 text-xs text-rose-300">{errors.email}</p>}
                <FieldWrapper label={t.password} icon={<Lock className="h-4 w-4" />}> <PasswordInput value={password} onChange={setPassword} placeholder={t.passwordPlaceholder} /> </FieldWrapper>
                {errors.password && <p className="mt-1 text-xs text-rose-300">{errors.password}</p>}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer items-center gap-2 text-white/80">
                    <input type="checkbox" className="h-4 w-4 cursor-pointer accent-cyan-400" checked={remember} onChange={(e)=>setRemember(e.target.checked)} />
                    {t.remember}
                  </label>
                  <button type="button" onClick={()=>onForgotPassword?.(email||undefined)} className="text-cyan-300 hover:text-white">{t.forgot}</button>
                </div>
                {formError && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{formError}</div>}
                <motion.button type="submit" disabled={loading} className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-3 font-semibold text-white shadow-lg transition focus:outline-none disabled:opacity-60" whileTap={{ scale: 0.98 }}>
                  {loading?"…":t.signIn}
                </motion.button>
                <div className="flex items-center gap-3 py-2 text-sm text-white/60"><div className="h-px flex-1 bg-white/10"/><span className="uppercase tracking-wider text-white/40">{t.or}</span><div className="h-px flex-1 bg-white/10"/></div>
                <button type="button" onClick={onRegister} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-medium text-white/90 hover:bg-white/10">{dict[locale].register}</button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FuturisticLogin;
