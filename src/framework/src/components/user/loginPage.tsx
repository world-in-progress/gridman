import { LoginForm } from "./loginForm"
import login from '../../assets/login.jpg'

export default function LoginPage() {
    return (
        <div className="flex-1 h-full bg-background text-foreground">
            <div className="grid h-full lg:grid-cols-2">
                <div className="flex flex-col gap-4 p-6 md:p-10 bg-background">
                    <div className="flex flex-1 items-center justify-center">
                        <div className="w-full max-w-sm">
                            <LoginForm />
                        </div>
                    </div>
                </div>
                <div className="bg-muted relative hidden lg:block">
                    <img
                        src={login}
                        alt="Login background"
                        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                    />
                </div>
            </div>
        </div>
    )
}
