export default function Loading() {
  return (
    <div className="p-8">
      <div className="animate-pulse">
        <div className="h-10 bg-gray-300 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
