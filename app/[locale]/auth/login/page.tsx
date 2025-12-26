import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { AuthForm } from "@/components/auth-form"

export default function LoginPage() {
  const t = useTranslations("Auth")

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{t("loginTitle")}</h1>
          <p className="text-muted-foreground">{t("loginDescription")}</p>
        </div>

        <AuthForm mode="login" />

        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/auth/signup" className="text-primary hover:underline">
            {t("signup")}
          </Link>
        </p>

        <p className="text-center text-sm">
          <Link href="/" className="text-muted-foreground hover:underline">
            {t("backToTimer")}
          </Link>
        </p>
      </div>
    </div>
  )
}
