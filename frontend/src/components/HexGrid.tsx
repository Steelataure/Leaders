export const HexGrid = () => {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.15]">
            <svg className="w-full h-full" width="100%" height="100%">
                <pattern
                    id="hex-grid"
                    width="60"
                    height="104"
                    patternUnits="userSpaceOnUse"
                    patternTransform="scale(0.5) rotate(0)"
                >
                    <path
                        d="M30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 L0 17.32 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-cyan-500"
                    />
                </pattern>
                <rect width="100%" height="100%" fill="url(#hex-grid)" />
            </svg>
            {/* Animated highlight sweeping across the grid */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-cyan-500/10 to-transparent animate-scan" style={{ height: '200%', top: '-200%' }} />
        </div>
    );
};
