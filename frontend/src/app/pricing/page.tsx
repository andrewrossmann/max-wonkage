'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Users, Star, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function PricingPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/expert-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setIsSubmitted(true);
      setEmail('');
    } catch (error) {
      console.error('Error submitting email:', error);
      alert(error instanceof Error ? error.message : 'Failed to join waitlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
              onClick={() => router.push('/')}
              className="cursor-pointer"
            >
              <Logo showText={true} size={32} />
            </motion.div>

            {/* Navigation */}
            <nav className="flex items-center space-x-8">
              <a href="/" className="text-gray-800 hover:text-yellow-400 transition-colors font-medium">Home</a>
              <a href="/pricing" className="text-yellow-500 font-medium">Pricing</a>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="relative pt-20 pb-16 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-yellow-500">
                Pricing
              </span>
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed font-medium"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Max Wonkage is completely free, with an exciting marketplace coming soon
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* Main Content */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

          {/* Beta Notice */}
          <motion.div 
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 mb-16 max-w-4xl mx-auto shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Currently in Beta Testing
                </h3>
                <div className="text-yellow-700">
                  <p>
                    We're still developing and refining Max Wonkage. The core platform will always be free, 
                    and we're building an exciting expert marketplace called "Actual Intelligence" for those 
                    who want human guidance alongside AI-generated learning.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pricing Overview */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
            {/* Free Platform */}
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-yellow-200 hover:shadow-3xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
                  <Star className="w-10 h-10 text-yellow-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Max Wonkage Platform</h3>
                <div className="text-5xl font-bold text-yellow-500 mb-4">Free Forever</div>
                <p className="text-gray-600 mb-8 text-lg">
                  Our core platform will always be completely free - "free, as in free beer!" 🍺
                </p>
              </div>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-center">
                  <Check className="w-6 h-6 text-yellow-500 mr-4" />
                  <span className="text-lg">AI-generated personalized curricula</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-6 h-6 text-yellow-500 mr-4" />
                  <span className="text-lg">Interactive learning sessions</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-6 h-6 text-yellow-500 mr-4" />
                  <span className="text-lg">Progress tracking and analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-6 h-6 text-yellow-500 mr-4" />
                  <span className="text-lg">Note-taking and session customization</span>
                </li>
              </ul>
            </motion.div>

            {/* Actual Intelligence */}
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-200 hover:shadow-3xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                  <Users className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Actual Intelligence</h3>
                <div className="text-5xl font-bold text-gray-600 mb-4">Coming Soon</div>
                <p className="text-gray-600 mb-8 text-lg">
                  Connect with mentors, coaches, and experts for personalized guidance
                </p>
              </div>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-center">
                  <Check className="w-6 h-6 text-gray-500 mr-4" />
                  <span className="text-lg">Live video sessions with verified experts</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-6 h-6 text-gray-500 mr-4" />
                  <span className="text-lg">Flexible pricing: $15-$200/hour</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-6 h-6 text-gray-500 mr-4" />
                  <span className="text-lg">Academic mentors, career coaches, life coaches</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-6 h-6 text-gray-500 mr-4" />
                  <span className="text-lg">Only 5% platform commission (experts keep 95%)</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Expert Interest Signup */}
          <motion.div 
            className="bg-white rounded-2xl shadow-2xl p-10 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Interested in Becoming an Expert?
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We're building a community of mentors, coaches, and subject matter experts. 
                Join our early access list to be notified when we launch the expert marketplace.
              </p>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-3">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-lg transition-all duration-200"
                    placeholder="your.email@example.com"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-yellow-500 text-black py-4 px-8 rounded-xl font-semibold text-lg hover:bg-yellow-400 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      <span>Joining List...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Expert Waitlist</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
            ) : (
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
                  <Check className="w-10 h-10 text-yellow-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">You're on the list!</h4>
                <p className="text-lg text-gray-600 mb-6">
                  We'll notify you when the expert marketplace launches. Thank you for your interest!
                </p>
                <motion.button
                  onClick={() => setIsSubmitted(false)}
                  className="text-yellow-600 hover:text-yellow-700 font-semibold text-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  Add another email
                </motion.button>
              </motion.div>
            )}
          </motion.div>

          {/* Footer Note */}
          <motion.div 
            className="text-center mt-16 text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p className="text-lg">
              Questions about pricing or the expert marketplace? 
              <a href="mailto:andrewrossmann@gmail.com" className="text-yellow-600 hover:text-yellow-700 ml-1 font-semibold">
                Contact us
              </a>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <Logo showText={true} size={40} />
              </div>
              <p className="text-gray-400">
                The easiest, fastest, and smartest way to learn a new skill or subject.
                <br />Wonk out...to the Max!
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="mailto:andrewrossmann@gmail.com" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
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
