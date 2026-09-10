import React from 'react';
import { useBranding } from '../context/BrandingContext';

interface SchoolLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  customUrl?: string | null;
}

/**
 * Official School Emblem for Ensemble Scolaire Notre Dame des Missions Saint Pierre
 * Either renders the user's uploaded custom logo image or falls back to the high-fidelity vector.
 */
export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 120,
  showText = true,
  customUrl,
}) => {
  const branding = useBranding();
  const activeLogo = customUrl !== undefined ? customUrl : branding.logoUrl;

  if (activeLogo) {
    return (
      <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
        <img
          src={activeLogo}
          alt="Logo officiel Notre Dame des Missions Saint Pierre"
          style={{
            maxHeight: showText ? size * 1.22 : size,
            maxWidth: size * 1.5,
            height: 'auto',
            width: 'auto',
          }}
          className="object-contain drop-shadow-2xs"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={size}
        height={showText ? size * 1.22 : size}
        viewBox="0 0 200 244"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        aria-label="Logo officiel Notre Dame des Missions Saint Pierre - Grandir Ensemble"
      >
        <defs>
          {/* Main vertical flame gradient matching Capture d'écran 2026-09-07 191946.png */}
          <linearGradient id="ndmFlameMainGrad" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#fde396" stopOpacity="0.95" />
            <stop offset="12%" stopColor="#fdb838" />
            <stop offset="35%" stopColor="#f57d20" />
            <stop offset="65%" stopColor="#eb4d23" />
            <stop offset="85%" stopColor="#dc3520" />
            <stop offset="100%" stopColor="#c82419" />
          </linearGradient>

          {/* Inner luminous core of the flame */}
          <linearGradient id="ndmFlameCoreGrad" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#fff3b0" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#fdbd4a" stopOpacity="0.75" />
            <stop offset="85%" stopColor="#f57a22" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#e5391e" stopOpacity="0.2" />
          </linearGradient>

          {/* Secondary flame tongues gradient */}
          <linearGradient id="ndmFlameTongueGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#fcb63b" />
            <stop offset="50%" stopColor="#f46b22" />
            <stop offset="100%" stopColor="#d8321e" />
          </linearGradient>
        </defs>

        {/* 1. BACKGROUND / LATERAL ARCS OF THE SPHERE (Sky Blue #009fe3) */}
        <g stroke="#009fe3" fill="none" strokeLinecap="round">
          {/* Far left and right meridian sweeps creating spherical volume */}
          <path
            d="M 98 26 C 62 30, 24 58, 16 100 C 10 134, 28 168, 62 186 C 75 192, 88 195, 96 195"
            strokeWidth="1.9"
            stroke="#008ecf"
          />
          <path
            d="M 92 24 C 54 36, 30 76, 28 116 C 26 148, 48 178, 86 194"
            strokeWidth="1.3"
            stroke="#16a8ea"
            opacity="0.85"
          />
          <path
            d="M 104 26 C 142 30, 178 58, 185 100 C 191 134, 172 168, 138 186 C 125 192, 112 195, 104 195"
            strokeWidth="1.9"
            stroke="#008ecf"
          />
          <path
            d="M 108 24 C 146 36, 170 76, 172 116 C 174 148, 152 178, 114 194"
            strokeWidth="1.3"
            stroke="#16a8ea"
            opacity="0.85"
          />

          {/* Secondary inner meridians */}
          <path
            d="M 96 24 C 74 38, 52 74, 52 114 C 52 148, 70 176, 94 192"
            strokeWidth="1.4"
            stroke="#009fe3"
            opacity="0.9"
          />
          <path
            d="M 104 24 C 126 38, 148 74, 148 114 C 148 148, 130 176, 106 192"
            strokeWidth="1.4"
            stroke="#009fe3"
            opacity="0.9"
          />

          {/* Upper hemisphere latitude curves */}
          <path
            d="M 38 68 C 62 52, 138 52, 162 68"
            strokeWidth="1.5"
            stroke="#009fe3"
            opacity="0.8"
          />
          <path
            d="M 28 88 C 58 72, 142 72, 172 88"
            strokeWidth="1.6"
            stroke="#008ecf"
          />

          {/* Lower hemisphere latitude curves */}
          <path
            d="M 26 132 C 56 150, 144 150, 174 132"
            strokeWidth="1.6"
            stroke="#008ecf"
          />
          <path
            d="M 38 152 C 64 168, 136 168, 162 152"
            strokeWidth="1.4"
            stroke="#009fe3"
            opacity="0.85"
          />

          {/* Dynamic diagonal sweeping orbit arcs */}
          <path
            d="M 28 64 C 45 42, 140 38, 174 84 C 190 108, 164 160, 118 184"
            strokeWidth="1.3"
            stroke="#2bb3ed"
            opacity="0.75"
          />
          <path
            d="M 172 134 C 155 166, 68 182, 32 144 C 12 118, 32 60, 78 36"
            strokeWidth="1.3"
            stroke="#007ab8"
            opacity="0.75"
          />

          {/* Whisps of energetic orbital lines */}
          <path
            d="M 44 48 C 80 26, 130 28, 166 54"
            strokeWidth="1.2"
            stroke="#45bcf0"
            opacity="0.7"
          />
          <path
            d="M 34 164 C 70 186, 130 184, 164 158"
            strokeWidth="1.2"
            stroke="#0084c7"
            opacity="0.7"
          />
        </g>

        {/* 2. THE CENTRAL VERTICAL FLAME (Ascending through and above the globe) */}
        <g>
          {/* Main full flame body with authentic flickers and spires */}
          <path
            d="M 100 192
               C 94 186, 88 174, 90 162
               C 92 154, 97 148, 93 138
               C 89 128, 86 122, 91 112
               C 95 104, 99 98, 94 88
               C 90 80, 88 72, 93 62
               C 96 54, 99 44, 97 32
               C 96 22, 94 16, 96 8
               C 97 4, 99 2, 100 0
               C 101 2, 103 4, 104 8
               C 106 16, 104 22, 103 32
               C 101 44, 104 54, 107 62
               C 112 72, 110 80, 106 88
               C 101 98, 105 104, 109 112
               C 114 122, 111 128, 107 138
               C 103 148, 108 154, 110 162
               C 112 174, 106 186, 100 192 Z"
            fill="url(#ndmFlameMainGrad)"
          />

          {/* Left tall licking flame tongue */}
          <path
            d="M 97 50
               C 94 42, 90 32, 92 20
               C 93 14, 95 10, 94 6
               C 95 9, 96 15, 96 22
               C 96 32, 98 42, 99 48 Z"
            fill="url(#ndmFlameTongueGrad)"
          />

          {/* Right secondary licking flame tongue */}
          <path
            d="M 103 62
               C 106 50, 110 38, 108 24
               C 107 18, 105 12, 106 10
               C 107 14, 108 20, 108 28
               C 108 40, 105 52, 102 60 Z"
            fill="url(#ndmFlameTongueGrad)"
          />

          {/* Left mid flame flicker tongue */}
          <path
            d="M 94 105
               C 88 98, 86 90, 89 80
               C 90 76, 93 72, 92 68
               C 94 72, 95 78, 94 84
               C 94 92, 97 98, 97 104 Z"
            fill="url(#ndmFlameTongueGrad)"
            opacity="0.9"
          />

          {/* Right mid flame flicker tongue */}
          <path
            d="M 106 120
               C 112 112, 114 102, 111 92
               C 110 86, 107 80, 108 76
               C 109 82, 111 88, 110 96
               C 109 104, 106 112, 104 118 Z"
            fill="url(#ndmFlameTongueGrad)"
            opacity="0.9"
          />

          {/* Lower left flame lick */}
          <path
            d="M 92 152
               C 86 144, 86 136, 90 126
               C 92 132, 93 140, 95 148 Z"
            fill="url(#ndmFlameTongueGrad)"
            opacity="0.85"
          />

          {/* Lower right flame lick */}
          <path
            d="M 108 160
               C 114 152, 114 142, 110 134
               C 111 142, 110 150, 106 156 Z"
            fill="url(#ndmFlameTongueGrad)"
            opacity="0.85"
          />

          {/* Inner luminous heart/core providing the vibrant 3D light glow */}
          <path
            d="M 100 186
               C 96 178, 92 168, 94 156
               C 95 148, 98 142, 96 132
               C 94 122, 96 114, 98 104
               C 96 94, 96 82, 98 68
               C 99 58, 99 44, 100 32
               C 101 44, 101 58, 102 68
               C 104 82, 104 94, 102 104
               C 104 114, 106 122, 104 132
               C 102 142, 105 148, 106 156
               C 108 168, 104 178, 100 186 Z"
            fill="url(#ndmFlameCoreGrad)"
          />

          {/* Top spire bright fiery red point */}
          <path
            d="M 99 0 C 99.5 4, 100 12, 100 24 C 100 12, 100.5 4, 101 0 Z"
            fill="#bd1f14"
          />
        </g>

        {/* 3. PROMINENT FOREGROUND TILTED EQUATORIAL BELT (Encircling waist of sphere) */}
        <g stroke="#009fe3" fill="none" strokeLinecap="round">
          {/* Sweeping tilted ring that crosses over the flame with transparency */}
          <path
            d="M 22 108 C 24 128, 96 138, 148 126 C 172 120, 184 110, 178 98 C 174 90, 145 80, 102 82 C 58 84, 20 94, 22 108"
            strokeWidth="2.2"
            stroke="#0095db"
            opacity="0.92"
          />
          {/* Secondary parallel equatorial accent ring */}
          <path
            d="M 32 118 C 50 134, 120 138, 164 118 C 176 112, 174 104, 150 96 C 120 86, 65 92, 38 106"
            strokeWidth="1.5"
            stroke="#00aef0"
            opacity="0.85"
          />
        </g>

        {/* 4. CALLIGRAPHIC MOTTO "Grandir Ensemble" (Section 3 & Photo match) */}
        {showText && (
          <g>
            {/* Guide curve for smooth arched text matching the photo */}
            <path
              id="grandirEnsembleArc"
              d="M 10 202 Q 100 244 190 202"
              fill="none"
              stroke="none"
            />
            <text
              fill="#1b1918"
              fontSize="31"
              fontWeight="600"
              fontFamily="'Allura', 'Alex Brush', 'Great Vibes', 'MonteCarlo', 'Parisienne', 'Caveat', 'Brush Script MT', cursive"
              letterSpacing="0.8px"
              style={{
                textRendering: 'geometricPrecision',
              }}
            >
              <textPath
                href="#grandirEnsembleArc"
                startOffset="50%"
                textAnchor="middle"
              >
                Grandir Ensemble
              </textPath>
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
