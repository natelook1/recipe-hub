import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getRecipes, getTags, getSettings } from '../api.js'

const RecipeContext = createContext(null)

export function RecipeProvider({ children }) {
  const [recipes, setRecipes]         = useState([])
  const [tags, setTags]               = useState([])
  const [settings, setSettings]       = useState({ preferred_unit_system: 'metric', theme: 'warm' })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag]     = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  const loadRecipes = useCallback(async () => {
    try {
      const params = {}
      if (searchQuery) params.q = searchQuery
      if (activeTag)   params.tag = activeTag
      const data = await getRecipes(params)
      setRecipes(data.recipes)
    } catch (e) {
      setError(e.message)
    }
  }, [searchQuery, activeTag])

  const loadTags = useCallback(async () => {
    try {
      const data = await getTags()
      setTags(data.tags)
    } catch {}
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      const data = await getSettings()
      setSettings(data)
    } catch {}
  }, [])

  useEffect(() => {
    Promise.all([loadRecipes(), loadTags(), loadSettings()])
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  const reload = () => {
    loadRecipes()
    loadTags()
  }

  const reloadSettings = () => loadSettings()

  return (
    <RecipeContext.Provider value={{
      recipes, tags, settings, setSettings,
      searchQuery, setSearchQuery,
      activeTag, setActiveTag,
      loading, error,
      reload, reloadSettings,
    }}>
      {children}
    </RecipeContext.Provider>
  )
}

export const useRecipes = () => useContext(RecipeContext)
