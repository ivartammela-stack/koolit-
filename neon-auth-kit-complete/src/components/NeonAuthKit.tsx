import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'

type SubmitFn = (data: Record<string, unknown>) => void

function NeonBackground({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(600px_200px_at_10%_10%,rgba(34,211,238,0.12),transparent),radial-gradient(600px_200px_at_90%_20%,rgba(217,70,239,0.12),transparent)]" />
        <div className="absolute inset-0 mix-blend-screen opacity-40" style={{
          backgroundImage:
            'conic-gradient(from 180deg at 50% 50%, rgba(34,211,238,0.15), rgba(217,70,239,0.15), rgba(34,211,238,0.15))'
        }} />
      </div>
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
        <Card className="w-full border-white/10 bg-white/5">
          <CardContent>
            <h1 className="mb-6 bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-center text-2xl font-semibold text-transparent">
              {title}
            </h1>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// LOGIN
const loginSchema = z.object({
  email: z.string().email('Sisesta korrektne e-post'),
  password: z.string().min(6, 'Parool vähemalt 6 märki')
})
type LoginValues = z.infer<typeof loginSchema>

export function FuturisticLoginRHFUI_3D({ loginUrl, onSubmit }: { loginUrl?: string; onSubmit?: SubmitFn }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  })

  const submit = async (vals: LoginValues) => {
    try {
      if (onSubmit) return onSubmit(vals)
      // Demo: lihtsalt logime konsooli. Siin saaks teha päringu loginUrl-i
      console.log('LOGIN →', { loginUrl, ...vals })
      alert('Login submit (demo)')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <NeonBackground title="Logi sisse">
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <div>
          <Label htmlFor="email">E-post</Label>
          <Input id="email" type="email" placeholder="sina@kool.ee" {...register('email')} />
          {errors.email && <p className="mt-1 text-sm text-pink-300">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Parool</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="mt-1 text-sm text-pink-300">{errors.password.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Sisenen…' : 'Logi sisse'}</Button>
        <div className="mt-2 text-center text-sm text-cyan-200/80">
          <a className="underline decoration-cyan-500/40 underline-offset-4 hover:text-white" href="/forgot">Unustasid parooli?</a>
        </div>
      </form>
    </NeonBackground>
  )
}

// REGISTER
const regSchema = z.object({
  name: z.string().min(2, 'Nimi liiga lühike'),
  email: z.string().email('Sisesta korrektne e-post'),
  password: z.string().min(6, 'Parool vähemalt 6 märki')
})
type RegValues = z.infer<typeof regSchema>

export function FuturisticRegisterRHF({ registerUrl, onSubmit }: { registerUrl?: string; onSubmit?: SubmitFn }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegValues>({
    resolver: zodResolver(regSchema),
    defaultValues: { name: '', email: '', password: '' }
  })

  const submit = async (vals: RegValues) => {
    try {
      if (onSubmit) return onSubmit(vals)
      console.log('REGISTER →', { registerUrl, ...vals })
      alert('Register submit (demo)')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <NeonBackground title="Loo konto">
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <div>
          <Label htmlFor="name">Nimi</Label>
          <Input id="name" placeholder="Mari Mets" {...register('name')} />
          {errors.name && <p className="mt-1 text-sm text-pink-300">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="remail">E-post</Label>
          <Input id="remail" type="email" placeholder="sina@kool.ee" {...register('email')} />
          {errors.email && <p className="mt-1 text-sm text-pink-300">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="rpassword">Parool</Label>
          <Input id="rpassword" type="password" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="mt-1 text-sm text-pink-300">{errors.password.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Loon…' : 'Loo konto'}</Button>
        <div className="mt-2 text-center text-sm text-cyan-200/80">
          <a className="underline decoration-cyan-500/40 underline-offset-4 hover:text-white" href="/login">Tagasi sisse logima</a>
        </div>
      </form>
    </NeonBackground>
  )
}

// FORGOT
const forgotSchema = z.object({ email: z.string().email('Sisesta korrektne e-post') })
type ForgotValues = z.infer<typeof forgotSchema>

export function FuturisticForgotRHF({ forgotUrl, onSubmit }: { forgotUrl?: string; onSubmit?: SubmitFn }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' }
  })

  const submit = async (vals: ForgotValues) => {
    try {
      if (onSubmit) return onSubmit(vals)
      console.log('FORGOT →', { forgotUrl, ...vals })
      alert('Parooli taastamise link (demo)')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <NeonBackground title="Taasta parool">
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <div>
          <Label htmlFor="femail">E-post</Label>
          <Input id="femail" type="email" placeholder="sina@kool.ee" {...register('email')} />
          {errors.email && <p className="mt-1 text-sm text-pink-300">{errors.email.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Saadan…' : 'Saada link'}</Button>
        <div className="mt-2 text-center text-sm text-cyan-200/80">
          <a className="underline decoration-cyan-500/40 underline-offset-4 hover:text-white" href="/login">Tagasi</a>
        </div>
      </form>
    </NeonBackground>
  )
}

export default FuturisticLoginRHFUI_3D
