import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { Outlet } from 'react-router'
import { AdminLayout } from '~/components/admin-layout'
import { requireAdmin } from '~/lib/admin.server'

export const meta: MetaFunction = () => {
  return [
    { title: 'Admin - CPL' },
    { name: 'robots', content: 'noindex, nofollow' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  requireAdmin(request)
  return null
}

export default function AdminLayoutRoute() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  )
}
