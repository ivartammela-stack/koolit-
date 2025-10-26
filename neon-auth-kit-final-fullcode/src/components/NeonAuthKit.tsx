// NeonAuthKit.tsx — kõik ühes failis
// React + TailwindCSS + Vite
// Sisaldab: FuturisticLogin / Register / Forgot (põhivariandid),
// RHF + Zod valideerimise variandid, shadcn/ui variandid,
// Canvas osakeste taust ja Three.js shader taust.

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Globe2, Lock, Mail } from "lucide-react";

// shadcn/ui kerge stiilikiht
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// RHF + Zod
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Three.js shader taust
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";

// --- i18n ---
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

// --- Prop tüübid ---
export interface LoginProps {
  defaultLocale?: keyof typeof dict;
  onSignIn?: (payload: {
    email: string;
    password: string;
    remember: boolean;
    locale: keyof typeof dict;
  }) => Promise<void> | void;
  onForgotPassword?: (email?: string) => void;
  onRegister?: () => void;
}
export interface RegisterProps {
  defaultLocale?: keyof typeof dict;
  onCreateAccount?: (payload: {
    email: string;
    password: string;
    name?: string;
    locale: keyof typeof dict;
  }) => Promise<void> | void;
  onGoToSignIn?: () => void;
}
export interface ForgotProps {
  defaultLocale?: keyof typeof dict;
  onRequestReset?: (payload: {
    email: string;
    locale: keyof typeof dict;
  }) => Promise<void> | void;
  onGoToSignIn?: () => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Taust: neon ---
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

// --- Vormiväljade wrapperid ---
function FieldWrapper({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="group relative block">
      <div className="mb-1 flex items-center gap-2 text-sm text-cyan-200/90">
        {icon}
        <span>{label}</span>
      </div>
      <div className="relative rounded-2xl bg-white/5 ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-cyan-400/80">
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 blur-md transition-opacity duration-300 group-focus-within:opacity-100"
          style={{
            background:
              "linear-gradient(90deg, rgba(34,211,238,0.6), rgba(168,85,247,0.6))",
          }}
        />
        <div className="relative">{children}</div>
      </div>
    </label>
  );
}

export const LanguageSwitcher: React.FC<{
  locale: keyof typeof dict;
  setLocale: (l: keyof typeof dict) => void;
}> = ({ locale, setLocale }) => (
  <button
    onClick={() => setLocale(locale === "et" ? "en" : "et")}
    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 backdrop-blur hover:bg-white/10 transition"
    aria-label="Switch language"
    title="Switch language"
  >
    <Globe2 className="h-4 w-4" />
    <span className="uppercase">{locale}</span>
  </button>
);

const PasswordInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center">
      <Lock className="ml-3 h-4 w-4 text-white/60" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent px-3 py-3 text-white placeholder-white/30 outline-none"
        autoComplete="current-password"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="mr-3 rounded-md px-2 py-1 text-white/70 hover:text-white focus:outline-none"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

const EmailInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => (
  <div className="flex items-center">
    <Mail className="ml-3 h-4 w-4 text-white/60" />
    <input
      type="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent px-3 py-3 text-white placeholder-white/30 outline-none"
      autoComplete="email"
    />
  </div>
);

// =============================
// Põhi LOGIN
// =============================
export const FuturisticLogin: React.FC<LoginProps> = ({
  defaultLocale = "et",
  onSignIn,
  onForgotPassword,
  onRegister,
}) => {
  const [locale, setLocale] = useState<keyof typeof dict>(defaultLocale);
  const t = useMemo(() => dict[locale], [locale]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email) next.email = t.errors.emailRequired;
    else if (!emailRegex.test(email)) next.email = t.errors.emailInvalid;
    if (!password) next.password = t.errors.passwordRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    try {
      setLoading(true);
      await onSignIn?.({ email, password, remember, locale });
    } catch (err: any) {
      setFormError(err?.message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05060A]">
      <NeonBackground />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <motion.h1 className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
            {t.title}
          </motion.h1>
          <motion.p className="mt-3 max-w-md text-white/70">{t.subtitle}</motion.p>
        </div>
        <motion.div className="order-1 md:order-2">
          <div className="relative">
            <div className="pointer-events-none absolute -inset-0.5 rounded-[1.75rem] bg-gradient-to-r from-cyan-400/40 via-white/10 to-fuchsia-500/40 blur-xl" />
            <form
              onSubmit={handleSubmit}
              className="relative rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white/90">
                  {t.subtitle}
                </h2>
                <LanguageSwitcher locale={locale} setLocale={setLocale} />
              </div>
              <div className="space-y-5">
                <FieldWrapper label={t.email} icon={<Mail className="h-4 w-4" />}>
                  <EmailInput
                    value={email}
                    onChange={setEmail}
                    placeholder={t.emailPlaceholder}
                  />
                </FieldWrapper>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-300">{errors.email}</p>
                )}
                <FieldWrapper label={t.password} icon={<Lock className="h-4 w-4" />}>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder={t.passwordPlaceholder}
                  />
                </FieldWrapper>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-300">{errors.password}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer items-center gap-2 text-white/80">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-cyan-400"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    {t.remember}
                  </label>
                  <button
                    type="button"
                    onClick={() => onForgotPassword?.(email || undefined)}
                    className="text-cyan-300 hover:text-white"
                  >
                    {t.forgot}
                  </button>
                </div>
                {formError && (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                    {formError}
                  </div>
                )}
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-3 font-semibold text-white shadow-lg transition focus:outline-none disabled:opacity-60"
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? "…" : t.signIn}
                </motion.button>
                <div className="flex items-center gap-3 py-2 text-sm text-white/60">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="uppercase tracking-wider text-white/40">
                    {t.or}
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <button
                  type="button"
                  onClick={onRegister}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-medium text-white/90 hover:bg-white/10"
                >
                  {t.register}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// =============================
// Põhi REGISTER
// =============================
export const FuturisticRegister: React.FC<RegisterProps> = ({
  defaultLocale = "et",
  onCreateAccount,
  onGoToSignIn,
}) => {
  const [locale, setLocale] = useState<keyof typeof dict>(defaultLocale);
  const t = useMemo(() => dict[locale], [locale]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validate = () => {
    const next: {
      name?: string;
      email?: string;
      password?: string;
      confirm?: string;
    } = {};
    if (!email) next.email = t.errors.emailRequired;
    else if (!emailRegex.test(email)) next.email = t.errors.emailInvalid;
    if (!password) next.password = t.errors.passwordRequired;
    if (!confirm) next.confirm = t.errors.passwordRequired;
    if (password && confirm && password !== confirm)
      next.confirm = locale === "et" ? "Paroolid ei kattu" : "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    try {
      setLoading(true);
      await onCreateAccount?.({ email, password, name: name || undefined, locale });
    } catch (err: any) {
      setFormError(
        err?.message || (locale === "et" ? "Registreerimine ebaõnnestus" : "Registration failed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05060A]">
      <NeonBackground />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <motion.h1 className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
            {locale === "et" ? "Loo uus konto" : "Create a new account"}
          </motion.h1>
          <motion.p className="mt-3 max-w-md text-white/70">
            {locale === "et" ? "Liitu neon-maailmaga mõne klikiga." : "Join the neon world in a few clicks."}
          </motion.p>
        </div>
        <motion.div className="order-1 md:order-2">
          <div className="relative">
            <div className="pointer-events-none absolute -inset-0.5 rounded-[1.75rem] bg-gradient-to-r from-cyan-400/40 via-white/10 to-fuchsia-500/40 blur-xl" />
            <form
              onSubmit={handleSubmit}
              className="relative rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white/90">
                  {locale === "et" ? "Registreeru" : "Sign up"}
                </h2>
                <LanguageSwitcher locale={locale} setLocale={setLocale} />
              </div>
              <div className="space-y-5">
                <FieldWrapper label={locale === "et" ? "Nimi (valikuline)" : "Name (optional)"}>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={locale === "et" ? "Kuidas kutsuda?" : "How should we call you?"}
                      className="w-full bg-transparent px-3 py-3 text-white placeholder-white/30 outline-none"
                      autoComplete="name"
                    />
                  </div>
                </FieldWrapper>
                <FieldWrapper label={t.email} icon={<Mail className="h-4 w-4" />}>
                  <EmailInput
                    value={email}
                    onChange={setEmail}
                    placeholder={t.emailPlaceholder}
                  />
                </FieldWrapper>
                {errors.email && <p className="mt-1 text-xs text-rose-300">{errors.email}</p>}
                <FieldWrapper label={t.password} icon={<Lock className="h-4 w-4" />}>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder={t.passwordPlaceholder}
                  />
                </FieldWrapper>
                {errors.password && <p className="mt-1 text-xs text-rose-300">{errors.password}</p>}
                <FieldWrapper label={locale === "et" ? "Kinnita parool" : "Confirm password"}>
                  <PasswordInput
                    value={confirm}
                    onChange={setConfirm}
                    placeholder={t.passwordPlaceholder}
                  />
                </FieldWrapper>
                {errors.confirm && <p className="mt-1 text-xs text-rose-300">{errors.confirm}</p>}
                {formError && (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                    {formError}
                  </div>
                )}
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-3 font-semibold text-white shadow-lg transition focus:outline-none disabled:opacity-60"
                  whileTap={{ scale: 0.98 }}
                >
                  {locale === "et" ? "Loo konto" : "Create account"}
                </motion.button>
                <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                  <span>{locale === "et" ? "Juba konto olemas?" : "Already have an account?"}</span>
                  <button
                    type="button"
                    onClick={onGoToSignIn}
                    className="text-cyan-300 hover:text-white"
                  >
                    {locale === "et" ? "Logi sisse" : "Sign in"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// =============================
// Põhi FORGOT
// =============================
export const FuturisticForgot: React.FC<ForgotProps> = ({
  defaultLocale = "et",
  onRequestReset,
  onGoToSignIn,
}) => {
  const [locale, setLocale] = useState<keyof typeof dict>(defaultLocale);
  const t = useMemo(() => dict[locale], [locale]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const validate = () => {
    const next: { email?: string } = {};
    if (!email) next.email = t.errors.emailRequired;
    else if (!emailRegex.test(email)) next.email = t.errors.emailInvalid;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    try {
      setLoading(true);
      await onRequestReset?.({ email, locale });
      setDone(true);
    } catch (err: any) {
      setFormError(err?.message || (locale === "et" ? "Taotlus ebaõnnestus" : "Request failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05060A]">
      <NeonBackground />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <motion.h1 className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
            {locale === "et" ? "Taasta parool" : "Reset password"}
          </motion.h1>
          <motion.p className="mt-3 max-w-md text-white/70">
            {locale === "et"
              ? "Sisesta oma e-post ja saadame taastamise juhised."
              : "Enter your email and we'll send reset instructions."}
          </motion.p>
        </div>
        <motion.div className="order-1 md:order-2">
          <div className="relative">
            <div className="pointer-events-none absolute -inset-0.5 rounded-[1.75rem] bg-gradient-to-r from-cyan-400/40 via-white/10 to-fuchsia-500/40 blur-xl" />
            <form
              onSubmit={handleSubmit}
              className="relative rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white/90">{t.forgot}</h2>
                <LanguageSwitcher locale={locale} setLocale={setLocale} />
              </div>
              {!done ? (
                <div className="space-y-5">
                  <FieldWrapper label={t.email} icon={<Mail className="h-4 w-4" />}>
                    <EmailInput
                      value={email}
                      onChange={setEmail}
                      placeholder={t.emailPlaceholder}
                    />
                  </FieldWrapper>
                  {errors.email && <p className="mt-1 text-xs text-rose-300">{errors.email}</p>}
                  {formError && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                      {formError}
                    </div>
                  )}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-3 font-semibold text-white shadow-lg transition focus:outline-none disabled:opacity-60"
                    whileTap={{ scale: 0.98 }}
                  >
                    {locale === "et" ? "Saada link" : "Send link"}
                  </motion.button>
                  <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                    <button
                      type="button"
                      onClick={onGoToSignIn}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10"
                    >
                      {locale === "et" ? "Tagasi sisselogimisele" : "Back to sign in"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-white/80">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    {locale === "et"
                      ? "Kui aadress eksisteerib, saadeti juhised e-postile."
                      : "If the address exists, instructions were sent to your email."}
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={onGoToSignIn}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10"
                    >
                      {locale === "et" ? "Valmis — logi sisse" : "Done — sign in"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// =====================================================
// RHF + Zod skeemid
// =====================================================
const makeLoginSchema = (locale: keyof typeof dict) =>
  z.object({
    email: z
      .string({ required_error: dict[locale].errors.emailRequired })
      .email(dict[locale].errors.emailInvalid),
    password: z
      .string({ required_error: dict[locale].errors.passwordRequired })
      .min(1, dict[locale].errors.passwordRequired),
    remember: z.boolean().default(true),
  });

const makeRegisterSchema = (locale: keyof typeof dict) =>
  z
    .object({
      name: z.string().optional(),
      email: z
        .string({ required_error: dict[locale].errors.emailRequired })
        .email(dict[locale].errors.emailInvalid),
      password: z
        .string({ required_error: dict[locale].errors.passwordRequired })
        .min(6, locale === "et" ? "Vähemalt 6 märki" : "At least 6 characters"),
      confirm: z.string({ required_error: dict[locale].errors.passwordRequired }),
    })
    .refine((d) => d.password === d.confirm, {
      path: ["confirm"],
      message: locale === "et" ? "Paroolid ei kattu" : "Passwords do not match",
    });

const makeForgotSchema = (locale: keyof typeof dict) =>
  z.object({
    email: z
      .string({ required_error: dict[locale].errors.emailRequired })
      .email(dict[locale].errors.emailInvalid),
  });

// =====================================================
// RHF LOGIN
// =====================================================
export const FuturisticLoginRHF: React.FC<{
  defaultLocale?: keyof typeof dict;
  loginUrl?: string;
  onSignedIn?: (payload: { token?: string; email: string }) => void;
  onForgot?: () => void;
  onRegister?: () => void;
}> = ({
  defaultLocale = "et",
  loginUrl = "/api/auth/login",
  onSignedIn,
  onForgot,
  onRegister,
}) => {
  const [locale, setLocale] = useState<keyof typeof dict>(defaultLocale);
  const t = useMemo(() => dict[locale], [locale]);
  const schema = useMemo(() => makeLoginSchema(locale), [locale]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { remember: true },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          (locale === "et" ? "Sisselogimine ebaõnnestus" : "Sign-in failed");
        setError("password", { message: msg });
        return;
      }
      const json = await res.json().catch(() => ({}));
      onSignedIn?.({ token: json.token, email: data.email });
    } catch (e) {
      setError("password", { message: locale === "et" ? "Võrguviga" : "Network error" });
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05060A]">
      <NeonBackground />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <motion.h1 className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
            {t.title}
          </motion.h1>
          <motion.p className="mt-3 max-w-md text-white/70">{t.subtitle}</motion.p>
        </div>
        <motion.div className="order-1 md:order-2">
          <div className="relative">
            <div className="pointer-events-none absolute -inset-0.5 rounded-[1.75rem] bg-gradient-to-r from-cyan-400/40 via-white/10 to-fuchsia-500/40 blur-xl" />
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="relative rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white/90">{t.subtitle}</h2>
                <LanguageSwitcher locale={locale} setLocale={setLocale} />
              </div>
              <div className="space-y-5">
                <FieldWrapper label={t.email} icon={<Mail className="h-4 w-4" />}>
                  <input
                    {...register("email")}
                    placeholder={t.emailPlaceholder}
                    className="w-full bg-transparent px-3 py-3 text-white placeholder-white/30 outline-none"
                  />
                </FieldWrapper>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-300">{errors.email.message}</p>
                )}
                <FieldWrapper label={t.password} icon={<Lock className="h-4 w-4" />}>
                  <input
                    type="password"
                    {...register("password")}
                    placeholder={t.passwordPlaceholder}
                    className="w-full bg-transparent px-3 py-3 text-white placeholder-white/30 outline-none"
                  />
                </FieldWrapper>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-300">{errors.password.message}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer items-center gap-2 text-white/80">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-cyan-400"
                      {...register("remember")}
                      defaultChecked
                    />
                    {t.remember}
                  </label>
                  <button type="button" className="text-cyan-300 hover:text-white" onClick={onForgot}>
                    {t.forgot}
                  </button>
                </div>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-3 font-semibold text-white shadow-lg transition focus:outline-none disabled:opacity-60"
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? "…" : t.signIn}
                </motion.button>
                <div className="flex items-center gap-3 py-2 text-sm text-white/60">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="uppercase tracking-wider text-white/40">{t.or}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-medium text-white/90 hover:bg-white/10"
                  onClick={onRegister}
                >
                  {t.register}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// =====================================================
// RHF REGISTER
// =====================================================
export const FuturisticRegisterRHF: React.FC<{
  defaultLocale?: keyof typeof dict;
  registerUrl?: string;
  onRegistered?: (payload: { email: string }) => void;
  onGoToSignIn?: () => void;
}> = ({
  defaultLocale = "et",
  registerUrl = "/api/auth/register",
  onRegistered,
  onGoToSignIn,
}) => {
  const [locale, setLocale] = useState<keyof typeof dict>(defaultLocale);
  const t = useMemo(() => dict[locale], [locale]);
  const schema = useMemo(() => makeRegisterSchema(locale), [locale]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const res = await fetch(registerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password, name: data.name }),
      });
      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          (locale === "et" ? "Registreerimine ebaõnnestus" : "Registration failed");
        setError("confirm", { message: msg });
        return;
      }
      onRegistered?.({ email: data.email });
    } catch (e) {
      setError("confirm", { message: locale === "et" ? "Võrguviga" : "Network error" });
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05060A]">
      <NeonBackground />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <motion.h1 className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
            {locale === "et" ? "Loo uus konto" : "Create a new account"}
          </motion.h1>
          <motion.p className="mt-3 max-w-md text-white/70">
            {locale === "et" ? "Liitu neon-maailmaga mõne klikiga." : "Join the neon world in a few clicks."}
          </motion.p>
        </div>
        <motion.div className="order-1 md:order-2">
          <div className="relative">
            <div className="pointer-events-none absolute -inset-0.5 rounded-[1.75rem] bg-gradient-to-r from-cyan-400/40 via-white/10 to-fuchsia-500/40 blur-xl" />
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="relative rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white/90">
                  {locale === "et" ? "Registreeru" : "Sign up"}
                </h2>
                <LanguageSwitcher locale={locale} setLocale={setLocale} />
              </div>
              <div className="space-y-5">
                <FieldWrapper label={locale === "et" ? "Nimi (valikuline)" : "Name (optional)"}>
                  <input
                    {...register("name")}
                    placeholder={locale === "et" ? "Kuidas kutsuda?" : "How should we call you?"}
                    className="w-full bg-transparent px-3 py-3 text-white placeholder-white/30 outline-none"
                  />
                </FieldWrapper>
                <FieldWrapper label={t.email} icon={<Mail className="h-4 w-4" />}>
                  <input
                    {...register("email")}
                    placeholder={t.emailPlaceholder}
                    className="w-full bg-transparent px-3 py-3 text-white placeholder-white/30 outline-none"
                  />
                </FieldWrapper>
                {errors.email && <p className="mt-1 text-xs text-rose-300">{errors.email.message}</p>}
                <FieldWrapper label={t.password} icon={<Lock className="h-4 w-4" />}>
                  <input
                    type="password"
                    {...register("password")}
                    placeholder={t.passwordPlaceholder}
                    className="w-full bg-transparent px-3 py-3 text-white placeholder-white/30 outline-none"
                  />
                </FieldWrapper>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-300">{errors.password.message}</p>
                )}
                <FieldWrapper label={locale === "et" ? "Kinnita parool" : "Confirm password"}>
                  <input
                    type="password"
                    {...register("confirm")}
                    placeholder={t.passwordPlaceholder}
                    className="w-full bg-transparent px-3 py-3 text-white placeholder-white/30 outline-none"
                  />
                </FieldWrapper>
                {errors.confirm && (
                  <p className="mt-1 text-xs text-rose-300">{errors.confirm.message}</p>
                )}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-3 font-semibold text-white shadow-lg transition focus:outline-none disabled:opacity-60"
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (locale === "et" ? "Loon…" : "Creating…") : (locale === "et" ? "Loo konto" : "Create account")}
                </motion.button>
                <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                  <span>{locale === "et" ? "Juba konto olemas?" : "Already have an account?"}</span>
                  <button type="button" className="text-cyan-300 hover:text-white" onClick={onGoToSignIn}>
                    {locale === "et" ? "Logi sisse" : "Sign in"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// =====================================================
// RHF FORGOT
// =====================================================
export const FuturisticForgotRHF: React.FC<{
  defaultLocale?: keyof typeof dict;
  forgotUrl?: string;
  onRequested?: (payload: { email: string }) => void;
  onGoToSignIn?: () => void;
}> = ({
  defaultLocale = "et",
  forgotUrl = "/api/auth/forgot",
  onRequested,
  onGoToSignIn,
}) => {
  const [locale, setLocale] = useState<keyof typeof dict>(defaultLocale);
  const t = useMemo(() => dict[locale], [locale]);
  const schema = useMemo(() => makeForgotSchema(locale), [locale]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const res = await fetch(forgotUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      if (!res.ok) {
        const msg =
          (await res.json().catch(() => ({})))?.message ||
          (locale === "et" ? "Taotlus ebaõnnestus" : "Request failed");
        setError("email", { message: msg });
        return;
      }
      onRequested?.({ email: data.email });
    } catch (e) {
      setError("email", { message: locale === "et" ? "Võrguviga" : "Network error" });
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05060A]">
      <NeonBackground />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <motion.h1 className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
            {locale === "et" ? "Taasta parool" : "Reset password"}
          </motion.h1>
          <motion.p className="mt-3 max-w-md text-white/70">
            {locale === "et"
              ? "Sisesta oma e-post ja saadame taastamise juhised."
              : "Enter your email and we'll send reset instructions."}
          </motion.p>
        </div>
        <motion.div className="order-1 md:order-2">
          <div className="relative">
            <div className="pointer-events-none absolute -inset-0.5 rounded-[1.75rem] bg-gradient-to-r from-cyan-400/40 via-white/10 to-fuchsia-500/40 blur-xl" />
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="relative rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8"
            >
              <div className="mb-6 flex items-center justify_between">
                <h2 className="text-lg font-semibold text-white/90">{t.forgot}</h2>
                <LanguageSwitcher locale={locale} setLocale={setLocale} />
              </div>
              <div className="space-y-5">
                <FieldWrapper label={t.email} icon={<Mail className="h-4 w-4" />}>
                  <input
                    {...register("email")}
                    placeholder={t.emailPlaceholder}
                    className="w-full bg-transparent px-3 py-3 text-white placeholder-white/30 outline-none"
                  />
                </FieldWrapper>
                {errors.email && <p className="mt-1 text-xs text-rose-300">{errors.email.message}</p>}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-4 py-3 font-semibold text-white shadow-lg transition focus:outline-none disabled:opacity-60"
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (locale === "et" ? "Saadan…" : "Sending…") : (locale === "et" ? "Saada link" : "Send link")}
                </motion.button>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={onGoToSignIn}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10"
                  >
                    {locale === "et" ? "Tagasi sisselogimisele" : "Back to sign in"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// =====================================================
// Osakeste taust (Canvas 2D)
// =====================================================
export function NeonParticlesCanvas() {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const onResize = () => {
      w = (canvas.width = window.innerWidth);
      h = (canvas.height = window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    const COUNT = Math.min(120, Math.floor((w * h) / 25000));
    const particles = Array.from({ length: COUNT }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 1 + Math.random() * 1.5,
    }));
    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(5,6,10,0.15)";
      ctx.fillRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
        grad.addColorStop(0, "rgba(34,211,238,0.9)");
        grad.addColorStop(1, "rgba(124,58,237,0.0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i],
            b = particles[j];
          const dx = a.x - b.x,
            dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 140 * 140) {
            const alpha = 1 - d2 / (140 * 140);
            ctx.strokeStyle = `rgba(217,70,239,${alpha * 0.25})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 -z-10" />;
}

// =====================================================
// Three.js GLSL shader taust
// =====================================================
const NeonShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `precision highp float; varying vec2 vUv; uniform float u_time; uniform vec2 u_resolution;
  float sdLine(vec2 p, float a, float w){ float s = sin(a), c = cos(a); p = mat2(c,-s,s,c) * p; return abs(p.y) - w; }
  void main(){ vec2 uv = vUv; vec2 p = (uv - 0.5) * vec2(u_resolution.x/u_resolution.y, 1.0);
    float t = u_time * 0.6; float glow = 0.0;
    for (float i=-4.0; i<=4.0; i+=1.0){ float a = t*0.3 + i*0.2; float d = sdLine(p + vec2(0.0, sin(t + i)*0.1), a, 0.01); glow += 0.01 / (abs(d)+0.01); }
    vec3 col = mix(vec3(0.0), vec3(0.0,1.0,0.8), glow*0.6); col += vec3(0.7,0.2,1.0) * glow * 0.25; col = 1.0 - exp(-col); gl_FragColor = vec4(col, 1.0); }`,
  transparent: false,
});

function FullscreenQuad() {
  const ref = React.useRef<THREE.Mesh>(null);
  useFrame(({ clock, size }) => {
    (NeonShaderMaterial.uniforms as any).u_time.value = clock.getElapsedTime();
    (NeonShaderMaterial.uniforms as any).u_resolution.value.set(size.width, size.height);
  });
  return (
    <mesh ref={ref} scale={[2, 2, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      {/* @ts-ignore */}
      <primitive object={NeonShaderMaterial} attach="material" />
    </mesh>
  );
}

export function NeonShaderBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas orthographic dpr={[1, 2]}>
        <OrthographicCamera makeDefault position={[0, 0, 1]} zoom={300} />
        <FullscreenQuad />
      </Canvas>
    </div>
  );
}

// =====================================================
// shadcn/ui stiilis UI wrapperid
// =====================================================
export const FuturisticLoginUI: React.FC<LoginProps> = (props) => (
  <div className="relative min-h-screen w-full overflow-hidden bg-[#05060A]">
    <NeonBackground />
    <NeonParticlesCanvas />
    <div className="relative z-10 mx-auto grid min-h-screen max-w-5xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2">
      <div className="order-2 md:order-1">
        <motion.h1 className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
          HyperLogin
        </motion.h1>
        <p className="mt-3 max-w-md text-white/70">Cyber-neon powered access gateway.</p>
      </div>
      <div className="order-1 md:order-2">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-6 md:p-8">
            <FuturisticLogin {...props} />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export const FuturisticRegisterUI: React.FC<RegisterProps> = (props) => (
  <div className="relative min-h-screen w-full overflow-hidden bg-[#05060A]">
    <NeonBackground />
    <NeonParticlesCanvas />
    <div className="relative z-10 mx-auto grid min-h-screen max-w-5xl grid-cols-1 items_center gap-12 px-6 py-16 md:grid-cols-2">
      <div className="order-2 md:order-1">
        <motion.h1 className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
          Create account
        </motion.h1>
        <p className="mt-3 max-w-md text-white/70">Spin up your neon identity.</p>
      </div>
      <div className="order-1 md:order-2">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-6 md:p-8">
            <FuturisticRegister {...props} />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export const FuturisticForgotUI: React.FC<ForgotProps> = (props) => (
  <div className="relative min-h-screen w-full overflow-hidden bg-[#05060A]">
    <NeonBackground />
    <NeonParticlesCanvas />
    <div className="relative z-10 mx-auto grid min-h-screen max-w-5xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2">
      <div className="order-2 md:order-1">
        <motion.h1 className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
          Reset password
        </motion.h1>
        <p className="mt-3 max-w-md text_white/70">We’ll ping you a secure link.</p>
      </div>
      <div className="order-1 md:order-2">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-6 md:p-8">
            <FuturisticForgot {...props} />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// 3D shader taustaga RHF login wrapper
export const FuturisticLoginRHFUI_3D: React.FC<React.ComponentProps<typeof FuturisticLoginRHF>> = (props) => (
  <div className="relative min-h-screen w-full overflow-hidden bg-[#05060A]">
    <NeonShaderBackground />
    <FuturisticLoginRHF {...props} />
  </div>
);

// -----------------------------------------------
export default FuturisticLogin;
