import React from 'react';
import { useBranding } from '../context/BrandingContext';

interface SchoolSignatureProps {
  className?: string;
  width?: number;
  customUrl?: string | null;
}

/**
 * Official School Signature of Mikael JOUBIN (Responsable Informatique)
 * Either renders the user's uploaded custom signature image or falls back to the high-fidelity vector.
 */
export const SchoolSignature: React.FC<SchoolSignatureProps> = ({
  className = '',
  width = 165,
  customUrl,
}) => {
  const branding = useBranding();
  const activeSignature = customUrl !== undefined ? customUrl : branding.signatureUrl;

  return (
    <div className={`flex flex-col items-start select-none ${className}`}>
      <span className="font-bold text-[13px] text-black tracking-tight leading-tight">
        Mikael JOUBIN
      </span>
      <span className="text-[12px] text-black tracking-tight leading-tight">
        Responsable Informatique
      </span>

      <div className="relative -mt-0.5 -ml-1">
        {activeSignature ? (
          <img
            src={activeSignature}
            alt="Signature manuscrite de Mikael JOUBIN"
            style={{
              width,
              maxHeight: width * 0.65,
              height: 'auto',
            }}
            className="object-contain"
          />
        ) : (
          <svg
            width={width}
            height={width * 0.54}
            viewBox="0 0 290 155"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="overflow-visible"
            aria-label="Signature manuscrite de Mikael JOUBIN"
          >
          <g>
            {/* 1. Primary Stroke: Initial Loop plunging down-left + Long ascending underline slash */}
            {/* Starts mid-left with slight upward tick -> top rounded loop -> steep diagonal drop -> sharp rebound -> long diagonal underline */}
            <path
              d="M 28 48 
                 C 32 40, 48 24, 76 21 
                 C 92 20, 106 27, 112 37 
                 C 116 45, 112 55, 98 72 
                 C 74 100, 38 136, 6 150 
                 L 282 16"
              stroke="#2e2b96"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-95"
            />

            {/* Subtle double pass on the fast diagonal stroke to replicate ballpoint ink pressure */}
            <path
              d="M 12 147 L 278 18"
              stroke="#262388"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.6"
            />

            {/* 2. Cursive letter cluster crossing the diagonal line:
                - Lower loop swinging below the line (x: 122..130)
                - 1st vertical arch (x: 136, y: 52)
                - 2nd vertical arch (x: 154, y: 44)
                - 3rd vertical arch (x: 168, y: 38)
                - 4th tall slender loop reaching high (x: 184, y: 14)
                - Descending tail with subtle finish
            */}
            {/* Lower loop under the line */}
            <path
              d="M 128 78 
                 C 122 84, 116 96, 122 105 
                 C 126 111, 134 107, 137 96 
                 C 139 88, 140 76, 141 58 
                 C 142 48, 149 48, 151 58 
                 L 153 82 
                 C 155 72, 161 50, 169 48 
                 C 174 46, 177 56, 178 72 
                 L 180 34 
                 C 182 16, 189 12, 193 18 
                 C 196 24, 196 46, 194 72 
                 C 197 68, 204 62, 216 56"
              stroke="#2e2b96"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Inner accentuation of the tall loop */}
            <path
              d="M 181 30 C 183 17, 188 14, 192 19 C 194 25, 194 42, 193 64"
              stroke="#3531a8"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          </g>
        </svg>
        )}
      </div>
    </div>
  );
};
