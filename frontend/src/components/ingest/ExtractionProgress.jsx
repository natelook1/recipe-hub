export default function ExtractionProgress({ message = 'Extracting recipe…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="spinner w-10 h-10 border-3 border-[#c2692f] border-t-transparent rounded-full" />
      <p className="text-sm text-[#8a6a50] font-medium">{message}</p>
    </div>
  )
}
