
interface GlitchLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isStatic?: boolean;
}

export function GlitchLogo({ className = '', size = 'lg', isStatic = false }: GlitchLogoProps) {
  const sizeClasses: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', string> = {
    xs: 'w-20 h-20 md:w-[98px] md:h-[98px]',
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48 md:w-64 md:h-64',
    xl: 'w-64 h-64 md:w-80 md:h-80',
    '2xl': 'w-80 h-80 md:w-[480px] md:h-[480px]'
  };

  return (
    <div className={`relative flex items-center justify-center group ${sizeClasses[size]} ${className}`}>
      {/* Intense Glowing Aura behind the mask */}
      <div className={`absolute inset-4 bg-[#00F0FF]/40 blur-3xl rounded-full transition-all duration-1000 ${!isStatic ? 'group-hover:bg-[#FF3131]/40 animate-pulse' : ''}`}></div>
      
      {/* Scan Ring Effect */}
      <div className={`absolute inset-0 border-2 border-whapigen-cyan/20 rounded-full transition-colors ${!isStatic ? 'group-hover:border-whapigen-red/40 animate-spin-slow' : ''}`}></div>
      
      {/* Actual Image with Radial Mask Blending and Glitch class */}
      <img 
        src="/bg-glitch.jpg" 
        alt="The Impostor Core" 
        className={`w-full h-full object-cover relative z-10 transition-all duration-500 transform ${!isStatic ? 'group-hover:scale-110 glitch-hover' : ''}`}
        style={{
          WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 75%)',
          maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 75%)'
        }}
      />
    </div>
  );
}
