import type { ActionFunctionArgs } from 'react-router'
import { redirect } from 'react-router'
import { buildClearCookieHeader } from '~/lib/admin.server'

export async function action({}: ActionFunctionArgs) {
  return redirect('/admin/login', {
    headers: {
      'Set-Cookie': buildClearCookieHeader(),
    },
  })
}

export async function loader() {
  // Redirect GET requests to the login page
  return redirect('/admin/login')
}
