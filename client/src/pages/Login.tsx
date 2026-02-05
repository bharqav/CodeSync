import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Code2, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import API_URL from '../config';

export default function Login() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            login(data.token, data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-black-primary rounded-xl mb-5 shadow-sm">
                        <Code2 className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    <h1 className="text-3xl font-semibold text-text-primary mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-text-secondary">
                        Sign in to access your collaborative workspaces
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                                {error}
                            </div>
                        )}

                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-cream-50 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-black-primary/10 focus:border-black-primary transition-all"
                                    placeholder="johndoe"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-cream-50 border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-black-primary/10 focus:border-black-primary transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-black-primary hover:bg-black-hover text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-text-tertiary">or</span>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center">
                        <span className="text-text-secondary text-sm">Don't have an account? </span>
                        <Link
                            to="/signup"
                            className="text-black-primary font-medium text-sm hover:underline"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-text-tertiary mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
