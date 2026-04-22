import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router'
import { Form, redirect, useActionData } from 'react-router'
import { Lock, Command, AlertCircle } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card } from '~/components/ui/card'
import {
  verifyPassword,
  createAuthCookie,
  buildSetCookieHeader,
  isAuthenticated,
} from '~/lib/admin.server'

export const meta: MetaFunction = () => {
  return [
    { title: 'Admin Login - CPL' },
    { name: 'robots', content: 'noindex, nofollow' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  // If already authenticated, redirect to admin dashboard
  if (isAuthenticated(request)) {
    return redirect('/admin')
  }
  return null
}

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData()
  const password = formData.get('password')

  if (typeof password !== 'string' || !password) {
    return { error: 'Password is required' }
  }

  const isValid = verifyPassword(
    context as Parameters<typeof verifyPassword>[0],
    password
  )

  if (!isValid) {
    return { error: 'Invalid password' }
  }

  // Create session cookie and redirect
  const cookieValue = createAuthCookie()
  return redirect('/admin', {
    headers: {
      'Set-Cookie': buildSetCookieHeader(cookieValue),
    },
  })
}

export default function AdminLoginPage() {
  const actionData = useActionData<typeof action>()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <Card variant="bordered" padding="lg" className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <Command size={24} className="text-accent" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary">Admin Access</h1>
          <p className="text-sm text-text-muted mt-1">
            Enter the admin password to continue
          </p>
        </div>

        <Form method="post" className="space-y-4">
          {actionData?.error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              <AlertCircle size={16} />
              <span>{actionData.error}</span>
            </div>
          )}

          <Input
            type="password"
            name="password"
            placeholder="Enter password"
            autoComplete="current-password"
            autoFocus
            error={actionData?.error ? ' ' : undefined}
          />

          <Button type="submit" variant="primary" className="w-full">
            <Lock size={16} />
            Login
          </Button>
        </Form>

        <p className="text-xs text-text-muted text-center mt-6">
          Protected area. Unauthorized access is prohibited.
        </p>
      </Card>
    </div>
  )
}
