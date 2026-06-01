export default function TagBadge({ tag, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-[#c2692f] text-white'
          : 'bg-[#f2d4c1] text-[#c2692f] hover:bg-[#e8956b] hover:text-white'
      }`}
    >
      {tag}
    </button>
  )
}
