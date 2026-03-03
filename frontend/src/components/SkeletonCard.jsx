/**
 * Pulsing skeleton loader using shimmer animation.
 * Props:
 *   lines  — number of text lines to show (default 3)
 *   height — height of each line in px (default 14)
 *   className — extra wrapper classes
 */
export default function SkeletonCard({ lines = 3, height = 14, className = '' }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height: `${height}px`,
            width: i === lines - 1 ? '65%' : '100%',
          }}
        />
      ))}
    </div>
  )
}
