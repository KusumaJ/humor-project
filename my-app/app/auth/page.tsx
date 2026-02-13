// app/auth/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SignInButton from './signinbutton'

export default async function AuthPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // If already authenticated, redirect to /me
    if (user) {
        redirect('/me')
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
            <div className="w-full max-w-md px-8 py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center mb-4 text-black dark:text-white">
                    Sign in to Continue
                </h1>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
                    Access your personal humor collection
                </p>

                <div className="flex justify-center">
                    <SignInButton />
                </div>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                    By signing in, you agree to save your favorite memes and captions
                </p>
            </div>
        </div>
    )
}