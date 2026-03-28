"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, LoaderCircle, LogIn, UserPlus } from "lucide-react"
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getFirebaseAuth } from "@/lib/firebase-client"

export function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { configured, user } = useAuth()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectTo = searchParams.get("redirectTo") || "/biodata"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!configured) {
      setError("Firebase is not configured yet. Add the env values before using auth.")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const auth = getFirebaseAuth()

      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email, password)

        if (name.trim()) {
          await updateProfile(credential.user, {
            displayName: name.trim(),
          })
        }
      }

      router.push(redirectTo)
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Authentication failed. Please try again."
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    if (!configured) {
      setError("Firebase is not configured yet. Add the env values before using auth.")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: "select_account" })

      await signInWithPopup(getFirebaseAuth(), provider)
      router.push(redirectTo)
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Google sign-in failed. Please try again."
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0C] px-6 py-10 text-[#F9F9F7] md:px-12">
      <div className="mx-auto max-w-5xl">
        <Button variant="ghost" asChild className="rounded-full border border-white/10 bg-white/[0.04]">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </Button>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">Auth step</p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Sign in before saving your biodata to the backend.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              We are starting with email and password because it is the fastest stable path for profile ownership. Phone
              auth can replace or complement this later.
            </p>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <p className="text-sm font-semibold text-foreground">What this unlocks next</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>Profiles saved under the real signed-in user id.</li>
                <li>Firestore rules that restrict access to the owner.</li>
                <li>Later verification uploads and secure profile updates.</li>
              </ul>
            </div>
          </div>

          <Card className="border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={mode === "signin" ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </Button>
                <Button
                  type="button"
                  variant={mode === "signup" ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setMode("signup")}
                >
                  Create account
                </Button>
              </div>
              <div>
                <CardTitle className="text-2xl text-foreground">
                  {mode === "signin" ? "Welcome back" : "Create your account"}
                </CardTitle>
                <CardDescription className="mt-2 text-sm leading-6 text-muted-foreground">
                  {mode === "signin"
                    ? "Use the same account each time so the biodata stays attached to you."
                    : "This account will become the owner of your biodata profile in Firestore."}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === "signup" ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Display name</Label>
                    <Input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="border-white/10 bg-black/20"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="border-white/10 bg-black/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="border-white/10 bg-black/20"
                  />
                </div>

                {error ? (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </div>
                ) : null}

                {user ? (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    Signed in as {user.email ?? user.uid}.
                  </div>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting || !configured}
                  onClick={() => void handleGoogleSignIn()}
                  className="h-12 w-full rounded-full border-white/15 bg-white/[0.05] font-semibold text-foreground hover:bg-white/[0.08] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Working
                    </>
                  ) : (
                    <>
                      <span className="text-base font-semibold">G</span>
                      Continue with Google
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    <span className="bg-[rgba(14,14,16,0.95)] px-3">or use email</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !configured}
                  className="h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Working
                    </>
                  ) : mode === "signin" ? (
                    <>
                      <LogIn className="h-4 w-4" />
                      Sign in
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create account
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
