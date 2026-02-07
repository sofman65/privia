"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-primary/5">
      <div className="shadow-input w-full max-w-lg rounded-none bg-white p-6 md:rounded-2xl md:p-10 dark:bg-black border border-border/60">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="mx-auto h-20 w-28 flex items-center justify-center">
            <Logo variant="brand" mode="light" className="h-20 w-auto" priority />
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground">Set up access to your AI chat workspace.</p>
        </div>

        <form onSubmit={handleSignup} className="mt-8 space-y-4">
          <LabelInputContainer>
            <label className="text-sm font-medium text-foreground">Full name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </LabelInputContainer>

          <LabelInputContainer>
            <label className="text-sm font-medium text-foreground">Work email</label>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <label className="text-sm font-medium text-foreground">Password</label>
            <Input
              type="password"
              value={password}
              required
              minLength={4}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </LabelInputContainer>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
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
                Creating...
              </span>
            ) : (
              "Create account →"
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

          <p className="text-sm text-center mt-2">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary">
              Sign in
            </Link>
          </p>
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
