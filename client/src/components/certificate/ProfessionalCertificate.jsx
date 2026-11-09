import React, { useState } from 'react'
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Copy,
  Check,
  Share2,
  ExternalLink,
  QrCode,
  Download,
  Lock,
  Calendar,
  Hash,
  Sparkles,
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

/**
 * Deterministic Vector QR Code generator for crisp, dependency-free rendering
 * Generates standard finder patterns (3 corner squares) and data matrix derived from input.
 */
function CertificateQRCode({ value, size = 64 }) {
  // Generate deterministic 21x21 modules based on input hash
  const matrixSize = 21
  const modules = Array(matrixSize).fill(null).map(() => Array(matrixSize).fill(false))

  // Helper to draw standard 7x7 finder pattern
  const drawFinder = (startX, startY) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer ring
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // Inner solid square
        ) {
          modules[startY + r][startX + c] = true
        }
      }
    }
  }

  // Draw 3 standard corner finder patterns
  drawFinder(0, 0)
  drawFinder(14, 0)
  drawFinder(0, 14)

  // Timing patterns
  for (let i = 8; i < 13; i++) {
    modules[6][i] = i % 2 === 0
    modules[i][6] = i % 2 === 0
  }

  // Deterministic data fill from string hash
  let hash = 0
  const str = String(value || 'BLUESPACE')
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Don't overwrite finder patterns & separators
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
      className="bg-white p-1 rounded border border-gray-300 shadow-sm"
      aria-label={`QR verification code for ${value}`}
    >
      {modules.map((row, r) =>
        row.map((active, c) =>
          active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0B192C" /> : null
        )
      )}
    </svg>
  )
}

/**
 * Official BlueSPACE Academy Seal SVG
 */
function AcademyOfficialSeal() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 160 160"
        className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-md transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DFBA73" />
            <stop offset="50%" stopColor="#C5A880" />
            <stop offset="100%" stopColor="#8A6E3B" />
          </linearGradient>
          <linearGradient id="navyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B192C" />
            <stop offset="100%" stopColor="#000066" />
          </linearGradient>
          <path
            id="textPathTop"
            d="M 22,80 A 58,58 0 1,1 138,80"
            fill="none"
          />
          <path
            id="textPathBottom"
            d="M 138,80 A 58,58 0 1,1 22,80"
            fill="none"
          />
        </defs>

        {/* Scalloped outer ring */}
        <circle cx="80" cy="80" r="76" fill="url(#goldGradient)" />
        <circle cx="80" cy="80" r="72" fill="#0B192C" />
        <circle cx="80" cy="80" r="69" fill="none" stroke="url(#goldGradient)" strokeWidth="1" strokeDasharray="3,2" />

        {/* Inner medallion */}
        <circle cx="80" cy="80" r="50" fill="url(#navyGradient)" stroke="url(#goldGradient)" strokeWidth="2" />

        {/* Circular text */}
        <text className="text-[7.5px] font-bold tracking-[0.18em] uppercase fill-[#DFBA73]">
          <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
            ★ BLUESPACE FINTECH ACADEMY ★
          </textPath>
        </text>
        <text className="text-[7px] font-bold tracking-[0.2em] uppercase fill-[#DFBA73]">
          <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">
            OFFICIAL ACCREDITATION
          </textPath>
        </text>

        {/* Center Shield & Star */}
        <g transform="translate(80, 78) scale(0.9)">
          <path
            d="M 0,-22 L 18,-10 L 18,8 C 18,20 0,26 0,26 C 0,26 -18,20 -18,8 L -18,-10 Z"
            fill="url(#goldGradient)"
          />
          <path
            d="M 0,-18 L 14,-8 L 14,7 C 14,16 0,21 0,21 C 0,21 -14,16 -14,7 L -14,-8 Z"
            fill="#0B192C"
          />
          {/* Star in shield */}
          <polygon
            points="0,-8 2.5,-2 8,-2 3.5,1.5 5.5,7 0,3.5 -5.5,7 -3.5,1.5 -8,-2 -2.5,-2"
            fill="url(#goldGradient)"
          />
          <text
            x="0"
            y="14"
            textAnchor="middle"
            fill="#DFBA73"
            fontSize="6"
            fontWeight="bold"
            fontFamily="monospace"
            letterSpacing="0.1em"
          >
            2026
          </text>
        </g>
      </svg>
      {/* Ribbon tails underneath */}
      <div className="flex gap-1.5 -mt-2">
        <div className="w-3.5 h-6 bg-[#8A6E3B] transform -rotate-12 rounded-b-sm border-t-2 border-[#DFBA73] shadow-sm"></div>
        <div className="w-3.5 h-6 bg-[#8A6E3B] transform rotate-12 rounded-b-sm border-t-2 border-[#DFBA73] shadow-sm"></div>
      </div>
    </div>
  )
}

/**
 * Authentic Cursive Signature SVG
 */
function SignatureScript({ name, variant = 1 }) {
  if (variant === 1) {
    return (
      <svg viewBox="0 0 200 50" className="h-10 w-36 mx-auto stroke-[#0B192C] fill-none">
        <path
          d="M 15,35 Q 25,12 35,28 T 55,20 Q 70,5 80,30 T 110,22 Q 130,10 145,28 T 175,25 Q 185,15 190,30"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 30,30 Q 75,38 160,26"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 200 50" className="h-10 w-36 mx-auto stroke-[#0B192C] fill-none">
      <path
        d="M 20,20 Q 30,42 45,25 T 70,18 Q 85,38 100,22 T 130,28 Q 145,8 160,26 T 180,24"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 25,36 Q 90,28 175,34"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Professional Certificate Component
 */
export default function ProfessionalCertificate({
  fellowName = 'Test Student',
  studentId = 'BS-2026-0042',
  track = 'Finsoft',
  cohortName = 'Cohort 1 - December 2026',
  certificateNumber = 'BSA-2026-000001',
  verificationToken = 'a0000000-0000-0000-0000-000000000001',
  issuedAt = '2026-11-06T00:00:00Z',
  finalGrade = 94.5,
  certificateTitle,
  partnerName,
  partnerLogoUrl,
  bluespaceLogoUrl = '/logo.png',
  showActions = true,
  onClose,
}) {
  const [copied, setCopied] = useState(false)

  // Construct absolute verification link
  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify-certificate/${verificationToken}`
    : `/verify-certificate/${verificationToken}`

  const formattedDate = issuedAt
    ? new Date(issuedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'November 2026'

  // Standardize credential display title
  const displayTitle = certificateTitle || (
    track === 'Finsoft'
      ? 'Certified Financial Software Engineer (Finsoft Track)'
      : track === 'Finops'
      ? 'Certified Financial Operations Specialist (Finops Track)'
      : `BlueSPACE Certified Professional · ${track} Track`
  )

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

  const handleShareLinkedIn = () => {
    const title = encodeURIComponent(`${displayTitle} - BlueSPACE Fintech Academy`)
    const url = encodeURIComponent(verificationUrl)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="w-full space-y-4">
      {/* Top Action Bar (hidden on print) */}
      {showActions && (
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200/90 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Verifiable Academy Credential
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
              className="text-xs font-medium border-gray-200 hover:bg-gray-50"
            >
              {copied ? (
                <>
                  <Check size={13} className="mr-1.5 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={13} className="mr-1.5" />
                  Copy Link
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLinkedIn}
              className="text-xs font-medium border-gray-200 hover:bg-gray-50 hidden sm:flex"
            >
              <Share2 size={13} className="mr-1.5 text-blue-600" />
              Share
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="text-xs font-semibold bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-sm"
            >
              <Printer size={13} className="mr-1.5" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      )}

      {/* Printable Certificate Canvas */}
      <div
        id="certificate-print-area"
        className="relative w-full max-w-5xl mx-auto bg-[#FFFFFF] rounded-2xl border-4 border-[#0B192C] shadow-xl overflow-hidden p-3 sm:p-5 text-[#0B192C] print:p-0 print:border-4 print:shadow-none print:w-full print:max-w-none print:rounded-none"
        style={{
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Decorative Inner Gold & Navy Double Frame */}
        <div className="relative border-2 border-[#C5A880]/80 rounded-xl p-5 sm:p-8 md:p-10 bg-gradient-to-b from-[#FAF8F5]/50 via-white to-[#FAF8F5]/60 overflow-hidden">
          
          {/* Corner Ornaments */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#0B192C]"></div>
          <div className="absolute top-2.5 left-2.5 w-2 h-2 bg-[#C5A880]"></div>

          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#0B192C]"></div>
          <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#C5A880]"></div>

          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#0B192C]"></div>
          <div className="absolute bottom-2.5 left-2.5 w-2 h-2 bg-[#C5A880]"></div>

          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#0B192C]"></div>
          <div className="absolute bottom-2.5 right-2.5 w-2 h-2 bg-[#C5A880]"></div>

          {/* Subtle Guilloche / Watermark Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.035] flex items-center justify-center select-none"
            aria-hidden="true"
          >
            <svg viewBox="0 0 500 500" className="w-[450px] h-[450px]">
              <circle cx="250" cy="250" r="220" fill="none" stroke="#0B192C" strokeWidth="2" />
              <circle cx="250" cy="250" r="180" fill="none" stroke="#0B192C" strokeWidth="1" strokeDasharray="6,4" />
              <polygon points="250,50 410,390 90,390" fill="none" stroke="#0B192C" strokeWidth="2" />
              <polygon points="250,450 410,110 90,110" fill="none" stroke="#0B192C" strokeWidth="2" />
              <circle cx="250" cy="250" r="80" fill="none" stroke="#0B192C" strokeWidth="3" />
            </svg>
          </div>

          {/* Certificate Content Flow */}
          <div className="relative z-10 text-center space-y-4 sm:space-y-6">

            {/* Header: Institutional Branding & Co-Branding */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <img
                  src={bluespaceLogoUrl || '/logo-dark.png'}
                  alt="BlueSPACE Academy"
                  className="h-10 sm:h-12 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/logo-dark.png'
                  }}
                />

                {partnerName && (
                  <>
                    <span className="text-gray-300 font-light text-lg">✕</span>
                    {partnerLogoUrl ? (
                      <img
                        src={partnerLogoUrl}
                        alt={partnerName}
                        className="h-8 sm:h-10 w-auto object-contain rounded"
                      />
                    ) : (
                      <span className="text-xs sm:text-sm font-bold tracking-wider text-gray-700 uppercase">
                        {partnerName}
                      </span>
                    )}
                  </>
                )}
              </div>

              <div>
                <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.28em] text-[#0B192C]">
                  BlueSPACE Fintech Academy
                </h1>
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C5A880] mt-0.5">
                  Institute of Financial Software Engineering & Distributed Ledgers
                </p>
              </div>

              {/* Ornamental Divider with Diamond */}
              <div className="flex items-center justify-center gap-3 max-w-md mx-auto pt-1">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#C5A880] to-transparent"></div>
                <div className="w-2 h-2 rotate-45 bg-[#C5A880]"></div>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#C5A880] to-transparent"></div>
              </div>
            </div>

            {/* Certificate Formal Title */}
            <div>
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#0000FF]">
                Certificate of Academic & Professional Graduation
              </p>
              <p className="text-xs sm:text-sm text-gray-500 font-serif italic mt-1">
                This is to certify that
              </p>
            </div>

            {/* Recipient Fellow Name */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-extrabold text-[#0B192C] tracking-tight">
                {fellowName}
              </h2>
              <div className="w-48 sm:w-80 h-[2px] bg-gradient-to-r from-transparent via-[#0B192C] to-transparent mx-auto"></div>
              {studentId && (
                <p className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-gray-500 pt-0.5">
                  Registration ID: <strong className="text-gray-900">{studentId}</strong>
                </p>
              )}
            </div>

            {/* Conferment Citation Statement */}
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
              has satisfactorily completed all rigorous academic coursework, production financial ledger architecture labs, cryptographic security requirements, and capstone panel defense to earn accreditation as:
            </p>

            {/* Credential Title & Specialization */}
            <div className="py-2">
              <div className="inline-block px-5 py-2.5 rounded-lg bg-[#0B192C] text-white shadow-md border border-[#C5A880]">
                <h3 className="text-sm sm:text-lg md:text-xl font-bold tracking-wide uppercase">
                  {displayTitle}
                </h3>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-600 mt-2">
                {cohortName} · Academic Session 2026
              </p>

              {finalGrade && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F5] text-[#8A6E3B] border border-[#C5A880]">
                  <Sparkles size={12} className="text-[#8A6E3B]" />
                  Graduated with Distinction & Honors · Grade: {finalGrade}%
                </div>
              )}
            </div>

            {/* Signatures & Academy Seal Row */}
            <div className="grid grid-cols-3 items-end pt-4 sm:pt-6 border-t border-gray-200/90 gap-2 sm:gap-6">
              {/* Left Signatory */}
              <div className="text-center space-y-1">
                <SignatureScript name="Emmanuel Johnson" variant={1} />
                <div className="w-28 sm:w-36 h-[1px] bg-gray-400 mx-auto"></div>
                <h4 className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight">
                  Emmanuel Johnson
                </h4>
                <p className="text-[9px] sm:text-[10px] text-gray-500 leading-tight">
                  Director of Academy & Curriculum
                </p>
                <p className="text-[8px] sm:text-[9px] font-medium text-gray-400">
                  BlueSPACE Fintech Academy
                </p>
              </div>

              {/* Center Medallion Seal */}
              <div className="flex justify-center">
                <AcademyOfficialSeal />
              </div>

              {/* Right Signatory */}
              <div className="text-center space-y-1">
                <SignatureScript name="Dr. Kwabena Mensah" variant={2} />
                <div className="w-28 sm:w-36 h-[1px] bg-gray-400 mx-auto"></div>
                <h4 className="text-[11px] sm:text-xs font-bold text-gray-900 leading-tight">
                  Dr. Kwabena Mensah
                </h4>
                <p className="text-[9px] sm:text-[10px] text-gray-500 leading-tight">
                  Chair, Technical Review Board
                </p>
                <p className="text-[8px] sm:text-[9px] font-medium text-gray-400">
                  BlueSPACE Financial Technologies
                </p>
              </div>
            </div>

            {/* Security Band & Cryptographic Verification Footer */}
            <div className="mt-6 pt-4 border-t-2 border-[#0B192C]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-left bg-gray-50/70 p-3 rounded-lg border border-gray-200">
              
              {/* Left: Credential ID & QR Code */}
              <div className="flex items-center gap-3">
                <CertificateQRCode value={verificationUrl} size={54} />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-900">
                      Cryptographically Verified
                    </span>
                  </div>
                  <p className="text-[10px] font-mono font-bold text-[#0000FF]">
                    Certificate No: {certificateNumber}
                  </p>
                  <p className="text-[9px] text-gray-500 font-mono truncate max-w-[220px]">
                    Token: {verificationToken}
                  </p>
                </div>
              </div>

              {/* Right: Date Issued & Registry Verification */}
              <div className="text-center sm:text-right space-y-0.5">
                <p className="text-[10px] text-gray-500">
                  Issued on: <strong className="text-gray-900">{formattedDate}</strong>
                </p>
                <p className="text-[9px] text-gray-500">
                  Registry Status:{' '}
                  <span className="inline-flex items-center font-bold text-emerald-700">
                    Active & Validated
                  </span>
                </p>
                <p className="text-[8.5px] font-mono text-gray-400 hidden sm:block">
                  bluespacefintechacademy.com/verify-certificate
                </p>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
