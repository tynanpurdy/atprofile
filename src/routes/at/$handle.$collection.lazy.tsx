import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/at/$handle/$collection')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/at/$handle/$collection"!</div>
}
