import { useNavigate } from 'react-router-dom';
import { Code2, Users, MessageSquare, Palette, Zap, Shield, ArrowRight, Check } from 'lucide-react';

export default function Landing() {
    const navigate = useNavigate();

    const features = [
        {
            icon: Code2,
            title: 'Real-Time Code Editor',
            description: 'Collaborate on code with Monaco editor, syntax highlighting, and instant sync',
        },
        {
            icon: MessageSquare,
            title: 'Live Chat',
            description: 'Communicate seamlessly with your team while coding together',
        },
        {
            icon: Palette,
            title: 'Shared Whiteboard',
            description: 'Visualize ideas and draw diagrams together in real-time',
        },
        {
            icon: Zap,
            title: 'Instant Sync',
            description: 'Changes appear instantly across all connected users',
        },
        {
            icon: Shield,
            title: 'Secure Rooms',
            description: 'Private rooms with unique codes and automatic expiration',
        },
        {
            icon: Users,
            title: 'Team Collaboration',
            description: 'Work together with unlimited collaborators in each room',
        },
    ];

    const benefits = [
        'No installation required - works in your browser',
        'Free to use for unlimited rooms and collaborators',
        'Rooms auto-expire after 30 minutes of inactivity',
        'Support for 5+ programming languages',
        'Simple room codes for easy sharing',
        'Clean, distraction-free interface',
    ];

    return (
        <div className="min-h-screen bg-cream-100">
            {/* Navigation */}
            <nav className="bg-white border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black-primary rounded-lg flex items-center justify-center">
                            <Code2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-text-primary">CodeSync</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2.5 text-text-primary font-medium hover:text-black-primary transition-colors"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-6 py-2.5 bg-black-primary hover:bg-black-hover text-white font-semibold rounded-lg transition-all duration-200"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-6 py-32 animate-fade-in-up">
                <div className="text-center max-w-5xl mx-auto">
                    <h1 className="text-7xl font-bold text-text-primary mb-8 leading-tight tracking-tight">
                        Code Together,
                        <br />
                        <span className="text-black-primary">Achieve More</span>
                    </h1>
                    <p className="text-2xl text-text-secondary mb-12 leading-relaxed max-w-3xl mx-auto font-light">
                        The ultimate real-time collaborative coding workspace. Write code, chat, and brainstorm together—all in one elegant platform.
                    </p>
                    <div className="flex items-center justify-center gap-6">
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-10 py-5 bg-black-primary hover:bg-black-hover text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex items-center gap-3 text-lg"
                        >
                            Start Collaborating Free
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-10 py-5 bg-white hover:bg-cream-50 text-text-primary font-semibold rounded-xl border-2 border-border transition-all duration-300 hover:border-black-primary hover:-translate-y-1 text-lg"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-20">
                    <h2 className="text-5xl font-bold text-text-primary mb-6 tracking-tight">Everything You Need</h2>
                    <p className="text-xl text-text-secondary font-light">Powerful tools for seamless team collaboration</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl border border-border p-10 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-default"
                            >
                                <div className="w-14 h-14 bg-cream-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-black-primary transition-colors duration-300">
                                    <Icon className="w-7 h-7 text-black-primary group-hover:text-white transition-colors duration-300" />
                                </div>
                                <h3 className="text-2xl font-bold text-text-primary mb-4">{feature.title}</h3>
                                <p className="text-text-secondary leading-relaxed text-lg">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Benefits Section */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="bg-white rounded-3xl border border-border p-16 shadow-sm hover:shadow-lg transition-shadow duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-5xl font-bold text-text-primary mb-8 tracking-tight">Why Choose CodeSync?</h2>
                            <p className="text-xl text-text-secondary mb-10 leading-relaxed font-light">
                                Built for modern development teams who value simplicity, security, and real-time collaboration.
                            </p>
                            <div className="space-y-6">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-start gap-4 group">
                                        <div className="mt-1 w-6 h-6 bg-black-primary rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                            <Check className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <p className="text-lg text-text-primary group-hover:text-black-primary transition-colors">{benefit}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-cream-100 rounded-2xl p-12 text-center transform hover:scale-[1.02] transition-transform duration-500 cursor-default">
                            <div className="text-7xl font-bold text-black-primary mb-4 tracking-tighter">100%</div>
                            <div className="text-3xl font-bold text-text-primary mb-6">Free Forever</div>
                            <p className="text-xl text-text-secondary font-light">
                                No credit card required. No hidden fees. Just pure collaboration.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="bg-black-primary rounded-2xl p-12 text-center text-white">
                    <h2 className="text-4xl font-bold mb-4">Ready to Start Collaborating?</h2>
                    <p className="text-xl mb-8 opacity-90">
                        Join thousands of developers coding together in real-time
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        className="px-10 py-4 bg-white hover:bg-cream-100 text-black-primary font-semibold rounded-lg transition-all duration-200 text-lg inline-flex items-center gap-2"
                    >
                        Create Free Account
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border bg-white">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-black-primary rounded-lg flex items-center justify-center">
                                <Code2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-semibold text-text-primary">CodeSync</span>
                        </div>
                        <p className="text-sm text-text-tertiary">
                            © 2026 CodeSync. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
