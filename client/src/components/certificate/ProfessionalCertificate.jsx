import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Printer, Copy, Check, ShieldCheck } from 'lucide-react'
import { Button } from '../ui/button'

/**
 * High-Density Mathematical Guilloche Lathework Security Border & Corner Medallions
 * Emulates authentic banknote / sovereign diploma security printing in System Blue (#0000ff) & Midnight Navy (#0b192c)
 */
function ExecutiveGuillocheBorder() {
  // Generate mathematical lathework spiral waves for top and bottom borders
  const generateLatheWave = (baseY, amplitude = 5, frequency = 0.08) => {
    let d1 = `M 60,${baseY}`
    let d2 = `M 60,${baseY}`
    for (let x = 60; x <= 940; x += 4) {
      const y1 = baseY + Math.sin(x * frequency) * amplitude + Math.cos(x * frequency * 0.5) * (amplitude * 0.5)
      const y2 = baseY - Math.sin(x * frequency) * amplitude - Math.cos(x * frequency * 0.5) * (amplitude * 0.5)
      d1 += ` L ${x},${y1.toFixed(2)}`
      d2 += ` L ${x},${y2.toFixed(2)}`
    }
    return { d1, d2 }
  }

  // Generate mathematical lathework spiral waves for left and right borders
  const generateVerticalLatheWave = (baseX, amplitude = 5, frequency = 0.08) => {
    let d1 = `M ${baseX},60`
    let d2 = `M ${baseX},60`
    for (let y = 60; y <= 647; y += 4) {
      const x1 = baseX + Math.sin(y * frequency) * amplitude + Math.cos(y * frequency * 0.5) * (amplitude * 0.5)
      const x2 = baseX - Math.sin(y * frequency) * amplitude - Math.cos(y * frequency * 0.5) * (amplitude * 0.5)
      d1 += ` L ${x1.toFixed(2)},${y}`
      d2 += ` L ${x2.toFixed(2)},${y}`
    }
    return { d1, d2 }
  }

  const topWaves = generateLatheWave(36, 4.5, 0.075)
  const bottomWaves = generateLatheWave(671, 4.5, 0.075)
  const leftWaves = generateVerticalLatheWave(36, 4.5, 0.075)
  const rightWaves = generateVerticalLatheWave(964, 4.5, 0.075)

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      <svg
        viewBox="0 0 1000 707"
        className="w-full h-full object-cover"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Subtle Security Currency Micro-Pattern */}
          <pattern id="execBondPattern" width="28" height="28" patternUnits="userSpaceOnUse">
            <path
              d="M 0,14 Q 7,7 14,14 T 28,14 M 14,0 Q 7,7 14,14 T 14,28"
              fill="none"
              stroke="#0000ff"
              strokeWidth="0.45"
              strokeOpacity="0.05"
            />
            <circle cx="14" cy="14" r="1.5" fill="#0000ff" fillOpacity="0.035" />
          </pattern>

          {/* Luxury Executive Parchment Radial Gradient */}
          <radialGradient id="execPaperGrad" cx="50%" cy="50%" r="62%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="60%" stopColor="#fbfdff" stopOpacity="0.9" />
            <stop offset="85%" stopColor="#f4f7fe" stopOpacity="0.94" />
            <stop offset="100%" stopColor="#eaf0fc" stopOpacity="0.99" />
          </radialGradient>
        </defs>

        {/* Paper Fill with Security Micro-Pattern */}
        <rect width="1000" height="707" fill="url(#execPaperGrad)" />
        <rect width="1000" height="707" fill="url(#execBondPattern)" />

        {/* Primary Midnight Navy Outer Framework (Heavy Anchor Rule) */}
        <rect
          x="16"
          y="16"
          width="968"
          height="675"
          fill="none"
          stroke="#0b192c"
          strokeWidth="4"
          rx="2"
        />

        {/* Secondary Hairline Framing Inset */}
        <rect
          x="24"
          y="24"
          width="952"
          height="659"
          fill="none"
          stroke="#0000ff"
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />

        {/* Inner Delimiting Border */}
        <rect
          x="48"
          y="48"
          width="904"
          height="611"
          fill="none"
          stroke="#0000ff"
          strokeWidth="0.8"
          strokeOpacity="0.35"
        />

        {/* High-Frequency Mathematical Guilloche Wave Bands */}
        <g stroke="#0000ff" fill="none" strokeWidth="0.75" strokeOpacity="0.28" strokeLinecap="round">
          {/* Top Edge */}
          <path d={topWaves.d1} />
          <path d={topWaves.d2} />
          {/* Bottom Edge */}
          <path d={bottomWaves.d1} />
          <path d={bottomWaves.d2} />
          {/* Left Edge */}
          <path d={leftWaves.d1} />
          <path d={leftWaves.d2} />
          {/* Right Edge */}
          <path d={rightWaves.d1} />
          <path d={rightWaves.d2} />
        </g>

        {/* Four Classical Spirograph Corner Medallions */}
        {[
          { cx: 36, cy: 36, id: 'tl' },
          { cx: 964, cy: 36, id: 'tr' },
          { cx: 36, cy: 671, id: 'bl' },
          { cx: 964, cy: 671, id: 'br' },
        ].map((c) => (
          <g key={c.id}>
            <circle cx={c.cx} cy={c.cy} r="18" fill="#ffffff" stroke="#0b192c" strokeWidth="1.8" />
            <circle cx={c.cx} cy={c.cy} r="14" fill="none" stroke="#0000ff" strokeWidth="0.9" strokeDasharray="2,2" />
            <circle cx={c.cx} cy={c.cy} r="10" fill="none" stroke="#0000ff" strokeWidth="1.2" />
            <circle cx={c.cx} cy={c.cy} r="5" fill="#0000ff" />
            <circle cx={c.cx} cy={c.cy} r="2" fill="#ffffff" />
          </g>
        ))}

        {/* Center Decorative Guilloche Lathe Rings Behind Platform Watermark */}
        <g transform="translate(500, 353)" stroke="#0000ff" fill="none">
          <circle cx="0" cy="0" r="235" strokeWidth="0.8" strokeOpacity="0.1" strokeDasharray="6,4" />
          <circle cx="0" cy="0" r="200" strokeWidth="1.2" strokeOpacity="0.14" />
          <circle cx="0" cy="0" r="165" strokeWidth="0.6" strokeOpacity="0.08" strokeDasharray="3,3" />

          {/* 16-lobe rosette petal waves */}
          {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((angle) => (
            <path
              key={angle}
              d="M 0,-200 C 35,-170 45,-130 0,-115 C -45,-130 -35,-170 0,-200 Z"
              transform={`rotate(${angle})`}
              strokeWidth="0.8"
              strokeOpacity="0.09"
            />
          ))}
        </g>
      </svg>
    </div>
  )
}

/**
 * Official Embossed Academy Rosette Seal with Royal Blue Ribbon
 */
function OfficialAcademyRosette() {
  const points = 36
  const outerR = 38
  const innerR = 34
  const pathD = Array.from({ length: points * 2 }).map((_, i) => {
    const angle = (i * Math.PI) / points
    const r = i % 2 === 0 ? outerR : innerR
    const x = 50 + r * Math.sin(angle)
    const y = 50 - r * Math.cos(angle)
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ') + ' Z'

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* 36-Point Fluted Medallion */}
      <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
        {/* Fluted Edge */}
        <path d={pathD} fill="#0000ff" stroke="#0b192c" strokeWidth="1.2" />

        {/* Concentric Contrast Rings */}
        <circle cx="50" cy="50" r="30" fill="#0b192c" stroke="#ffffff" strokeWidth="1.2" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="#0000ff" strokeWidth="1" strokeDasharray="3,1.5" />
        <circle cx="50" cy="50" r="22" fill="#0000ff" />

        {/* Center Star & Crest */}
        <path
          d="M 50,33 L 53,42 L 62,42 L 55,47 L 58,56 L 50,51 L 42,56 L 45,47 L 38,42 L 47,42 Z"
          fill="#ffffff"
        />

        {/* Circular Lettering */}
        <text
          x="50"
          y="63"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="4.8"
          fontWeight="bold"
          letterSpacing="0.08em"
          fontFamily="'Cinzel', serif"
        >
          SEAL OF EXCELLENCE
        </text>
        <text
          x="50"
          y="68"
          textAnchor="middle"
          fill="#ffffff"
          opacity="0.85"
          fontSize="3.8"
          fontWeight="bold"
          letterSpacing="0.12em"
          fontFamily="monospace"
        >
          2026
        </text>
      </svg>

      {/* Hanging Royal Blue Satin Ribbon Tails */}
      <div className="flex justify-center -mt-2 gap-1 pointer-events-none">
        <svg viewBox="0 0 24 38" className="w-4 h-6 text-[#0000ff] drop-shadow-sm -rotate-6">
          <path d="M 0,0 L 24,0 L 24,38 L 12,28 L 0,38 Z" fill="currentColor" stroke="#0b192c" strokeWidth="0.8" />
        </svg>
        <svg viewBox="0 0 24 38" className="w-4 h-6 text-[#0000cc] drop-shadow-sm rotate-6">
          <path d="M 0,0 L 24,0 L 24,38 L 12,28 L 0,38 Z" fill="currentColor" stroke="#0b192c" strokeWidth="0.8" />
        </svg>
      </div>
    </div>
  )
}

/**
 * Vector QR Code Generator in System Blue
 */
function CertificateQRCode({ value, size = 52 }) {
  const matrixSize = 21
  const modules = Array(matrixSize).fill(null).map(() => Array(matrixSize).fill(false))

  const drawFinder = (startX, startY) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          modules[startY + r][startX + c] = true
        }
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(14, 0)
  drawFinder(0, 14)

  for (let i = 8; i < 13; i++) {
    modules[6][i] = i % 2 === 0
    modules[i][6] = i % 2 === 0
  }

  let hash = 0
  const str = String(value || 'BLUESPACE-FINTECH')
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      const inTopLeft = r <= 7 && c <= 7
      const inTopRight = r <= 7 && c >= 13
      const inBottomLeft = r >= 13 && c <= 7
      if (!inTopLeft && !inTopRight && !inBottomLeft && modules[r][c] === false) {
        const seed = (r * 31 + c * 17 + hash) & 0xfffff
        modules[r][c] = (seed % 3 === 0 || seed % 7 === 0)
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${matrixSize} ${matrixSize}`}
      width={size}
      height={size}
      className="bg-white p-1 rounded border border-blue-200/90 shadow-xs shrink-0"
      aria-label={`Verification code for ${value}`}
    >
      {modules.map((row, r) =>
        row.map((active, c) =>
          active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0000ff" /> : null
        )
      )}
    </svg>
  )
}

/**
 * Authentic Hand-Drawn Executive Signatures in System Blue
 */
function ExecutiveSignature({ variant = 1 }) {
  if (variant === 1) {
    return (
      <svg viewBox="0 0 180 44" className="h-9 w-32 sm:w-36 mx-auto stroke-[#0000ff] fill-none">
        <path
          d="M 12,30 C 18,10 24,6 30,22 C 34,32 40,16 48,12 C 58,8 68,26 78,20 C 92,12 108,8 120,24 C 130,34 142,16 162,18"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 22,28 Q 70,36 154,20"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 180 44" className="h-9 w-32 sm:w-36 mx-auto stroke-[#0000ff] fill-none">
      <path
        d="M 16,18 C 22,34 30,38 42,22 C 50,12 60,10 70,26 C 78,38 90,14 102,18 C 114,22 130,10 146,28 C 154,34 162,20 168,24"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 18,32 Q 85,22 158,30"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
    </svg>
  )
}

/**
 * Professional World-Class Certificate
 */
export default function ProfessionalCertificate({
  fellowName = 'Emmanuel Johnson',
  studentId = 'BS-2026-0042',
  track = 'FinCore',
  certificateTitle,
  cohortName = 'Cohort 1 - December 2026',
  certificateNumber = 'BSA-2026-000042',
  verificationToken = 'a0000000-0000-0000-0000-000000000001',
  issuedAt,
  partnerName,
  partnerLogoUrl,
  bluespaceLogoUrl,
  finalGrade,
  showActions = true,
}) {
  const [copied, setCopied] = useState(false)

  // Dynamically load world-class diploma fonts (Cinzel, Playfair Display, Cormorant Garamond)
  useEffect(() => {
    const id = 'cert-google-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,400;1,600;1,700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,600&family=Work+Sans:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
  }, [])

  const displayTitle =
    certificateTitle ||
    (track === 'FaaS'
      ? 'Fintech-as-a-Service & Open Banking'
      : track === 'FinCore'
      ? 'Core Banking & Ledger Architecture'
      : track === 'FinOps'
      ? 'Fintech Operations & Treasury Systems'
      : (track === 'FinInfra' || track === 'FinFra')
      ? 'Fintech Infrastructure & Cyber Resilience'
      : 'Fintech Engineering Fellowship')

  const formattedDate = issuedAt
    ? new Date(issuedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

  const verificationUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verify-certificate/${verificationToken}`
      : `https://academy.bluespacefinancial.com/verify-certificate/${verificationToken}`

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(verificationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Clean Minimal Action Bar (Hidden during print) */}
      {showActions && (
        <div className="print:hidden flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200/90 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-brand-700 border border-blue-200">
              <ShieldCheck size={14} className="text-[#0000ff]" />
              Verified Academic Credential
            </span>
            <span className="text-xs font-mono font-medium text-gray-500 hidden sm:inline" style={{ fontVariantNumeric: 'tabular-nums' }}>
              Ref: {certificateNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs font-medium border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={13} className="mr-1.5 text-emerald-600" />
                  Copied Link!
                </>
              ) : (
                <>
                  <Copy size={13} className="mr-1.5" />
                  Copy Verification Link
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="text-xs font-semibold bg-[#0000ff] hover:bg-[#0000cc] text-white shadow-sm cursor-pointer"
            >
              <Printer size={13} className="mr-1.5" />
              Download / Print PDF
            </Button>
          </div>
        </div>
      )}

      {/* Landscape Certificate Container (True A4 Landscape Ratio 1.414 : 1) */}
      <div
        id="certificate-print-area"
        className="relative w-full max-w-5xl mx-auto aspect-[1.414/1] bg-white rounded-xl shadow-2xl overflow-hidden p-8 sm:p-12 flex flex-col justify-between print:p-8 print:shadow-none print:w-full print:max-w-none print:rounded-none"
        style={{
          boxSizing: 'border-box',
          fontFamily: "'Work Sans', system-ui, sans-serif",
        }}
      >
        {/* Layered Mathematical Security Guilloche Background */}
        <ExecutiveGuillocheBorder />

        {/* Platform Watermark (Centered with Crisp, Legible Optical Contrast) */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center select-none opacity-[0.08]"
          aria-hidden="true"
        >
          <img
            src="/logo-dark.png"
            alt=""
            className="w-[460px] max-w-[65%] object-contain"
          />
        </div>

        {/* 1. Header: Institutional Identity & Classical Honors Header */}
        <div className="relative z-10 text-center space-y-2">
          {/* Institution & Partner Badges */}
          <div className="flex items-center justify-center gap-3">
            <img
              src={bluespaceLogoUrl || '/logo-dark.png'}
              alt="BlueSPACE Academy"
              className="h-9 sm:h-11 w-auto object-contain drop-shadow-sm"
              onError={(e) => {
                e.currentTarget.src = '/logo-dark.png'
              }}
            />
            {partnerName && (
              <>
                <span className="text-gray-300 font-light text-xl">|</span>
                {partnerLogoUrl ? (
                  <img src={partnerLogoUrl} alt={partnerName} className="h-8 sm:h-10 w-auto object-contain rounded" />
                ) : (
                  <span
                    className="text-xs font-bold text-[#0b192c] uppercase tracking-wider"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {partnerName}
                  </span>
                )}
              </>
            )}
          </div>

          <div>
            <h1
              className="text-xs sm:text-sm font-bold uppercase tracking-[0.32em] text-[#0b192c]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              BlueSPACE Fintech Academy
            </h1>
            <p
              className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.24em] text-[#0000ff] mt-0.5"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Official Credential of Completion & Mastery
            </p>
          </div>
        </div>

        {/* 2. Recipient & Degree/Track Body (Classical Diploma Inscription) */}
        <div className="relative z-10 text-center space-y-2 my-auto py-2">
          <p
            className="text-sm sm:text-base text-gray-500 font-medium italic tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            This is to certify that
          </p>

          {/* Fellow Full Name (The Undisputed Star Element) */}
          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#0b192c] tracking-tight leading-tight capitalize"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {fellowName}
          </h2>

          {/* Delicate Hairline Flourish with Center Diamond Pip */}
          <div className="flex items-center justify-center gap-2 max-w-xs sm:max-w-md mx-auto my-1">
            <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#0000ff] to-transparent" />
            <div className="w-2.5 h-2.5 rotate-45 border-2 border-[#0000ff] bg-white shadow-xs" />
            <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#0000ff] to-transparent" />
          </div>

          {/* Fellow Identification & Cohort */}
          <p className="text-[11px] sm:text-xs font-medium text-gray-500">
            Fellow ID: <span className="font-mono font-bold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{studentId}</span>
            <span className="mx-2 text-gray-300">•</span>
            {cohortName}
          </p>

          <p
            className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto pt-1 leading-relaxed"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '15px' }}
          >
            having successfully fulfilled the curriculum, intensive architectural labs, and defense of the production fintech capstone in
          </p>

          {/* Classical Engraved Specialization Track (No software pill badge) */}
          <div className="pt-2 space-y-1">
            <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#0000ff]/60 to-[#0000ff]" />
              <span
                className="text-[10px] tracking-[0.28em] uppercase text-[#0000ff] font-bold"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Specialization Track
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#0000ff]/60 to-[#0000ff]" />
            </div>

            <h3
              className="text-xl sm:text-2xl md:text-3xl font-extrabold uppercase text-[#0b192c] tracking-[0.14em]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {displayTitle}
            </h3>

            {finalGrade && (
              <p className="text-[11px] font-semibold text-gray-600">
                Academic Distinction Score: <span className="text-[#0000ff] font-bold">{finalGrade}%</span>
              </p>
            )}
          </div>
        </div>

        {/* 3. Signatures, Embossed Seal of Excellence & Registry Strip */}
        <div className="relative z-10 space-y-3">
          <div className="grid grid-cols-3 items-end max-w-3xl mx-auto gap-4 pt-1">
            {/* Left: Academic Director Signature */}
            <div className="text-center space-y-1">
              <ExecutiveSignature variant={1} />
              <div className="w-36 sm:w-40 h-[1.5px] bg-[#0000ff]/60 mx-auto" />
              <p className="text-xs font-bold text-[#0b192c] leading-tight">Emmanuel Johnson</p>
              <p
                className="text-[9.5px] text-gray-500 uppercase tracking-wider font-semibold"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Academic Director
              </p>
            </div>

            {/* Center: Official Embossed Seal with Satin Ribbon */}
            <div className="flex justify-center -mb-1">
              <OfficialAcademyRosette />
            </div>

            {/* Right: Technical Review Board Signature */}
            <div className="text-center space-y-1">
              <ExecutiveSignature variant={2} />
              <div className="w-36 sm:w-40 h-[1.5px] bg-[#0000ff]/60 mx-auto" />
              <p className="text-xs font-bold text-[#0b192c] leading-tight">Dr. Kwabena Mensah</p>
              <p
                className="text-[9.5px] text-gray-500 uppercase tracking-wider font-semibold"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Chair, Technical Review Board
              </p>
            </div>
          </div>

          {/* Bottom Official Notary & Registry Strip */}
          <div className="pt-3 border-t border-gray-200/90 flex items-center justify-between text-xs">
            {/* Left: QR Code & Serial Number */}
            <div className="flex items-center gap-3">
              <CertificateQRCode value={verificationUrl} size={48} />
              <div className="text-left">
                <span className="text-[9.5px] font-mono text-gray-400 uppercase tracking-wider block">
                  Serial Number
                </span>
                <span className="font-mono font-bold text-[#0000ff] text-xs sm:text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {certificateNumber}
                </span>
              </div>
            </div>

            {/* Right: Date Conferred */}
            <div className="text-right">
              <span className="text-[9.5px] font-mono text-gray-400 uppercase tracking-wider block">
                Date Conferred
              </span>
              <span className="font-mono font-bold text-gray-900 text-xs sm:text-sm">
                {formattedDate}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

ProfessionalCertificate.propTypes = {
  fellowName: PropTypes.string,
  studentId: PropTypes.string,
  track: PropTypes.string,
  certificateTitle: PropTypes.string,
  cohortName: PropTypes.string,
  certificateNumber: PropTypes.string,
  verificationToken: PropTypes.string,
  issuedAt: PropTypes.string,
  partnerName: PropTypes.string,
  partnerLogoUrl: PropTypes.string,
  bluespaceLogoUrl: PropTypes.string,
  finalGrade: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  showActions: PropTypes.bool,
}
