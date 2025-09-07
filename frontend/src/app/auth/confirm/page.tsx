'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'
import { motion } from 'framer-motion'

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Confirming your email...')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Get all URL parameters for debugging
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      const tokenHash = searchParams.get('token_hash')
      
      console.log('Confirmation URL parameters:', {
        token,
        type,
        tokenHash,
        allParams: Object.fromEntries(searchParams.entries())
      })

      // Try different approaches for email confirmation
      try {
        let result = null

        // Method 1: Try with token_hash and type=email (most common)
        if (tokenHash && type === 'email') {
          console.log('Trying method 1: token_hash with type=email')
          result = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email'
          })
        }
        // Method 2: Try with token and type=signup
        else if (token && type === 'signup') {
          console.log('Trying method 2: token with type=signup')
          result = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          })
        }
        // Method 3: Try with just token
        else if (token) {
          console.log('Trying method 3: just token')
          result = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          })
        }
        // Method 4: Try with token_hash only
        else if (tokenHash) {
          console.log('Trying method 4: just token_hash')
          result = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email'
          })
        }
        // Method 5: Try exchangeCodeForSession (for email confirmations)
        else if (token) {
          console.log('Trying method 5: exchangeCodeForSession')
          result = await supabase.auth.exchangeCodeForSession(token)
        }

        if (result) {
          if (result.error) {
            console.error('Email confirmation error:', result.error)
            setStatus('error')
            setMessage(`Email confirmation failed: ${result.error.message}`)
            // Redirect to login after 3 seconds
            setTimeout(() => {
              router.push('/login?error=confirmation_failed')
            }, 3000)
          } else {
            console.log('Email confirmation successful:', result)
            setStatus('success')
            setMessage('Email confirmed successfully! Redirecting to your dashboard...')
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
          }
        } else {
          // No valid parameters found
          console.error('No valid confirmation parameters found')
          setStatus('error')
          setMessage('Invalid confirmation link. Please check your email and try again.')
          setTimeout(() => {
            router.push('/login?error=invalid_link')
          }, 3000)
        }
      } catch (err) {
        console.error('Confirmation error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
        setTimeout(() => {
          router.push('/login?error=confirmation_failed')
        }, 3000)
      }
    }

    handleEmailConfirmation()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Logo showText={true} size={48} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Confirming your email...'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </h2>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
          )}
          
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
            >
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
          
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
              className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto"
            >
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
