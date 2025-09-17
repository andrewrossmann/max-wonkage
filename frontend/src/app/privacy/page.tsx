'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header 
        className="bg-white shadow-sm border-b border-gray-200"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div 
              onClick={() => router.push('/')}
              className="cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Logo showText={true} size={32} />
            </motion.div>
            <div className="text-sm text-gray-500">
              Last Updated: September 2025
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <motion.main 
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Privacy Policy
          </motion.h1>

          <motion.div 
            className="prose prose-lg max-w-none text-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-xl text-gray-600 mb-8">
              <strong>Effective Date: September 2025</strong>
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Introduction</h2>
            <p>
              Max Wonkage ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered educational platform that creates personalized learning curricula.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Account Information</strong>: Email address, password (hashed), first name, and full name</li>
              <li><strong>Contact Information</strong>: Email address for communication and support</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Learning Data</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Personal Background</strong>: Your background, interests, experiences, and learning goals</li>
              <li><strong>Time Availability</strong>: Your available time for learning, including total days, sessions per week, and session length preferences</li>
              <li><strong>Curriculum Data</strong>: AI-generated learning content and materials tailored to your needs</li>
              <li><strong>Progress Data</strong>: Your learning progress, completion status, and achievement tracking</li>
              <li><strong>Session Data</strong>: Individual learning session content, duration, and completion status</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Expert Marketplace Data (Optional)</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Expert Information</strong>: Name, email, expertise areas, experience level, hourly rate range, availability, and additional information (only if you choose to participate as an expert)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Technical Information</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Usage Data</strong>: How you interact with our platform</li>
              <li><strong>Device Information</strong>: Browser type, operating system, IP address</li>
              <li><strong>Cookies</strong>: We use cookies to enhance your experience and analyze usage patterns</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Provide Services</strong>: Create and deliver personalized learning curricula</li>
              <li><strong>Improve Platform</strong>: Enhance our AI algorithms and user experience</li>
              <li><strong>Communication</strong>: Send you important updates, support responses, and educational content</li>
              <li><strong>Progress Tracking</strong>: Monitor and display your learning progress</li>
              <li><strong>Expert Matching</strong>: Connect you with relevant experts (if you opt into the marketplace)</li>
              <li><strong>Analytics</strong>: Understand how our platform is used to improve our services</li>
              <li><strong>Legal Compliance</strong>: Meet legal obligations and protect our rights</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Storage and Security</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Data Hosting</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Your data is stored securely on Supabase, a trusted cloud database provider</li>
              <li>All data is encrypted in transit and at rest</li>
              <li>We implement industry-standard security measures to protect your information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Security Measures</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Secure authentication and authorization systems</li>
              <li>Regular security audits and updates</li>
              <li>Access controls limiting data access to authorized personnel only</li>
              <li>Monitoring and logging of data access</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Third-Party Services</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">OpenAI API</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>We use OpenAI's API to generate personalized learning content</li>
              <li>Your learning data is sent to OpenAI to create curricula tailored to your needs</li>
              <li>OpenAI's data usage policies apply to this data processing</li>
              <li>We do not share your personal information beyond what's necessary for curriculum generation</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Supabase</h3>
            <p className="mb-4">We use Supabase for database hosting and user authentication. Supabase's privacy policy and security measures apply to data stored on their platform.</p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Vercel</h3>
            <p className="mb-4">Our platform is hosted on Vercel. Vercel's privacy policy applies to hosting-related data processing.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Your Rights and Choices</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Access and Control</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>View Your Data</strong>: Access your personal information and learning data through your account</li>
              <li><strong>Update Information</strong>: Modify your profile and learning preferences at any time</li>
              <li><strong>Delete Account</strong>: Request account deletion, which will remove your personal data</li>
              <li><strong>Data Portability</strong>: Export your learning data in a standard format</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Communication Preferences</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Email Settings</strong>: Unsubscribe from marketing emails while keeping essential service communications</li>
              <li><strong>Notification Control</strong>: Manage how and when you receive notifications</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Retention</h2>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Account Data</strong>: Retained while your account is active</li>
              <li><strong>Learning Data</strong>: Retained to provide ongoing personalized learning experiences</li>
              <li><strong>Deleted Accounts</strong>: Data is permanently deleted within 30 days of account deletion request</li>
              <li><strong>Legal Requirements</strong>: Some data may be retained longer if required by law</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Children's Privacy</h2>
            <p className="mb-4">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">International Data Transfers</h2>
            <p className="mb-4">
              Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data during international transfers.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Cookies and Tracking</h2>
            <p className="mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Remember your preferences and settings</li>
              <li>Analyze platform usage and performance</li>
              <li>Provide personalized content and features</li>
              <li>Improve our services</li>
            </ul>
            <p className="mb-4">You can control cookie settings through your browser preferences.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Changes to This Privacy Policy</h2>
            <p className="mb-4">We may update this Privacy Policy periodically. We will notify you of significant changes by:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Posting the updated policy on our website</li>
              <li>Sending email notifications for material changes</li>
              <li>Updating the "Effective Date" at the top of this policy</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <p className="mb-4">If you have questions about this Privacy Policy or our data practices, please contact us:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Email</strong>: <a href="mailto:andrewrossmann@gmail.com" className="text-yellow-600 hover:text-yellow-700">andrewrossmann@gmail.com</a></li>
              <li><strong>Subject Line</strong>: Privacy Policy Inquiry</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Your Consent</h2>
            <p className="mb-4">
              By using Max Wonkage, you consent to the collection and use of your information as described in this Privacy Policy.
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500">
              <p><strong>Last Updated</strong>: September 2025</p>
              <p className="mt-2"><strong>Max Wonkage</strong> - Making learning accessible, efficient, and personalized.</p>
            </div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
