import ShowError from '@/components/error'
import { Loader } from '@/components/ui/loader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { QtClient, useXrpc } from '@/providers/qtprovider'
import { ComAtprotoSyncListRepos } from '@atcute/client/lexicons'
import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { ShieldX } from 'lucide-react'
import { useState, useEffect, useRef } from 'preact/compat'

interface PdsData {
  records?: ComAtprotoSyncListRepos.Output['repos']
  cursor?: string
  health?: PdsHealth
  isLoading: boolean
  error: Error | null
  fetchMore: (cursor: string) => Promise<void>
}

interface PdsHealth {
  version: string
}

function useRepoData(baseUrl: string): PdsData {
  const xrpc = useXrpc()
  const [state, setState] = useState<PdsData>({
    isLoading: true,
    error: null,
    fetchMore: async () => {},
  })

  useDocumentTitle(baseUrl ? `${baseUrl} | atp.tools` : 'atp.tools')
  const abortController = new AbortController()

  async function fetchRepoData(cursor?: string) {
    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      // we dont use the main authenticated client here
      const rpc = new QtClient(new URL('https://' + baseUrl))
      // get the PDS
      const response = await rpc
        .getXrpcClient()
        .get('com.atproto.sync.listRepos', {
          params: { limit: 1000, cursor },
          signal: abortController.signal,
        })

      const health = await rpc
        .getXrpcClient()
        .request({ nsid: '_health', type: 'get' })

      setState((prev) => ({
        ...prev,
        records: cursor
          ? [...(prev.records || []), ...response.data.repos]
          : response.data.repos,
        cursor: response.data.cursor,
        health: health.data,
        isLoading: false,
        error: null,
      }))

      // todo: actual errors
    } catch (err: any) {
      if (err.name === 'AbortError') return

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err : new Error('An error occurred'),
      }))
    }
  }

  useEffect(() => {
    fetchRepoData()

    return () => {
      abortController.abort()
    }
  }, [baseUrl, xrpc])

  const fetchMore = async (cursor: string) => {
    if (cursor && !state.isLoading) {
      await fetchRepoData(cursor)
    }
  }

  return { ...state, fetchMore }
}

export const Route = createLazyFileRoute('/pds/$url/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { url } = Route.useParams()
  const { cursor, records, fetchMore, isLoading, error } = useRepoData(url)

  useDocumentTitle(records ? `${url} (PDS) | atp.tools` : 'atp.tools')

  const loaderRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!loaderRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && !isLoading && cursor) {
          fetchMore(cursor)
        }
      },
      { threshold: 0.1, rootMargin: '50px' },
    )

    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [cursor, isLoading, fetchMore])

  if (error) {
    return <ShowError error={error} />
  }

  if ((isLoading && !cursor) || !records) {
    return <Loader className="max-h-[calc(100vh-5rem)] h-screen" />
  }

  return (
    <div className="flex flex-row justify-center w-full">
      <div className="max-w-2xl w-screen p-4 md:mt-16 space-y-2">
        <div>
          PDS: {url.includes('bsky.network') && '🍄'} {url}
        </div>

        <div>
          <h2 className="text-xl font-bold">Repositories (accounts)</h2>
          <ul>
            {records?.map((c) => (
              <li key={c.did} className="text-blue-500">
                <Link
                  to="/at:/$handle"
                  params={{
                    handle: c.did,
                  }}
                >
                  {c.did}{' '}
                  {!c.active && <ShieldX className="inline text-red-500" />}
                </Link>
              </li>
            ))}
          </ul>
          <div
            ref={loaderRef}
            className="flex flex-row justify-center h-10 -pt-16"
          >
            {isLoading && <Loader className="max-h-16 h-screen" />}
            {!isLoading && !cursor && (
              <div className="text-center text-sm text-muted-foreground mx-10 mt-2">
                that's all, folks!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
