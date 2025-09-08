'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowRight, 
  Play, 
  Clock, 
  Target, 
  Users, 
  Menu,
  X,
  BookOpen,
  Brain,
  Zap,
  TrendingUp
} from 'lucide-react';
import Logo from '@/components/Logo';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -50]);
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect signed-in users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
            >
              <Logo showText={true} size={32} />
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#about" className={`${isScrolled ? 'text-gray-800' : 'text-white'} hover:text-yellow-400 transition-colors font-medium`}>About</a>
              <a href="#features" className={`${isScrolled ? 'text-gray-800' : 'text-white'} hover:text-yellow-400 transition-colors font-medium`}>Features</a>
              <a href="#how-it-works" className={`${isScrolled ? 'text-gray-800' : 'text-white'} hover:text-yellow-400 transition-colors font-medium`}>How it Works</a>
              <a href="#contact" className={`${isScrolled ? 'text-gray-800' : 'text-white'} hover:text-yellow-400 transition-colors font-medium`}>Contact</a>
              <motion.button
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-all duration-200 font-semibold shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Log In
              </motion.button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className={`md:hidden p-2 ${isScrolled ? 'text-gray-800' : 'text-white'}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.nav
              className="md:hidden py-4 border-t border-gray-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col space-y-4">
                <a href="#about" className={`${isScrolled ? 'text-gray-800' : 'text-white'} hover:text-yellow-400 transition-colors font-medium`}>About</a>
                <a href="#features" className={`${isScrolled ? 'text-gray-800' : 'text-white'} hover:text-yellow-400 transition-colors font-medium`}>Features</a>
                <a href="#how-it-works" className={`${isScrolled ? 'text-gray-800' : 'text-white'} hover:text-yellow-400 transition-colors font-medium`}>How it Works</a>
                <a href="#contact" className={`${isScrolled ? 'text-gray-800' : 'text-white'} hover:text-yellow-400 transition-colors font-medium`}>Contact</a>
                <button 
                  onClick={() => router.push('/login')}
                  className="px-6 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-all duration-200 font-semibold shadow-lg"
                >
                  Log In
                </button>
              </div>
            </motion.nav>
          )}
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="relative pt-20 pb-16 overflow-hidden bg-cover bg-center bg-no-repeat min-h-screen flex items-center md:bg-fixed"
        style={{ 
          y,
          backgroundImage: "url('/womaninbed.png')"
        }}
      >
        {/* Background Overlay with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>
        
        {/* Additional Blur Effect */}
        <div className="absolute inset-0 backdrop-blur-[1px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              The easiest, fastest, and smartest way to{' '}
              <span className="text-yellow-400 drop-shadow-2xl">
              learn a new skill or subject
              </span>
              <br />
              <span className="text-white drop-shadow-2xl">
                
              </span>
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-white mb-8 max-w-4xl mx-auto leading-relaxed drop-shadow-2xl font-medium"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              AI-powered custom tailored curricula --- optimized for your unique goals, your busy schedule, and for you...<span className="italic">personally</span>
              
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.button
                onClick={() => router.push('/login?signup=true')}
                className="group px-8 py-4 bg-yellow-500 text-black rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center space-x-2 backdrop-blur-sm"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Start Learning</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                onClick={() => {
                  // Scroll to the "How It Works" section
                  const howItWorksSection = document.getElementById('how-it-works');
                  if (howItWorksSection) {
                    howItWorksSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="group px-8 py-4 bg-black bg-opacity-30 backdrop-blur-md text-white border-2 border-white border-opacity-70 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl hover:bg-opacity-50 hover:border-opacity-90 transition-all duration-300 flex items-center space-x-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Watch Demo</span>
              </motion.button>
            </motion.div>

            {/* Floating Elements */}
            <div className="relative">
              <motion.div
                className="absolute -top-10 -left-10 w-20 h-20 bg-yellow-200 rounded-full opacity-60"
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -top-5 -right-5 w-16 h-16 bg-gray-300 rounded-full opacity-60"
                animate={{ 
                  y: [0, 20, 0],
                  rotate: [360, 180, 0]
                }}
                transition={{ 
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -bottom-10 left-1/4 w-12 h-12 bg-yellow-300 rounded-full opacity-60"
                animate={{ 
                  y: [0, -15, 0],
                  x: [0, 10, 0]
                }}
                transition={{ 
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Use Cases Section */}
      <motion.section 
        id="about"
        className="py-20 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 flex items-center justify-center gap-4">
              <Logo showText={false} size={48} />
              Perfect for Every{' '}
              <span className="text-yellow-600">
                Learning Journey
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you have a few days or several months, we'll create the perfect learning path for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Clock className="w-12 h-12 text-yellow-600" />,
                title: "Surgery Recovery",
                description: "30-day curriculum for Python or Spanish",
                example: "Transform your recovery time into a new skill",
                color: "bg-yellow-500"
              },
              {
                icon: <Target className="w-12 h-12 text-gray-700" />,
                title: "Career Transition",
                description: "Learn new skills for your next job",
                example: "Master in-demand technologies like AI",
                color: "bg-gray-600"
              },
              {
                icon: <Users className="w-12 h-12 text-yellow-600" />,
                title: "Sabbatical Time",
                description: "Explore interests deeply",
                example: "Dive into creative writing or learn mahjong",
                color: "bg-yellow-500"
              }
            ].map((useCase, index) => (
              <motion.div
                key={index}
                className="group relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="mb-6">
                    {useCase.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{useCase.title}</h3>
                  <p className="text-gray-600 mb-4">{useCase.description}</p>
                  <p className="text-sm font-medium text-gray-500">{useCase.example}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        id="how-it-works"
        className="py-20 bg-yellow-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 flex items-center justify-center gap-4">
              <Logo showText={false} size={48} />
              How It{' '}
              <span className="text-yellow-600">
                Works
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get your personalized learning curriculum in just a few simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Tell Us About Your Time",
                description: "How many days do you have? How long per session? We'll optimize everything for your schedule.",
                icon: <Clock className="w-8 h-8" />
              },
              {
                step: "02",
                title: "Choose Your Subject",
                description: "Any topic you want to learn - from Python to creative writing. No limits on what you can explore and at any skill level or emphasis.",
                icon: <BookOpen className="w-8 h-8" />
              },
              {
                step: "03",
                title: "Start Learning",
                description: "Get your personalized curriculum and begin your learning journey with AI-powered guidance.",
                icon: <Brain className="w-8 h-8" />
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-2xl mx-auto mb-6">
                    {step.step}
                  </div>
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        id="features"
        className="py-20 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 flex items-center justify-center gap-4">
              <Logo showText={false} size={48} />
              Powerful{' '}
              <span className="text-yellow-600">
                Features
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to make the most of your learning time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Brain className="w-8 h-8 text-yellow-600" />,
                title: "AI-Powered",
                description: "Custom generated curricula tailored to your needs"
              },
              {
                icon: <Clock className="w-8 h-8 text-gray-700" />,
                title: "Time Optimized",
                description: "Perfect for your schedule and availability"
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-yellow-600" />,
                title: "Progress Tracking",
                description: "Visual progress and achievement tracking"
              },
              {
                icon: <Zap className="w-8 h-8 text-gray-700" />,
                title: "Personal Learning",
                description: "Tailored to your goals and skill level"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="group p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-20 bg-yellow-500"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-gray-800 mb-8">
            Join thousands of learners who are transforming their downtime into productive learning time.
          </p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.button
              onClick={() => router.push('/login?signup=true')}
              className="px-8 py-4 bg-black text-yellow-500 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Get Started (Free)</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => {
                // Scroll to the "How It Works" section
                const howItWorksSection = document.getElementById('how-it-works');
                if (howItWorksSection) {
                  howItWorksSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-8 py-4 bg-transparent text-black border-2 border-black rounded-xl font-semibold text-lg hover:bg-black hover:text-yellow-500 transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <Logo showText={true} size={40} />
              </div>
              <p className="text-gray-400">
                Transform your downtime into productive learning time with AI-powered personalized curricula.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Max Wonkage. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
