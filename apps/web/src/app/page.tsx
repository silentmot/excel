import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function HomePage() {
  const session = await auth()

  // If user is already authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  // Otherwise, show landing page with sign-in option
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-2xl space-y-8 px-4 text-center">
        {/* Logo/Title */}
        <div>
          <h1 className="text-5xl font-bold text-gray-900">
            ALASLA Operations
          </h1>
          <p className="mt-3 text-xl text-gray-600">
            Construction Site Management System
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex justify-center">
              <div className="rounded-full bg-blue-100 p-3">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Daily Data Entry
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Record production, dispatch, equipment, and manpower data
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Real-time Dashboard
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Monitor operations with live charts and metrics
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex justify-center">
              <div className="rounded-full bg-purple-100 p-3">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Multi-Format Export
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Export to Excel, Power BI, and web reports
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-12">
          <Link
            href="/auth/login"
            className="inline-flex items-center rounded-lg bg-blue-600 px-8 py-4 text-lg font-medium text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign In with Microsoft
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Footer Note */}
        <p className="mt-8 text-sm text-gray-500">
          Secure access for @sirc.sa accounts only
        </p>
      </div>
    </div>
  )
}
