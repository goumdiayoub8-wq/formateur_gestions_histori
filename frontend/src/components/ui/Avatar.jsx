import React from 'react';

export function Avatar({ name = '', size = 40, className = '', imgUrl = null }) {
  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const getGradient = (nameStr) => {
      let hash = 0;
      for (let i = 0; i < nameStr.length; i++) {
          hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
      }
      const h1 = Math.abs(hash) % 360;
      const h2 = (h1 + 40) % 360;
      return `linear-gradient(135deg, hsl(${h1}, 70%, 55%), hsl(${h2}, 80%, 45%))`;
  }

  const initials = getInitials(name);
  const background = getGradient(name || 'Unknown');

  return (
    <div 
      className={`flex items-center justify-center rounded-full text-white font-bold tracking-wider shrink-0 ${className}`}
      style={{
         width: size,
         height: size,
         fontSize: size * 0.4,
         background: imgUrl ? 'transparent' : background,
         boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}
    >
      {imgUrl ? (
          <img src={imgUrl} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
          initials
      )}
    </div>
  );
}
