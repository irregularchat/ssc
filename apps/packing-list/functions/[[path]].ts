import { createPagesFunctionHandler } from '@react-router/cloudflare'

// @ts-expect-error - virtual module provided by React Router build
import * as build from '../build/server'

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext: (context) => ({
    cloudflare: {
      env: context.env,
      ctx: context,
    },
  }),
})
