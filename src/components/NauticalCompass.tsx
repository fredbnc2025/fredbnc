import React from 'react';

interface NauticalCompassProps {
  size?: number;
  theme?: 'light' | 'dark';
  className?: string;
}

export const NauticalCompass: React.FC<NauticalCompassProps> = ({
  size = 220,
  theme = 'light',
  className = ''
}) => {
  const isLight = theme === 'light';

  const primaryColor = isLight ? '#0369a1' : '#38bdf8'; // Sky-700 / Sky-400
  const accentRed = '#ef4444'; // North needle red
  const secondaryColor = isLight ? '#334155' : '#94a3b8'; // Slate
  const ringBorder = isLight ? '#cbd5e1' : '#334155';
  const textColor = isLight ? '#0f172a' : '#f8fafc';
  const bgFill = isLight ? '#ffffff' : '#09132c';

  const center = size / 2;
  const radius = (size / 2) - 16;

  // Generate degree ticks (every 5 degrees, big tick every 30 degrees)
  const ticks = [];
  for (let i = 0; i < 360; i += 5) {
    const isMajor = i % 30 === 0;
    const isMedium = i % 15 === 0 && !isMajor;
    const length = isMajor ? 9 : (isMedium ? 6 : 3.5);
    const strokeWidth = isMajor ? 1.5 : (isMedium ? 1 : 0.6);
    const stroke = isMajor ? primaryColor : (isMedium ? secondaryColor : ringBorder);

    const angleRad = (i * Math.PI) / 180;
    const x1 = center + (radius - length) * Math.sin(angleRad);
    const y1 = center - (radius - length) * Math.cos(angleRad);
    const x2 = center + radius * Math.sin(angleRad);
    const y2 = center - radius * Math.cos(angleRad);

    ticks.push(
      <line
        key={`tick-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible drop-shadow-sm select-none"
      >
        <defs>
          {/* Radial subtle gradient */}
          <radialGradient id="compassBgGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={bgFill} stopOpacity="1" />
            <stop offset="85%" stopColor={isLight ? '#f8fafc' : '#020617'} stopOpacity="1" />
            <stop offset="100%" stopColor={isLight ? '#e2e8f0' : '#0f172a'} stopOpacity="1" />
          </radialGradient>

          {/* North Point Gradient */}
          <linearGradient id="northPointGradLeft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="northPointGradRight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>

          {/* Primary Point Gradients */}
          <linearGradient id="pointGradLight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isLight ? '#0284c7' : '#38bdf8'} />
            <stop offset="100%" stopColor={isLight ? '#38bdf8' : '#7dd3fc'} />
          </linearGradient>
          <linearGradient id="pointGradDark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isLight ? '#0369a1' : '#0284c7'} />
            <stop offset="100%" stopColor={isLight ? '#075985' : '#0369a1'} />
          </linearGradient>

          {/* Secondary Point Gradients */}
          <linearGradient id="secPointLight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isLight ? '#94a3b8' : '#64748b'} />
            <stop offset="100%" stopColor={isLight ? '#cbd5e1' : '#94a3b8'} />
          </linearGradient>
          <linearGradient id="secPointDark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isLight ? '#64748b' : '#475569'} />
            <stop offset="100%" stopColor={isLight ? '#475569' : '#334155'} />
          </linearGradient>
        </defs>

        {/* Outer Ring Circles */}
        <circle
          cx={center}
          cy={center}
          r={radius + 4}
          fill="none"
          stroke={primaryColor}
          strokeWidth="2"
          opacity="0.85"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="url(#compassBgGrad)"
          stroke={ringBorder}
          strokeWidth="1.2"
        />
        <circle
          cx={center}
          cy={center}
          r={radius - 12}
          fill="none"
          stroke={ringBorder}
          strokeWidth="0.8"
          strokeDasharray="2 2"
        />

        {/* Degree Ticks */}
        <g>{ticks}</g>

        {/* INTERCARDINAL POINTS (NE, SE, SO, NO) - Star points */}
        <g transform={`translate(${center}, ${center})`}>
          {/* 45° - NE */}
          <g transform="rotate(45)">
            <polygon points="0,0 -8,-22 0,-56" fill="url(#secPointLight)" />
            <polygon points="0,0 8,-22 0,-56" fill="url(#secPointDark)" />
          </g>
          {/* 135° - SE */}
          <g transform="rotate(135)">
            <polygon points="0,0 -8,-22 0,-56" fill="url(#secPointLight)" />
            <polygon points="0,0 8,-22 0,-56" fill="url(#secPointDark)" />
          </g>
          {/* 225° - SO / SW */}
          <g transform="rotate(225)">
            <polygon points="0,0 -8,-22 0,-56" fill="url(#secPointLight)" />
            <polygon points="0,0 8,-22 0,-56" fill="url(#secPointDark)" />
          </g>
          {/* 315° - NO / NW */}
          <g transform="rotate(315)">
            <polygon points="0,0 -8,-22 0,-56" fill="url(#secPointLight)" />
            <polygon points="0,0 8,-22 0,-56" fill="url(#secPointDark)" />
          </g>

          {/* CARDINAL POINTS (N, E, S, O/W) - Primary larger star */}
          {/* ESTE (90°) */}
          <g transform="rotate(90)">
            <polygon points="0,0 -12,-26 0,-76" fill="url(#pointGradLight)" />
            <polygon points="0,0 12,-26 0,-76" fill="url(#pointGradDark)" />
          </g>
          {/* SUR (180°) */}
          <g transform="rotate(180)">
            <polygon points="0,0 -12,-26 0,-76" fill="url(#pointGradLight)" />
            <polygon points="0,0 12,-26 0,-76" fill="url(#pointGradDark)" />
          </g>
          {/* OESTE (270°) */}
          <g transform="rotate(270)">
            <polygon points="0,0 -12,-26 0,-76" fill="url(#pointGradLight)" />
            <polygon points="0,0 12,-26 0,-76" fill="url(#pointGradDark)" />
          </g>
          {/* NORTE (0° / 360°) - Destacado en Rojo Heráldico */}
          <g transform="rotate(0)">
            <polygon points="0,0 -13,-28 0,-82" fill="url(#northPointGradLeft)" />
            <polygon points="0,0 13,-28 0,-82" fill="url(#northPointGradRight)" />
            {/* Fleur de Lis / North arrow accent */}
            <polygon points="0,-84 -4,-74 0,-78 4,-74" fill={accentRed} />
          </g>
        </g>

        {/* Center Pivot Hub */}
        <circle
          cx={center}
          cy={center}
          r={10}
          fill={isLight ? '#0f172a' : '#ffffff'}
          stroke={primaryColor}
          strokeWidth="2"
        />
        <circle
          cx={center}
          cy={center}
          r={4}
          fill={accentRed}
        />

        {/* CARDINAL LABELS (NORTE, SUR, ESTE, OESTE) */}
        {/* NORTE (N) */}
        <g transform={`translate(${center}, 18)`}>
          <circle cx={0} cy={-2} r={11} fill={accentRed} />
          <text
            x={0}
            y={2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize="12.5"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
          >
            N
          </text>
          <text
            x={0}
            y={14}
            textAnchor="middle"
            fill={accentRed}
            fontSize="7"
            fontWeight="bold"
            letterSpacing="1"
          >
            NORTE
          </text>
        </g>

        {/* SUR (S) */}
        <g transform={`translate(${center}, ${size - 18})`}>
          <circle cx={0} cy={2} r={10} fill={isLight ? '#0f172a' : '#1e293b'} stroke={ringBorder} strokeWidth="1" />
          <text
            x={0}
            y={2.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize="11.5"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
          >
            S
          </text>
          <text
            x={0}
            y={-11}
            textAnchor="middle"
            fill={textColor}
            fontSize="7"
            fontWeight="bold"
            letterSpacing="1"
          >
            SUR
          </text>
        </g>

        {/* ESTE (E) */}
        <g transform={`translate(${size - 18}, ${center})`}>
          <circle cx={2} cy={0} r={10} fill={isLight ? '#0f172a' : '#1e293b'} stroke={ringBorder} strokeWidth="1" />
          <text
            x={2}
            y={0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize="11.5"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
          >
            E
          </text>
          <text
            x={-12}
            y={0.5}
            textAnchor="end"
            dominantBaseline="middle"
            fill={textColor}
            fontSize="7"
            fontWeight="bold"
            letterSpacing="1"
          >
            ESTE
          </text>
        </g>

        {/* OESTE (O / W) */}
        <g transform={`translate(18, ${center})`}>
          <circle cx={-2} cy={0} r={10} fill={isLight ? '#0f172a' : '#1e293b'} stroke={ringBorder} strokeWidth="1" />
          <text
            x={-2}
            y={0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize="11.5"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
          >
            O
          </text>
          <text
            x={12}
            y={0.5}
            textAnchor="start"
            dominantBaseline="middle"
            fill={textColor}
            fontSize="7"
            fontWeight="bold"
            letterSpacing="1"
          >
            OESTE
          </text>
        </g>

        {/* Intercardinal Labels (NE, SE, SO, NO) */}
        <text
          x={center + (radius - 22) * Math.sin((45 * Math.PI) / 180)}
          y={center - (radius - 22) * Math.cos((45 * Math.PI) / 180)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={secondaryColor}
          fontSize="7.5"
          fontWeight="bold"
        >
          NE
        </text>
        <text
          x={center + (radius - 22) * Math.sin((135 * Math.PI) / 180)}
          y={center - (radius - 22) * Math.cos((135 * Math.PI) / 180)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={secondaryColor}
          fontSize="7.5"
          fontWeight="bold"
        >
          SE
        </text>
        <text
          x={center + (radius - 22) * Math.sin((225 * Math.PI) / 180)}
          y={center - (radius - 22) * Math.cos((225 * Math.PI) / 180)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={secondaryColor}
          fontSize="7.5"
          fontWeight="bold"
        >
          SO
        </text>
        <text
          x={center + (radius - 22) * Math.sin((315 * Math.PI) / 180)}
          y={center - (radius - 22) * Math.cos((315 * Math.PI) / 180)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={secondaryColor}
          fontSize="7.5"
          fontWeight="bold"
        >
          NO
        </text>
      </svg>
    </div>
  );
};
