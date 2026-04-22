import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('practice/:textId', 'routes/practice.tsx'),
] satisfies RouteConfig
