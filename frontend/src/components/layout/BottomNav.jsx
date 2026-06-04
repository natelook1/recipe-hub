import { BookOpen, PlusCircle, ArrowLeftRight, Settings, Compass } from 'lucide-react'

const NAV = [
  { id: 'browse',    label: 'Recipes',   Icon: BookOpen        },
  { id: 'discover',  label: 'Discover',  Icon: Compass         },
  { id: 'add',       label: 'Add',       Icon: PlusCircle      },
  { id: 'converter', label: 'Convert',   Icon: ArrowLeftRight  },
  { id: 'settings',  label: 'Settings',  Icon: Settings        },
]

export default function BottomNav({ view, onNav }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 backdrop-blur border-t pb-safe-bottom" style={{ background: 'var(--color-nav-bg)', borderColor: 'var(--color-border)' }}>
      <div className="flex">
        {NAV.map(({ id, label, Icon }) => {
          const active = view === id || (view === 'detail' && id === 'browse')
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors"
              style={{ color: active ? 'var(--color-green)' : 'var(--color-text-muted)' }}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
