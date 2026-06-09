import { useCallback, useEffect, useState } from 'react'
import { extractError } from '../services/api'

/**
 * Runs an API call on mount (and when `deps` change), exposing { data, loading,
 * error, reload }. `apiCall` must return an Axios promise.
 */
export function useApi(apiCall, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiCall()
      // Unwrap Laravel resource collections ({ data: [...] }) when present.
      setData(response.data?.data ?? response.data)
      return response.data
    } catch (err) {
      setError(extractError(err))
      throw err
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (immediate) reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, reload, setData }
}
