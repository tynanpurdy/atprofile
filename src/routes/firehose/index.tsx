import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/firehose/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/firehose/"!</div>
}
