'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { activateUser } from './actions'

export default function ActivatePage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const clientId = searchParams.get('client')
    const action = searchParams.get('action')

    console.log("Client ID:", clientId)  // Log the clientId to check
    console.log("Action:", action)  // Log the action to check

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const handleActivation = async () => {
            if (!clientId || !action || action !== 'join') {
                setStatus('error')
                setMessage('Invalid action. Please check your email and try again.')
                return
            }

            try {
                const result = await activateUser(clientId)
                setStatus('success')
                setMessage(result.message)
            } catch (error) {
                setStatus('error')
                setMessage('User Activation Failed')
            } finally {
                // Redirect to login page after a short delay
                setTimeout(() => {
                    router.push('https://app.dealingwithdebt.org/login/')
                }, 3000) // Redirect after 3 seconds
            }

        }

        handleActivation()
    }, [clientId, action])

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-md">
                <h1 className="mb-6 text-2xl font-bold">Account Activation</h1>

                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                        <p className="mt-4 text-center">Processing your activation...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="rounded-md bg-green-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">{message}</p>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{message}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
