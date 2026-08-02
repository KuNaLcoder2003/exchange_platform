/**
 * AuthPage.tsx
 * -----------------------------------------------------------------------
 * Sign in / sign up page for Vaultline — split layout with a branded
 * vector panel on the left and a form card on the right. Same dark
 * obsidian + copper theme, Bricolage Grotesque / Instrument Sans fonts
 * as the rest of the app.
 *
 * SETUP — same as the other components in this project:
 * 1) Tailwind v3+ installed, fonts linked in index.html (see the header
 *    comment in LandingPage.tsx for the exact <link> tag).
 * 2) If you're using the router from App.tsx, add a route:
 *
 *      <Route path="/auth" element={<AuthPage />} />
 *
 * This component manages its own local form state and calls an
 * `onSubmit` prop with the collected fields — wire that up to your
 * actual auth call (REST endpoint, Supabase, NextAuth, etc).
 * -----------------------------------------------------------------------
 */

import React, { useState } from "react";
import { Toaster } from 'react-hot-toast';
import { useAuth } from "../context/AuthContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthMode = "signin" | "signup";
type Gender = "MALE" | "FEMALE";

interface AuthFormValues {
    name?: string;
    mobileNumber?: string;
    gender?: Gender;
    /** ISO date string, e.g. "2026-07-26" — matches what <input type="date"> emits. */
    dob?: string;
    email: string;
    password: string;
}

interface AuthPageProps {
    onSubmit?: (mode: AuthMode, values: AuthFormValues) => void;
    /** Called when a wallet-connect or social button is pressed. */
    onProvider?: (provider: "google" | "wallet") => void;
}

// ---------------------------------------------------------------------------
// Original vector artwork — reuses the vault-dial motif from MarketHero,
// scaled up as a full-bleed left-panel background. No third-party imagery.
// ---------------------------------------------------------------------------

const BackgroundField: React.FC = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0a0a0d]">
        <div className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#ff7a45]/25 blur-[110px]" />
        <div className="absolute -right-32 top-1/3 h-[380px] w-[380px] rounded-full bg-[#4a3aff]/15 blur-[110px]" />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[300px] rounded-full bg-[#ffb37a]/10 blur-[100px]" />
        <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
            }}
        />
    </div>
);

/** A small floating badge chip, used to frame the main card with supporting detail. */
const FloatChip: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = "", children }) => (
    <div
        className={`absolute flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#14141a]/90 px-3 py-2 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.6)] backdrop-blur-md ${className}`}
    >
        {children}
    </div>
);

/** The centerpiece visual: a tilted glass card showing a live-looking price + mini chart. */
const FloatingChartCard: React.FC = () => (
    <div className="relative mx-auto h-[280px] w-full max-w-[380px]">
        <FloatChip className="left-2 top-2 -rotate-6">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-[#ff7a45]">
                <path d="m5 12 5 5 9-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-body text-xs font-medium text-white/75">Non-custodial</span>
        </FloatChip>

        <FloatChip className="bottom-4 right-0 rotate-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-body text-xs font-medium text-white/75">Matching · 4ms</span>
        </FloatChip>

        <div className="absolute left-1/2 top-1/2 w-[300px] -translate-x-1/2 -translate-y-1/2 -rotate-2 rounded-3xl border border-white/10 bg-[#101015]/95 p-5 shadow-[0_40px_90px_-20px_rgba(255,122,69,0.3)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 font-body text-[10px] font-semibold text-white/70">
                        S
                    </div>
                    <span className="font-body text-sm text-white/80">SOL / USDC</span>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-body text-xs font-medium text-emerald-400">
                    +4.28%
                </span>
            </div>

            <div className="mt-3 font-display text-3xl font-semibold text-white">$169.55</div>

            <svg viewBox="0 0 280 84" className="mt-4 h-20 w-full" fill="none">
                <defs>
                    <linearGradient id="chartStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ffb37a" />
                        <stop offset="100%" stopColor="#ff7a45" />
                    </linearGradient>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff7a45" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#ff7a45" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d="M0,58 C22,46 38,64 60,50 C82,36 96,56 118,42 C140,28 154,50 176,34 C198,18 214,40 236,24 C250,16 264,26 280,14 L280,84 L0,84 Z"
                    fill="url(#chartFill)"
                />
                <path
                    d="M0,58 C22,46 38,64 60,50 C82,36 96,56 118,42 C140,28 154,50 176,34 C198,18 214,40 236,24 C250,16 264,26 280,14"
                    stroke="url(#chartStroke)"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>

            <div className="mt-3 flex items-center justify-between font-body text-xs text-white/40">
                <span>24h vol · $612.2M</span>
                <span>7d</span>
            </div>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Small form primitives
// ---------------------------------------------------------------------------

const FieldLabel: React.FC<{ children: React.ReactNode; htmlFor: string }> = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} className="mb-1.5 block font-body text-xs font-medium text-white/60">
        {children}
    </label>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className={`w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 font-body text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#ff7a45]/50 focus:bg-white/[0.06] ${props.className ?? ""
            }`}
    />
);

const SocialButton: React.FC<{ onClick?: () => void; children: React.ReactNode }> = ({
    onClick,
    children,
}) => (
    <button
        type="button"
        onClick={onClick}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-body text-sm font-medium text-white/80 transition-colors hover:border-white/25 hover:bg-white/[0.06]"
    >
        {children}
    </button>
);

/** Real radio inputs (not fake buttons), wrapped in a themed card so they still match the UI. */
const GenderRadioGroup: React.FC<{
    value?: Gender;
    onChange: (gender: Gender) => void;
}> = ({ value, onChange }) => (
    <div>
        <FieldLabel htmlFor="gender-male">Gender</FieldLabel>
        <div className="flex gap-3">
            {(["MALE", "FEMALE"] as Gender[]).map((g) => {
                const id = `gender-${g.toLowerCase()}`;
                const selected = value === g;
                return (
                    <label
                        key={g}
                        htmlFor={id}
                        className={`flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 font-body text-sm transition-colors ${selected
                            ? "border-[#ff7a45]/60 bg-[#ff7a45]/10 text-white"
                            : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/25"
                            }`}
                    >
                        <input
                            id={id}
                            type="radio"
                            name="gender"
                            value={g}
                            checked={selected}
                            onChange={() => onChange(g)}
                            className="h-3.5 w-3.5 accent-[#ff7a45]"
                        />
                        {g === "MALE" ? "Male" : "Female"}
                    </label>
                );
            })}
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------



const AuthPage: React.FC<AuthPageProps> = () => {
    const { signin, signup } = useAuth()
    const [mode, setMode] = useState<AuthMode>("signin");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(true);
    const [values, setValues] = useState<AuthFormValues>({ name: "", email: "", password: "", gender: 'MALE', dob: "", mobileNumber: "" });
    const [submitting, setSubmitting] = useState(false);

    const update = (field: keyof AuthFormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setValues((v) => ({ ...v, [field]: e.target.value }));

    const setGender = (gender: Gender) => setValues((v) => ({ ...v, gender }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            switch (mode) {
                case "signin":
                    await signin(values.email, values.password)
                    break;
                case "signup":
                    await signup(values.name, values.email, values.password, values.mobileNumber, values.gender, values.dob)
                    break
                default:
                    break;
            }
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <div className="grid min-h-screen bg-[#0a0a0d] font-body text-white lg:grid-cols-2">
            <Toaster />
            {/* left — brand panel */}
            <div className="relative hidden overflow-hidden lg:block">
                <BackgroundField />

                <div className="relative z-10 flex h-full flex-col p-12">
                    <a href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff7a45]">
                            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#0a0a0d]">
                                <path d="M12 2 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-4Z" fill="currentColor" />
                            </svg>
                        </div>
                        <span className="font-display text-lg font-semibold tracking-tight text-white">
                            Vaultline
                        </span>
                    </a>

                    <div className="flex flex-1 items-center justify-center">
                        <FloatingChartCard />
                    </div>

                    <div className="max-w-sm">
                        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white">
                            Trade with the keys still in your hand.
                        </h1>
                        <p className="mt-4 font-body text-sm text-white/55">
                            Spot, perpetuals, and self-custody in one account — built for
                            speed, secured like a vault.
                        </p>

                        <ul className="mt-8 space-y-3">
                            {["Non-custodial by default", "Sub-millisecond matching engine", "Proof of reserves, published"].map(
                                (item) => (
                                    <li key={item} className="flex items-center gap-3 font-body text-sm text-white/70">
                                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[#ff7a45]">
                                            <path d="m5 12 5 5 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        {item}
                                    </li>
                                )
                            )}
                        </ul>
                    </div>

                    <p className="mt-10 font-body text-xs text-white/30">© {new Date().getFullYear()} Vaultline. All rights reserved.</p>
                </div>
            </div>

            {/* right — form panel */}
            <div className="flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-sm">
                    {/* mobile logo */}
                    <a href="/" className="mb-8 flex items-center gap-2 lg:hidden">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff7a45]">
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#0a0a0d]">
                                <path d="M12 2 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-4Z" fill="currentColor" />
                            </svg>
                        </div>
                        <span className="font-display text-base font-semibold tracking-tight text-white">Vaultline</span>
                    </a>

                    {/* mode tabs */}
                    <div className="mb-8 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                        {(["signin", "signup"] as AuthMode[]).map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMode(m)}
                                className={`flex-1 rounded-lg py-2 font-body text-sm font-medium transition-colors ${mode === m ? "bg-[#ff7a45] text-[#0a0a0d]" : "text-white/50 hover:text-white/80"
                                    }`}
                            >
                                {m === "signin" ? "Sign in" : "Create account"}
                            </button>
                        ))}
                    </div>

                    <h2 className="font-display text-2xl font-semibold tracking-tight text-white">
                        {mode === "signin" ? "Welcome back" : "Start trading in minutes"}
                    </h2>
                    <p className="mt-1.5 font-body text-sm text-white/50">
                        {mode === "signin"
                            ? "Enter your details to access your account."
                            : "No paperwork, no minimum deposit."}
                    </p>

                    <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                        {mode === "signup" && (
                            <div className="space-y-4">
                                <div>
                                    <FieldLabel htmlFor="name">Full name</FieldLabel>
                                    <TextInput
                                        id="name"
                                        type="text"
                                        placeholder="Ada Lovelace"
                                        value={values.name}
                                        onChange={update("name")}
                                        required
                                    />
                                </div>
                                <div>
                                    <FieldLabel htmlFor="mobile">Mobile number</FieldLabel>
                                    <TextInput
                                        id="mobile"
                                        type="tel"
                                        placeholder="+91-xxxxx xxxxx"
                                        value={values.mobileNumber}
                                        onChange={update("mobileNumber")}
                                        required
                                    />
                                </div>

                                <GenderRadioGroup value={values.gender} onChange={setGender} />

                                <div>
                                    <FieldLabel htmlFor="dob">Date of birth</FieldLabel>
                                    <TextInput
                                        id="dob"
                                        type="date"
                                        value={values.dob}
                                        onChange={update("dob")}
                                        max={new Date().toISOString().split("T")[0]}
                                        required
                                        // makes the native calendar popup + icon render in a dark
                                        // theme instead of clashing with the dark input background
                                        className="[color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <TextInput
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={values.email}
                                onChange={update("email")}
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                {mode === "signin" && (
                                    <button type="button" className="mb-1.5 font-body text-xs text-[#ff7a45] hover:text-[#ffb37a]">
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <TextInput
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={values.password}
                                    onChange={update("password")}
                                    className="pr-10"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                                            <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M6.5 6.7C4.4 8.1 2.9 10 2 12c1.6 3.6 5.5 7 10 7 1.6 0 3.1-.4 4.4-1.1M9.9 4.2A10.6 10.6 0 0 1 12 4c4.5 0 8.4 3.4 10 7-.5 1.1-1.2 2.2-2.1 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                                            <path d="M2 12c1.6-3.6 5.5-7 10-7s8.4 3.4 10 7c-1.6 3.6-5.5 7-10 7s-8.4-3.4-10-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {mode === "signin" ? (
                            <label className="flex items-center gap-2 pt-1 font-body text-xs text-white/50">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-[#ff7a45]"
                                />
                                Keep me signed in
                            </label>
                        ) : (
                            <p className="pt-1 font-body text-xs leading-relaxed text-white/40">
                                By creating an account you agree to Vaultline's{" "}
                                <a href="#" className="text-white/60 underline underline-offset-2 hover:text-white">
                                    Terms
                                </a>{" "}
                                and{" "}
                                <a href="#" className="text-white/60 underline underline-offset-2 hover:text-white">
                                    Privacy Policy
                                </a>
                                .
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="group relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-xl bg-[#ff7a45] py-2.5 font-body text-sm font-semibold text-[#0a0a0d] transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                        >
                            {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-3">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="font-body text-xs text-white/30">or continue with</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className="flex gap-3">
                        <SocialButton>
                            <svg viewBox="0 0 24 24" className="h-4 w-4">
                                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.6 14.7 2.6 12 2.6 6.9 2.6 2.7 6.8 2.7 12S6.9 21.4 12 21.4c6.9 0 9.3-4.9 9.3-7.4 0-.5-.05-.9-.13-1.3H12Z" />
                            </svg>
                            Google
                        </SocialButton>
                        <SocialButton >
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#ff7a45]">
                                <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
                                <path d="M3 10h18M15 14h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                            Wallet
                        </SocialButton>
                    </div>

                    <p className="mt-8 text-center font-body text-sm text-white/40">
                        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                            className="font-medium text-[#ff7a45] hover:text-[#ffb37a]"
                        >
                            {mode === "signin" ? "Create one" : "Sign in"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;