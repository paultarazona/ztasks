import { useState, type FormEvent, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import * as authService from '../services/authService'
import { useAuthStore } from '../hooks/useAuthStore'

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function AuthBrandHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="text-center mb-6">
      <h1 className="text-5xl font-black text-brand-500 tracking-tighter leading-none">ztasks</h1>
      <p className="text-surface-500 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    if (needsVerification) {
      otpRefs.current[0]?.focus()
    }
  }, [needsVerification])

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const digits = pasted.split('')
      setOtp(digits)
      otpRefs.current[5]?.focus()
    }
  }

  const handleGoogleAuth = async () => {
    setError('')
    try {
      await authService.signInWithGoogle(`${window.location.origin}/dashboard`)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al iniciar sesión con Google'))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isLogin) {
        const { user } = await authService.signIn(email, password)
        setAuth(user)

        if (user) {
          const isAdmin = await authService.checkIsAdmin(user.id)
          navigate(isAdmin ? '/admin' : '/dashboard')
        } else {
          navigate('/dashboard')
        }
      } else {
        const { user, requireEmailVerification } = await authService.signUp(email, password)
        if (requireEmailVerification) {
          setNeedsVerification(true)
          setSuccess('Te enviamos un código de verificación a tu email. Revisá tu bandeja de entrada.')
        } else {
          setAuth(user)
          navigate('/dashboard')
        }
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Ocurrió un error'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) {
      setError('Ingresá el código completo de 6 dígitos')
      return
    }
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { user } = await authService.verifyOTP(email, code)
      setAuth(user)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Código inválido o expirado'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await authService.resendOTP(email)
      setSuccess('Reenviamos el código. Revisá tu email.')
    } catch {
      setSuccess('Reenviamos el código. Revisá tu email.')
    } finally {
      setLoading(false)
    }
  }

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-surface-50 text-surface-800 selection:bg-brand-500 selection:text-white font-sans grid-pattern relative overflow-hidden flex items-center justify-center px-4">
        {/* Decorative radial glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] radial-glow-violet opacity-35 pointer-events-none blur-[100px]" />
        <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] radial-glow-blue opacity-30 pointer-events-none blur-[120px]" />

        <div className="w-full max-w-md relative z-10">
          {/* Botón Volver */}
          <button
            type="button"
            onClick={() => { setNeedsVerification(false); setError(''); setSuccess(''); setOtp(['', '', '', '', '', '']) }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-surface-400 hover:text-brand-500 transition-colors mb-4 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Volver al registro
          </button>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-surface-200/80 p-8 shadow-2xl shadow-surface-300/40 relative group/card">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-tr from-brand-500/5 via-transparent to-brand-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <AuthBrandHeader subtitle="Verificá tu email" />

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-brand-100">
                <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs text-surface-500">
                Ingresá el código de 6 dígitos que enviamos a
              </p>
              <p className="text-sm font-bold text-surface-800 mt-1">{email}</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold border border-surface-200 bg-white text-surface-950 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs font-semibold text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-150 rounded-xl text-xs font-semibold text-green-600">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-500/10 border border-brand-400/10 transition-all text-sm font-bold hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Verificando...
                  </span>
                ) : (
                  'Verificar email'
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-xs text-brand-500 hover:text-brand-600 hover:underline font-bold disabled:opacity-50"
              >
                Reenviar código
              </button>
              <br />
              <button
                type="button"
                onClick={() => { setNeedsVerification(false); setError(''); setSuccess(''); setOtp(['', '', '', '', '', '']) }}
                className="text-xs text-surface-400 hover:text-surface-500 font-medium transition-colors"
              >
                Volver al registro
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50 text-surface-800 selection:bg-brand-500 selection:text-white font-sans grid-pattern relative overflow-hidden flex items-center justify-center px-4">
      {/* Decorative radial glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] radial-glow-violet opacity-35 pointer-events-none blur-[100px]" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] radial-glow-blue opacity-30 pointer-events-none blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Botón Volver */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-surface-400 hover:text-brand-500 transition-colors mb-4 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Volver
        </Link>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-surface-200/80 p-8 shadow-2xl shadow-surface-300/40 relative group/card">
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-tr from-brand-500/5 via-transparent to-brand-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <AuthBrandHeader subtitle={isLogin ? 'Iniciá sesión para continuar' : 'Creá tu cuenta'} />

          <div className="flex mb-6 bg-surface-100 rounded-xl p-1 border border-surface-200/40">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError('') }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isLogin 
                  ? 'bg-white text-surface-900 shadow-sm border border-surface-200/20' 
                  : 'text-surface-400 hover:text-surface-500 hover:bg-surface-50/50'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError('') }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isLogin 
                  ? 'bg-white text-surface-900 shadow-sm border border-surface-200/20' 
                  : 'text-surface-400 hover:text-surface-500 hover:bg-surface-50/50'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-3.5 py-2 border border-surface-200 bg-white text-surface-950 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 placeholder:text-surface-400/70 transition-all font-sans"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3.5 py-2 border border-surface-200 bg-white text-surface-950 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 placeholder:text-surface-400/70 transition-all font-sans"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-150 rounded-xl text-xs font-semibold text-green-600">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-500/10 border border-brand-400/10 transition-all text-sm font-bold hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Cargando...
                </span>
              ) : isLogin ? (
                'Iniciar sesión'
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-surface-200 bg-white hover:bg-surface-50 text-surface-700 rounded-xl transition-all text-sm font-bold hover:border-surface-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuar con Google
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-surface-400">
            {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              className="text-brand-500 hover:text-brand-600 font-bold transition-colors"
            >
              {isLogin ? 'Registrate' : 'Iniciá sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
