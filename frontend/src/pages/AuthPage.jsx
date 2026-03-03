import { useEffect, useState } from 'react';
import { api, BACKEND_ORIGIN } from '../lib/api.js';

function isStrongPassword(password) {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

export function AuthPage({ onAuth, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [registerStep, setRegisterStep] = useState('details'); // 'details' | 'verify'
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [loginPasswordTouched, setLoginPasswordTouched] = useState(false);
  const [registerPasswordTouched, setRegisterPasswordTouched] = useState(false);
  const [registerConfirmTouched, setRegisterConfirmTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    if (authError) {
      setError('Google sign-in failed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setRegisterStep('details');
    setRegisterForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      otp: ''
    });
    setLoginForm({
      email: '',
      password: ''
    });
    setLoginPasswordTouched(false);
    setRegisterPasswordTouched(false);
    setRegisterConfirmTouched(false);
  }, [initialMode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Demo Login credentials
    if (
      mode === 'login' &&
      loginForm.email === 'demo@example.com' &&
      loginForm.password === 'password123'
    ) {
      setTimeout(() => {
        onAuth({
          id: 'demo-user-1',
          name: 'Demo Farmer',
          email: 'demo@example.com',
          role: 'farmer'
        });
        setLoading(false);
      }, 600);
      return;
    }

    // Registration via OTP (single flow: enter details -> send OTP -> verify)
    if (mode === 'register') {
      if (registerStep === 'details') {
        if (!isStrongPassword(registerForm.password)) {
          setError(
            'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
          );
          setLoading(false);
          return;
        }

        if (registerForm.password !== registerForm.confirmPassword) {
          setError('Password and confirm password must match.');
          setLoading(false);
          return;
        }

        try {
          await api.post('/auth/request-otp', {
            email: registerForm.email,
            name: registerForm.name || undefined
          });
          setRegisterStep('verify');
          setError('');
        } catch (err) {
          setError(err?.response?.data?.message || 'Failed to send OTP.');
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        const res = await api.post('/auth/verify-otp', {
          email: registerForm.email,
          otp: registerForm.otp,
          name: registerForm.name || undefined,
          password: registerForm.password
        });
        onAuth(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Invalid or expired OTP.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Email/password login
    try {
      const payload = { email: loginForm.email, password: loginForm.password };
      const res = await api.post('/auth/login', payload);
      onAuth(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleClick() {
    window.location.href = `${BACKEND_ORIGIN}/api/auth/google`;
  }

  function switchMode(newMode) {
    setMode(newMode);
    setError('');
    setRegisterStep('details');
    setRegisterForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      otp: ''
    });
  }

  function updateLoginField(field, value) {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'password') {
      setLoginPasswordTouched(true);
    }
  }

  function updateRegisterField(field, value) {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'password') {
      setRegisterPasswordTouched(true);
    }
    if (field === 'confirmPassword') {
      setRegisterConfirmTouched(true);
    }
  }

  const showPassword = mode === 'login';
  const showName = mode === 'register';
  const registerPasswordInvalid =
    registerPasswordTouched && registerStep === 'details' && !isStrongPassword(registerForm.password);
  const registerConfirmInvalid =
    registerConfirmTouched &&
    registerStep === 'details' &&
    registerForm.confirmPassword !== registerForm.password;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-emerald-100 to-teal-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-emerald-100">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Rural <span className="text-emerald-600">Ledger</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Smart bill &amp; interest tracker for farmers &amp; shopkeepers
          </p>
        </div>

        <div className="mb-6 flex rounded-lg bg-slate-100 p-1 font-medium shadow-inner">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={
              'flex-1 rounded-md py-2 text-sm transition-all ' +
              (mode === 'login'
                ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200 font-semibold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
            }
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={
              'flex-1 rounded-md py-2 text-sm transition-all ' +
              (mode === 'register'
                ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200 font-semibold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
            }
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {showName && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input
                type="text"
                required={mode === 'register'}
                value={registerForm.name}
                onChange={(e) => updateRegisterField('name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                placeholder="Your name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={mode === 'login' ? loginForm.email : registerForm.email}
              onChange={(e) =>
                mode === 'login'
                  ? updateLoginField('email', e.target.value)
                  : updateRegisterField('email', e.target.value)
              }
              disabled={mode === 'register' && registerStep === 'verify'}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="you@example.com"
            />
          </div>

          {showPassword && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required={mode === 'login'}
                  minLength={6}
                  value={loginForm.password}
                  onChange={(e) => updateLoginField('password', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {showLoginPassword ? (
                      <>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M3 3l18 18M10.477 10.489A3 3 0 0012 15a3 3 0 002.533-4.567M9.88 9.88L7.05 7.05M9.88 9.88C10.582 9.178 11.527 8.75 12.5 8.75c.473 0 .927.093 1.342.262M6.228 6.228C4.358 7.343 2.96 8.98 2 12c1.5 4 4.5 6.5 10 6.5 1.86 0 3.442-.313 4.772-.892M17.772 17.772C19.642 16.657 21.04 15.02 22 12c-1.5-4-4.5-6.5-10-6.5-1.237 0-2.36.128-3.37.372"
                        />
                      </>
                    ) : (
                      <>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M2 12s2.5-6.5 10-6.5S22 12 22 12s-2.5 6.5-10 6.5S2 12 2 12z"
                        />
                        <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    required={registerStep === 'details'}
                    minLength={8}
                    value={registerForm.password}
                    onChange={(e) => updateRegisterField('password', e.target.value)}
                  className={
                    'w-full rounded-lg border px-4 py-2.5 pr-10 text-sm outline-none transition-colors ' +
                    (registerPasswordInvalid
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200')
                  }
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500"
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {showRegisterPassword ? (
                      <>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M3 3l18 18M10.477 10.489A3 3 0 0012 15a3 3 0 002.533-4.567M9.88 9.88L7.05 7.05M9.88 9.88C10.582 9.178 11.527 8.75 12.5 8.75c.473 0 .927.093 1.342.262M6.228 6.228C4.358 7.343 2.96 8.98 2 12c1.5 4 4.5 6.5 10 6.5 1.86 0 3.442-.313 4.772-.892M17.772 17.772C19.642 16.657 21.04 15.02 22 12c-1.5-4-4.5-6.5-10-6.5-1.237 0-2.36.128-3.37.372"
                        />
                      </>
                    ) : (
                      <>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M2 12s2.5-6.5 10-6.5S22 12 22 12s-2.5 6.5-10 6.5S2 12 2 12z"
                        />
                        <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
                      </>
                    )}
                  </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Enter password again
                </label>
                <div className="relative">
                  <input
                    type={showRegisterConfirmPassword ? 'text' : 'password'}
                    required={registerStep === 'details'}
                    minLength={8}
                    value={registerForm.confirmPassword}
                    onChange={(e) => updateRegisterField('confirmPassword', e.target.value)}
                    className={
                      'w-full rounded-lg border px-4 py-2.5 pr-10 text-sm outline-none transition-colors ' +
                      (registerConfirmInvalid
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200')
                    }
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {showRegisterConfirmPassword ? (
                        <>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M3 3l18 18M10.477 10.489A3 3 0 0012 15a3 3 0 002.533-4.567M9.88 9.88L7.05 7.05M9.88 9.88C10.582 9.178 11.527 8.75 12.5 8.75c.473 0 .927.093 1.342.262M6.228 6.228C4.358 7.343 2.96 8.98 2 12c1.5 4 4.5 6.5 10 6.5 1.86 0 3.442-.313 4.772-.892M17.772 17.772C19.642 16.657 21.04 15.02 22 12c-1.5-4-4.5-6.5-10-6.5-1.237 0-2.36.128-3.37.372"
                          />
                        </>
                      ) : (
                        <>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M2 12s2.5-6.5 10-6.5S22 12 22 12s-2.5 6.5-10 6.5S2 12 2 12z"
                          />
                          <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'register' && registerStep === 'verify' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Enter 6-digit OTP sent to your email
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={registerForm.otp}
                onChange={(e) =>
                  updateRegisterField('otp', e.target.value.replace(/\D/g, ''))
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-center tracking-[0.5em] font-mono text-lg"
                placeholder="000000"
              />
              <button
                type="button"
                onClick={() => setRegisterStep('details')}
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                Change email
              </button>
            </div>
          )}

          {/* {mode === 'login' && (
            <div className="rounded-md bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-100">
              <p className="font-semibold mb-1">Demo:</p>
              <p>Email: <b>demo@example.com</b> · Password: <b>password123</b></p>
            </div>
          )} */}  

          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {loading
              ? 'Please wait…'
              : mode === 'register'
                ? registerStep === 'details'
                  ? 'Send OTP'
                  : 'Verify & Sign up'
                : 'Sign in'}
          </button>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-500">or</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGoogleClick}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
