import { signIn } from "@/lib/auth";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <Image
          src="/fammy-profile.png"
          alt="Fammy"
          width={96}
          height={96}
          className="mx-auto size-24 rounded-2xl"
          priority
        />
        <h1 className="mt-4 text-3xl font-semibold text-primary">Fammy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Todo & agenda for the two of us
        </p>

        <LoginError searchParams={searchParams} />

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/today" });
          }}
          className="mt-10"
        >
          <Button type="submit" size="lg" className="h-12 w-full text-sm">
            <GoogleIcon />
            Sign in with Google
          </Button>
        </form>
      </div>
    </div>
  );
}

async function LoginError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if (!params.error) return null;

  return (
    <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
      Email not allowed. Contact admin.
    </p>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
