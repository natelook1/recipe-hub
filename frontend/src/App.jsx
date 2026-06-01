import { useState } from 'react'
import { RecipeProvider } from './context/RecipeContext.jsx'
import Header from './components/layout/Header.jsx'
import BottomNav from './components/layout/BottomNav.jsx'
import { ToastContainer } from './components/layout/Toast.jsx'
import RecipeBrowser from './components/recipes/RecipeBrowser.jsx'
import RecipeDetail from './components/recipes/RecipeDetail.jsx'
import AddRecipeSheet from './components/ingest/AddRecipeSheet.jsx'
import SettingsPage from './components/settings/SettingsPage.jsx'

export default function App() {
  const [view, setView]             = useState('browse')
  const [selectedId, setSelectedId] = useState(null)
  const [showAdd, setShowAdd]       = useState(false)

  function handleSelect(id) {
    setSelectedId(id)
    setView('detail')
  }

  function handleNav(id) {
    if (id === 'add') { setShowAdd(true); return }
    setView(id)
    if (id === 'browse') setSelectedId(null)
  }

  function handleBack() {
    setView('browse')
    setSelectedId(null)
  }

  const showHeader = view === 'browse'

  return (
    <RecipeProvider>
      <div className="flex flex-col h-full bg-[#faf7f2]">
        {showHeader && <Header />}

        <main className="flex-1 overflow-y-auto">
          {view === 'browse'   && <RecipeBrowser onSelect={handleSelect} />}
          {view === 'detail'   && <RecipeDetail recipeId={selectedId} onBack={handleBack} />}
          {view === 'settings' && <SettingsPage />}
        </main>

        <BottomNav view={view} onNav={handleNav} />
        <ToastContainer />

        {showAdd && <AddRecipeSheet onClose={() => setShowAdd(false)} />}
      </div>
    </RecipeProvider>
  )
}
