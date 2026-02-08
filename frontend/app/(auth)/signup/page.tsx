"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"
import { Loader2 } from "lucide-react"
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react"
import Link from "next/link"
import { signup } from "@/lib/api/auth"
import { cn } from "@/lib/utils"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await signup(email, password, fullName)
      router.push("/login?registered=true")
    } catch (err: any) {
      setError(err.message || "That email is already registered")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuth = (provider: "google" | "github") => {
    setOauthLoading(provider)
    signIn(provider, { callbackUrl: "/auth/callback" })
  }

  const busy = isLoading || !!oauthLoading

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-primary/5 p-4">
      <div className="w-full max-w-lg rounded-none border border-border bg-card p-6 text-card-foreground shadow-sm md:rounded-2xl md:p-10">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="mx-auto flex h-20 w-28 items-center justify-center">
            <span className="block dark:hidden">
              <Logo variant="brand" mode="light" className="h-20 w-auto" priority />
            </span>
            <span className="hidden dark:block">
              <Logo variant="brand" mode="dark" className="h-20 w-auto" priority />
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground">Set up access to your AI chat workspace.</p>
        </div>

        <form onSubmit={handleSignup} className="mt-8 space-y-4">
          <LabelInputContainer>
            <label className="text-sm font-medium text-foreground">Full name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={busy} />
          </LabelInputContainer>

          <LabelInputContainer>
            <label className="text-sm font-medium text-foreground">Work email</label>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <label className="text-sm font-medium text-foreground">Password</label>
            <Input
              type="password"
              value={password}
              required
              minLength={4}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
          </LabelInputContainer>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className={cn(
              "h-11 w-full rounded-md bg-primary px-4 font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90",
              "disabled:opacity-70 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </span>
            ) : (
              "Create account \u2192"
            )}
          </button>

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            Or continue with
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <OAuthButton
              icon={<IconBrandGoogle className="h-4 w-4" />}
              label="Google"
              loading={oauthLoading === "google"}
              disabled={busy}
              onClick={() => handleOAuth("google")}
            />
            <OAuthButton
              icon={<IconBrandGithub className="h-4 w-4" />}
              label="GitHub"
              loading={oauthLoading === "github"}
              disabled={busy}
              onClick={() => handleOAuth("github")}
            />
          </div>

          <p className="mt-2 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

const OAuthButton = ({
  icon,
  label,
  loading,
  disabled,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-secondary px-4 font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80",
        "disabled:opacity-70 disabled:cursor-not-allowed"
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      <span className="text-sm">{label}</span>
    </button>
  )
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return <div className={cn("flex w-full flex-col space-y-2", className)}>{children}</div>
}
