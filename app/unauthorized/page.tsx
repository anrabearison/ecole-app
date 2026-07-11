import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">403</h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-900">
            Unauthorized Access
          </h2>
          <p className="mt-2 text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/login" className="block">
            <Button className="w-full">Return to Login</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
