import { useState, useMemo } from 'react'
import { useFS } from '../context/FileSystemContext'
import { searchNodes } from '../utils/fsUtils'

export function useSearch() {
  const { nodes, rootId } = useFS()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchNodes(nodes, rootId, query)
  }, [nodes, rootId, query])

  return { query, setQuery, results, isSearching: query.trim().length > 0 }
}