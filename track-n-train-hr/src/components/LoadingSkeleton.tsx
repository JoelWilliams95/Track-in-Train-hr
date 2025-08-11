export default function LoadingSkeleton({ darkMode = false }: { darkMode?: boolean }) {
  const skeletonColor = darkMode ? '#374151' : '#f3f4f6';
  const bgColor = darkMode ? '#1f2937' : '#ffffff';

  return (
    <div style={{
      backgroundColor: bgColor,
      borderRadius: '20px',
      padding: '2.5rem',
      boxShadow: darkMode
        ? "0 8px 32px rgba(0,0,0,0.25)"
        : "0 8px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
    }}>
      {/* Header Skeleton */}
      <div style={{
        height: '40px',
        backgroundColor: skeletonColor,
        borderRadius: '8px',
        marginBottom: '24px',
        animation: 'pulse 2s infinite'
      }} />

      {/* Search Bar Skeleton */}
      <div style={{
        height: '60px',
        backgroundColor: skeletonColor,
        borderRadius: '16px',
        marginBottom: '24px',
        animation: 'pulse 2s infinite'
      }} />

      {/* Table Header Skeleton */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{
            flex: 1,
            height: '40px',
            backgroundColor: skeletonColor,
            borderRadius: '8px',
            animation: 'pulse 2s infinite'
          }} />
        ))}
      </div>

      {/* Table Rows Skeleton */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map(row => (
        <div key={row} style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px'
        }}>
          {[1, 2, 3, 4, 5, 6].map(col => (
            <div key={col} style={{
              flex: 1,
              height: '48px',
              backgroundColor: skeletonColor,
              borderRadius: '6px',
              animation: 'pulse 2s infinite',
              animationDelay: `${(row + col) * 0.1}s`
            }} />
          ))}
        </div>
      ))}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
