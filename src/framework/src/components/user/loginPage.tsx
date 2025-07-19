import { LoginForm } from "./loginForm"
import login from '../../assets/login.jpg'

export default function LoginPage() {
    return (
        <div className="flex-1 h-full bg-[#1E1E1E] text-white">
            <div className="flex h-full flex-row">
                <div className="flex flex-col w-2/5 gap-4 p-6 md:p-10">
                    <div className="flex flex-1 items-center justify-center">
                        <div className="w-full max-w-lg">
                            <LoginForm />
                        </div>
                    </div>
                </div>
                <div className="w-3/5 bg-muted relative hidden lg:block">
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
