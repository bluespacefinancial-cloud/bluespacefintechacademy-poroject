import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { CheckCircle2, Printer, Copy, Check, ShieldCheck, Award } from 'lucide-react'
import { Button } from '../ui/button'

/**
 * Rich Ornamental Guilloche Security Background & Corner Medallions
 * Styled in BlueSPACE System Blue (#0000ff) and Deep Midnight Navy (#0b192c)
 */
function CertificateSecurityBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      <svg
        viewBox="0 0 1000 707"
        className="w-full h-full object-cover"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Subtle Security Micro-Mesh (Currency / Bond Paper Guilloche) */}
          <pattern id="certBondPattern" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 0,12 Q 6,6 12,12 T 24,12 M 12,0 Q 6,6 12,12 T 12,24"
              fill="none"
              stroke="#0000ff"
              strokeWidth="0.4"
              strokeOpacity="0.06"
            />
            <circle cx="12" cy="12" r="1.5" fill="#0000ff" fillOpacity="0.04" />
          </pattern>

          {/* Luxury Parchment Radial Gradient */}
          <radialGradient id="paperGrad" cx="50%" cy="50%" r="58%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#fbfdff" stopOpacity="0.85" />
            <stop offset="85%" stopColor="#f3f6fe" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#eaf0fc" stopOpacity="0.98" />
          </radialGradient>

          {/* Border Linear Gradients */}
          <linearGradient id="blueNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0000ff" />
            <stop offset="50%" stopColor="#0b192c" />
            <stop offset="100%" stopColor="#0000ff" />
          </linearGradient>

          <linearGradient id="goldAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0000ff" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#0000ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0000ff" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Paper Fill with Security Micro-Pattern */}
        <rect width="1000" height="707" fill="url(#paperGrad)" />
        <rect width="1000" height="707" fill="url(#certBondPattern)" />

        {/* Outer Solid Midnight Navy Framework */}
        <rect
          x="18"
          y="18"
          width="964"
          height="671"
          fill="none"
          stroke="#0b192c"
          strokeWidth="3.5"
          rx="4"
        />

        {/* Precision Hairline Inset */}
        <rect
          x="26"
          y="26"
          width="948"
          height="655"
          fill="none"
          stroke="#0000ff"
          strokeWidth="1.2"
          strokeOpacity="0.75"
        />

        {/* Inner Guilloche Border Wave Bands */}
        <g stroke="#0000ff" fill="none" strokeLinecap="round">
          {/* Top Edge Interwoven Guilloche Wave */}
          <path
            d="M 50,34 Q 100,24 150,34 T 250,34 T 350,34 T 450,34 T 550,34 T 650,34 T 750,34 T 850,34 T 950,34"
            strokeWidth="1"
            strokeOpacity="0.35"
          />
          <path
            d="M 50,38 Q 100,48 150,38 T 250,38 T 350,38 T 450,38 T 550,38 T 650,38 T 750,38 T 850,38 T 950,38"
            strokeWidth="1"
            strokeOpacity="0.35"
          />

          {/* Bottom Edge Interwoven Guilloche Wave */}
          <path
            d="M 50,669 Q 100,659 150,669 T 250,669 T 350,669 T 450,669 T 550,669 T 650,669 T 750,669 T 850,669 T 950,669"
            strokeWidth="1"
            strokeOpacity="0.35"
          />
          <path
            d="M 50,673 Q 100,683 150,673 T 250,673 T 350,673 T 450,673 T 550,673 T 650,673 T 750,673 T 850,673 T 950,673"
            strokeWidth="1"
            strokeOpacity="0.35"
          />

          {/* Left Edge Wave */}
          <path
            d="M 34,50 Q 24,100 34,150 T 34,250 T 34,350 T 34,450 T 34,550 T 34,650"
            strokeWidth="1"
            strokeOpacity="0.35"
          />
          <path
            d="M 38,50 Q 48,100 38,150 T 38,250 T 38,350 T 38,450 T 38,550 T 38,650"
            strokeWidth="1"
            strokeOpacity="0.35"
          />

          {/* Right Edge Wave */}
          <path
            d="M 966,50 Q 956,100 966,150 T 966,250 T 966,350 T 966,450 T 966,550 T 966,650"
            strokeWidth="1"
            strokeOpacity="0.35"
          />
          <path
            d="M 962,50 Q 972,100 962,150 T 962,250 T 962,350 T 962,450 T 962,550 T 962,650"
            strokeWidth="1"
            strokeOpacity="0.35"
          />
        </g>

        {/* Ornate Corner Spirograph Medallions */}
        {[
          { cx: 38, cy: 38, transform: '' },
          { cx: 962, cy: 38, transform: 'scale(-1, 1) translate(-1000, 0)' },
          { cx: 38, cy: 669, transform: 'scale(1, -1) translate(0, -707)' },
          { cx: 962, cy: 669, transform: 'scale(-1, -1) translate(-1000, -707)' },
        ].map((c, i) => (
          <g key={i} transform={c.transform} stroke="#0000ff" fill="none">
            {/* Concentric Decorative Rings */}
            <circle cx="38" cy="38" r="16" strokeWidth="1.5" stroke="#0b192c" />
            <circle cx="38" cy="38" r="12" strokeWidth="0.8" stroke="#0000ff" strokeDasharray="2,2" />
            <circle cx="38" cy="38" r="7" strokeWidth="1" stroke="#0000ff" />
            <circle cx="38" cy="38" r="3" fill="#0000ff" />

            {/* Corner Floral Leaf Tendrils */}
            <path
              d="M 38,54 C 50,54 62,66 62,78 C 62,60 74,48 92,48"
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />
            <path
              d="M 54,38 C 54,50 66,62 78,62 C 60,62 48,74 48,92"
              strokeWidth="1.2"
              strokeOpacity="0.45"
            />
          </g>
        ))}

        {/* Center Decorative Guilloche Rosette behind Logo */}
        <g transform="translate(500, 353)" stroke="#0000ff" fill="none">
          <circle cx="0" cy="0" r="230" strokeWidth="0.8" strokeOpacity="0.12" strokeDasharray="6,4" />
          <circle cx="0" cy="0" r="195" strokeWidth="1.2" strokeOpacity="0.18" />
          <circle cx="0" cy="0" r="160" strokeWidth="0.6" strokeOpacity="0.1" strokeDasharray="3,3" />

          {/* 16-lobe rosette petal waves */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <path
              key={angle}
              d="M 0,-195 C 35,-165 45,-125 0,-110 C -45,-125 -35,-165 0,-195 Z"
              transform={`rotate(${angle})`}
              strokeWidth="0.9"
              strokeOpacity="0.12"
            />
          ))}
        </g>
      </svg>
    </div>
  )
}

/**
 * High-Resolution Vector QR Code Generator in System Blue
 */
function CertificateQRCode({ value, size = 56 }) {
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
      className="bg-white p-1 rounded-md border border-blue-200/90 shadow-xs shrink-0"
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
 * Embossed Official Academy Seal of Excellence in System Blue (#0000ff)
 */
function OfficialAcademySeal() {
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
      {/* 36-Point Fluted Seal Badge */}
      <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md">
        {/* Fluted Edge */}
        <path d={pathD} fill="#0000ff" stroke="#0b192c" strokeWidth="1" />

        {/* Concentric Rings */}
        <circle cx="50" cy="50" r="30" fill="#0b192c" stroke="#ffffff" strokeWidth="1" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="#0000ff" strokeWidth="1.2" strokeDasharray="3,1.5" />
        <circle cx="50" cy="50" r="22" fill="#0000ff" />

        {/* Center Star & Crest */}
        <path
          d="M 50,33 L 53,42 L 62,42 L 55,47 L 58,56 L 50,51 L 42,56 L 45,47 L 38,42 L 47,42 Z"
          fill="#ffffff"
        />

        {/* Text around seal */}
        <text
          x="50"
          y="63"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="5"
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
          fontSize="4"
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
 * Authentic Cursive Executive Signatures
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
 * Professional Landscape Certificate with Rich Guilloche Border & Platform Watermark
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

  // Dynamically load classic security certificate fonts
  useEffect(() => {
    const id = 'cert-google-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,500;1,700&family=Work+Sans:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
  }, [])

  const displayTitle =
    certificateTitle ||
    (track === 'FaaS'
      ? 'Fintech-as-a-Service & Open Banking'
      : track === 'FinCore'
      ? 'Core Banking & Ledger Architecture'
      : track === 'FinOps'
      ? 'Fintech Operations & Reconciliation'
      : track === 'FinInfra'
      ? 'Fintech Infrastructure & Payment Rails'
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
            <span className="text-xs font-mono font-medium text-gray-500 hidden sm:inline">
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
        className="relative w-full max-w-5xl mx-auto aspect-[1.414/1] bg-white rounded-xl shadow-2xl overflow-hidden p-7 sm:p-11 flex flex-col justify-between print:p-8 print:shadow-none print:w-full print:max-w-none print:rounded-none"
        style={{
          boxSizing: 'border-box',
          fontFamily: "'Work Sans', system-ui, sans-serif",
        }}
      >
        {/* Layered Security Guilloche Background Waves */}
        <CertificateSecurityBackground />

        {/* Platform Watermark (Centered with Optimal Contrast) */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center select-none opacity-[0.09]"
          aria-hidden="true"
        >
          <img
            src="/logo-dark.png"
            alt=""
            className="w-[480px] max-w-[70%] object-contain"
          />
        </div>

        {/* 1. Header: Academy Identity & Title */}
        <div className="relative z-10 text-center space-y-2.5">
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
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider font-['Cinzel',serif]">
                    {partnerName}
                  </span>
                )}
              </>
            )}
          </div>

          <div>
            <h1
              className="text-xs sm:text-sm font-bold uppercase tracking-[0.28em] text-[#0b192c]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              BlueSPACE Fintech Academy
            </h1>
            <p
              className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.24em] text-[#0000ff] mt-0.5"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Certificate of Completion
            </p>
          </div>
        </div>

        {/* 2. Recipient Section (Breathtaking Typography with Elegant Flourish) */}
        <div className="relative z-10 text-center space-y-2 my-auto py-2 sm:py-3">
          <p
            className="text-xs sm:text-sm text-gray-500 font-medium italic tracking-wider"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            This is proudly conferred upon
          </p>

          {/* Fellow Full Name */}
          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#0b192c] tracking-tight leading-tight capitalize"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {fellowName}
          </h2>

          {/* Ornamental Divider with Diamond Center */}
          <div className="flex items-center justify-center gap-2 max-w-xs sm:max-w-md mx-auto my-1">
            <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#0000ff] to-transparent" />
            <div className="w-2.5 h-2.5 rotate-45 border-2 border-[#0000ff] bg-white shadow-xs" />
            <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#0000ff] to-transparent" />
          </div>

          {/* Student ID & Cohort Info */}
          <p className="text-[11px] sm:text-xs font-medium text-gray-500">
            Fellow ID: <span className="font-mono font-bold text-gray-900">{studentId}</span>
            <span className="mx-2 text-gray-300">•</span>
            {cohortName}
          </p>

          <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto pt-1 leading-relaxed">
            for successfully fulfilling all academic requirements, hands-on architectural labs, and defense of the live fintech capstone in
          </p>

          {/* Specialization Track Ribbon */}
          <div className="pt-1.5">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-50 via-white to-blue-50 border-2 border-[#0000ff] shadow-xs">
              <Award size={16} className="text-[#0000ff] shrink-0" />
              <h3
                className="text-sm sm:text-lg md:text-xl font-extrabold text-[#0000ff] uppercase tracking-[0.12em]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {displayTitle}
              </h3>
            </div>
            {finalGrade && (
              <p className="text-[11px] font-semibold text-gray-600 mt-1">
                Academic Distinction Score: <span className="text-[#0000ff] font-bold">{finalGrade}%</span>
              </p>
            )}
          </div>
        </div>

        {/* 3. Signatures, Embossed Seal & Registry Footer */}
        <div className="relative z-10 space-y-3">
          <div className="grid grid-cols-3 items-end max-w-3xl mx-auto gap-4 pt-1">
            {/* Left: Academic Director Signature */}
            <div className="text-center space-y-1">
              <ExecutiveSignature variant={1} />
              <div className="w-36 h-[1.5px] bg-[#0000ff]/50 mx-auto" />
              <p className="text-xs font-bold text-[#0b192c] leading-tight">Emmanuel Johnson</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Academic Director</p>
            </div>

            {/* Center: Official Embossed Seal */}
            <div className="flex justify-center -mb-1">
              <OfficialAcademySeal />
            </div>

            {/* Right: Technical Review Board Signature */}
            <div className="text-center space-y-1">
              <ExecutiveSignature variant={2} />
              <div className="w-36 h-[1.5px] bg-[#0000ff]/50 mx-auto" />
              <p className="text-xs font-bold text-[#0b192c] leading-tight">Dr. Kwabena Mensah</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Technical Review Board</p>
            </div>
          </div>

          {/* Bottom Security Strip */}
          <div className="pt-3 border-t border-gray-200/90 flex items-center justify-between text-xs">
            {/* Left: QR Code & Serial Number */}
            <div className="flex items-center gap-3">
              <CertificateQRCode value={verificationUrl} size={48} />
              <div className="text-left">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                  Serial Number
                </span>
                <span className="font-mono font-bold text-[#0000ff] text-xs sm:text-sm">
                  {certificateNumber}
                </span>
              </div>
            </div>

            {/* Right: Date Issued & Verification Badge */}
            <div className="text-right space-y-1">
              <p className="text-[10px] text-gray-500">
                Date Issued: <strong className="text-gray-900">{formattedDate}</strong>
              </p>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-brand-700 bg-blue-50/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                <CheckCircle2 size={12} className="text-[#0000ff]" />
                Registered on BlueSPACE Ledger
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
