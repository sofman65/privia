"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"
import { Loader2 } from "lucide-react"
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react"
import Link from "next/link"
import { login } from "@/lib/api/auth"
import { storeAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const data = await login(email, password)
      storeAuth(data.access_token, data.user)
      router.push("/app")
    } catch (err: any) {
      setError(err.message || "Check your credentials and try again")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="shadow-input w-full max-w-lg rounded-none bg-white p-6 md:rounded-2xl md:p-10 dark:bg-black border border-border/60">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="mx-auto flex h-20 w-28 items-center justify-center">
            <Logo variant="brand" mode="light" className="h-20 w-auto" priority />
          </div>
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-sm text-muted-foreground">
            Privacy-aware AI chat workspace for product teams.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <LabelInputContainer>
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Work email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </LabelInputContainer>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "group/btn relative block h-11 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white",
              "shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset]",
              "dark:bg-zinc-900 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]",
              "disabled:opacity-70 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign in →"
            )}
            <BottomGradient />
          </button>

          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            Or continue with
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <OAuthButton icon={<IconBrandGoogle className="h-4 w-4" />} label="Google" />
            <OAuthButton icon={<IconBrandGithub className="h-4 w-4" />} label="GitHub" />
          </div>

          <div className="text-center text-sm text-muted-foreground mt-1">
            Don’t have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Create one
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  )
}

const OAuthButton = ({ icon, label }: { icon: React.ReactNode; label: string }) => {
  return (
    <button
      type="button"
      className="group/btn relative flex h-11 w-full items-center justify-center gap-2 rounded-md bg-gray-50 px-4 font-medium text-black shadow-input transition hover:shadow-none dark:bg-zinc-900 dark:text-white dark:shadow-[0px_0px_1px_1px_#262626]"
    >
      {icon}
      <span className="text-sm">{label}</span>
      <BottomGradient />
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
