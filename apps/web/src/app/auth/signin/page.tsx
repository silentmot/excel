import { signIn } from "@/auth"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">ALASLA Operations</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Microsoft 365 account
          </p>
        </div>
        
        <form
          action={async () => {
            "use server"
            await signIn("azure-ad", { redirectTo: "/dashboard" })
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign in with Microsoft
          </button>
        </form>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Only @sirc.sa accounts are allowed
          </p>
        </div>
      </div>
    </div>
  )
}
