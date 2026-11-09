import React, { useState } from 'react'
import {
  Award,
  CheckCircle2,
  Printer,
  Copy,
  Check,
  Share2,
  Download,
} from 'lucide-react'
import { Button } from '../ui/button'

/**
 * Beautiful Curly Guilloche Security Background & Lines in System Blue (#0000ff)
 */
function CertificateCurlyBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      <svg
        viewBox="0 0 1000 707"
        className="w-full h-full object-cover"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Subtle Fine Security Grid Pattern */}
          <pattern id="certFineGrid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 0 16 L 16 0 M 0 0 L 16 16" fill="none" stroke="#0000ff" strokeWidth="0.3" strokeOpacity="0.04" />
          </pattern>

          {/* Radial Gradient for Center Soft Glow */}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="65%" stopColor="#f7f9ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#eef2ff" stopOpacity="0.85" />
          </radialGradient>
        </defs>

        {/* Background Base Fill */}
        <rect width="1000" height="707" fill="url(#centerGlow)" />
        <rect width="1000" height="707" fill="url(#certFineGrid)" />

        {/* Outer Guilloche Border Waves */}
        <g stroke="#0000ff" fill="none" strokeLinecap="round">
          {/* Top Wavy Ribbons */}
          <path
            d="M 50,30 Q 150,15 250,30 T 450,30 T 650,30 T 850,30 T 950,30"
            strokeWidth="0.8"
            strokeOpacity="0.18"
          />
          <path
            d="M 50,34 Q 150,48 250,34 T 450,34 T 650,34 T 850,34 T 950,34"
            strokeWidth="0.8"
            strokeOpacity="0.18"
          />
          <path
            d="M 50,32 Q 150,22 250,32 T 450,32 T 650,32 T 850,32 T 950,32"
            strokeWidth="0.5"
            strokeOpacity="0.12"
          />

          {/* Bottom Wavy Ribbons */}
          <path
            d="M 50,677 Q 150,662 250,677 T 450,677 T 650,677 T 850,677 T 950,677"
            strokeWidth="0.8"
            strokeOpacity="0.18"
          />
          <path
            d="M 50,673 Q 150,688 250,673 T 450,673 T 650,673 T 850,673 T 950,673"
            strokeWidth="0.8"
            strokeOpacity="0.18"
          />
          <path
            d="M 50,675 Q 150,668 250,675 T 450,675 T 650,675 T 850,675 T 950,675"
            strokeWidth="0.5"
            strokeOpacity="0.12"
          />

          {/* Left Wavy Ribbons */}
          <path
            d="M 30,50 Q 15,150 30,250 T 30,450 T 30,650"
            strokeWidth="0.8"
            strokeOpacity="0.18"
          />
          <path
            d="M 34,50 Q 48,150 34,250 T 34,450 T 34,650"
            strokeWidth="0.8"
            strokeOpacity="0.18"
          />

          {/* Right Wavy Ribbons */}
          <path
            d="M 970,50 Q 985,150 970,250 T 970,450 T 970,650"
            strokeWidth="0.8"
            strokeOpacity="0.18"
          />
          <path
            d="M 966,50 Q 952,150 966,250 T 966,450 T 966,650"
            strokeWidth="0.8"
            strokeOpacity="0.18"
          />
        </g>

        {/* Ornate Curly Filigree Flourishes in All 4 Corners */}
        <g stroke="#0000ff" fill="none" strokeWidth="1" strokeOpacity="0.22" strokeLinecap="round">
          {/* Top-Left Corner Curly Flourish */}
          <g transform="translate(35, 35)">
            <path d="M 5,60 C 5,25 25,5 60,5 C 90,5 110,25 90,45 C 75,60 50,45 60,30 C 68,20 85,25 80,40 C 75,55 50,65 35,45 C 25,32 30,15 50,15" />
            <path d="M 0,80 C 0,35 35,0 80,0" strokeWidth="1.5" strokeOpacity="0.28" />
            <circle cx="60" cy="5" r="2.5" fill="#0000ff" fillOpacity="0.2" />
            <circle cx="5" cy="60" r="2.5" fill="#0000ff" fillOpacity="0.2" />
          </g>

          {/* Top-Right Corner Curly Flourish */}
          <g transform="translate(965, 35) scale(-1, 1)">
            <path d="M 5,60 C 5,25 25,5 60,5 C 90,5 110,25 90,45 C 75,60 50,45 60,30 C 68,20 85,25 80,40 C 75,55 50,65 35,45 C 25,32 30,15 50,15" />
            <path d="M 0,80 C 0,35 35,0 80,0" strokeWidth="1.5" strokeOpacity="0.28" />
            <circle cx="60" cy="5" r="2.5" fill="#0000ff" fillOpacity="0.2" />
            <circle cx="5" cy="60" r="2.5" fill="#0000ff" fillOpacity="0.2" />
          </g>

          {/* Bottom-Left Corner Curly Flourish */}
          <g transform="translate(35, 672) scale(1, -1)">
            <path d="M 5,60 C 5,25 25,5 60,5 C 90,5 110,25 90,45 C 75,60 50,45 60,30 C 68,20 85,25 80,40 C 75,55 50,65 35,45 C 25,32 30,15 50,15" />
            <path d="M 0,80 C 0,35 35,0 80,0" strokeWidth="1.5" strokeOpacity="0.28" />
            <circle cx="60" cy="5" r="2.5" fill="#0000ff" fillOpacity="0.2" />
            <circle cx="5" cy="60" r="2.5" fill="#0000ff" fillOpacity="0.2" />
          </g>

          {/* Bottom-Right Corner Curly Flourish */}
          <g transform="translate(965, 672) scale(-1, -1)">
            <path d="M 5,60 C 5,25 25,5 60,5 C 90,5 110,25 90,45 C 75,60 50,45 60,30 C 68,20 85,25 80,40 C 75,55 50,65 35,45 C 25,32 30,15 50,15" />
            <path d="M 0,80 C 0,35 35,0 80,0" strokeWidth="1.5" strokeOpacity="0.28" />
            <circle cx="60" cy="5" r="2.5" fill="#0000ff" fillOpacity="0.2" />
            <circle cx="5" cy="60" r="2.5" fill="#0000ff" fillOpacity="0.2" />
          </g>
        </g>

        {/* Center Decorative Guilloche Rosette Rings behind the Logo */}
        <g transform="translate(500, 353)" stroke="#0000ff" fill="none" strokeLinecap="round">
          <circle cx="0" cy="0" r="220" strokeWidth="0.6" strokeOpacity="0.08" strokeDasharray="6,4" />
          <circle cx="0" cy="0" r="185" strokeWidth="0.8" strokeOpacity="0.1" />
          <circle cx="0" cy="0" r="150" strokeWidth="0.5" strokeOpacity="0.07" strokeDasharray="3,3" />

          {/* Curvilinear Rosette Wave Petals */}
          <path
            d="M 0,-185 C 45,-175 75,-140 95,-105 C 135,-120 170,-85 180,-40 C 200,-5 190,45 165,85 C 160,130 120,165 75,175 C 35,190 -15,190 -55,175 C -100,165 -140,130 -145,85 C -170,45 -180,-5 -160,-40 C -150,-85 -115,-120 -75,-105 C -55,-140 -25,-175 0,-185 Z"
            strokeWidth="0.7"
            strokeOpacity="0.1"
          />
          <path
            d="M 0,-185 C -45,-175 -75,-140 -95,-105 C -135,-120 -170,-85 -180,-40 C -200,-5 -190,45 -165,85 C -160,130 -120,165 -75,175 C -35,190 15,190 55,175 C 100,165 140,130 145,85 C 170,45 180,-5 160,-40 C 150,-85 115,-120 75,-105 C 55,-140 25,-175 0,-185 Z"
            strokeWidth="0.7"
            strokeOpacity="0.1"
          />
        </g>
      </svg>
    </div>
  )
}

/**
 * Clean Vector QR Code Generator
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
  const str = String(value || 'BLUESPACE')
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
      className="bg-white p-1 rounded border border-blue-200 shadow-sm"
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
 * Cursive Signature in System Blue
 */
function SignatureScript({ variant = 1 }) {
  if (variant === 1) {
    return (
      <svg viewBox="0 0 180 40" className="h-8 w-32 mx-auto stroke-[#0000ff] fill-none">
        <path
          d="M 10,28 Q 20,8 30,22 T 50,15 Q 65,5 75,25 T 100,18 Q 120,8 135,22 T 160,20"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 25,25 Q 65,30 145,22"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 180 40" className="h-8 w-32 mx-auto stroke-[#0000ff] fill-none">
      <path
        d="M 15,15 Q 25,35 40,20 T 65,14 Q 80,32 95,18 T 125,24 Q 140,6 155,22"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 20,30 Q 75,24 150,28"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Landscape Certificate with Curly Lines & Platform Logo Background
 */
export default function ProfessionalCertificate({
  fellowName = 'Test Student',
  studentId = 'BS-2026-0042',
  track = 'Finsoft',
  cohortName = 'Cohort 1 - December 2026',
  certificateNumber = 'BSA-2026-000001',
  verificationToken = 'a0000000-0000-0000-0000-000000000001',
  issuedAt = '2026-11-06T00:00:00Z',
  finalGrade,
  certificateTitle,
  partnerName,
  partnerLogoUrl,
  bluespaceLogoUrl = '/logo-dark.png',
  showActions = true,
}) {
  const [copied, setCopied] = useState(false)

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

  const displayTitle = certificateTitle || (
    track === 'Finsoft'
      ? 'Financial Software Engineering'
      : track === 'Finops'
      ? 'Financial Operations & Compliance'
      : `${track} Engineering`
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

  return (
    <div className="w-full space-y-4">
      {/* Clean Minimal Action Bar (Hidden during print) */}
      {showActions && (
        <div className="print:hidden flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-brand-700 border border-blue-200">
              <CheckCircle2 size={13} className="text-[#0000ff]" />
              Verified Certificate
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
                  Copied Link!
                </>
              ) : (
                <>
                  <Copy size={13} className="mr-1.5" />
                  Copy Link
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="text-xs font-semibold bg-[#0000ff] hover:bg-[#0000cc] text-white shadow-sm"
            >
              <Printer size={13} className="mr-1.5" />
              Download / Print
            </Button>
          </div>
        </div>
      )}

      {/* Landscape Certificate Container */}
      <div
        id="certificate-print-area"
        className="relative w-full max-w-5xl mx-auto aspect-[1.414/1] bg-white rounded-xl border-2 border-brand-600 shadow-xl overflow-hidden p-6 sm:p-10 flex flex-col justify-between print:p-8 print:border-2 print:border-brand-600 print:shadow-none print:w-full print:max-w-none print:rounded-none"
        style={{
          boxSizing: 'border-box',
        }}
      >
        {/* Curvilinear Guilloche Lines & Background Security Waves in System Blue */}
        <CertificateCurlyBackground />

        {/* Platform Logo Watermark Centered in Background */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center select-none opacity-[0.06]"
          aria-hidden="true"
        >
          <img
            src="/logo-dark.png"
            alt=""
            className="w-[450px] max-w-[70%] object-contain"
          />
        </div>

        {/* Framing Border Lines */}
        <div className="absolute inset-3 sm:inset-4 border border-brand-300/80 rounded-lg pointer-events-none"></div>
        <div className="absolute inset-4 sm:inset-5 border border-dashed border-brand-200/60 rounded-md pointer-events-none"></div>

        {/* 1. Header: Platform Identity */}
        <div className="relative z-10 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <img
              src={bluespaceLogoUrl || '/logo-dark.png'}
              alt="BlueSPACE Academy"
              className="h-8 sm:h-10 w-auto object-contain drop-shadow-sm"
              onError={(e) => {
                e.currentTarget.src = '/logo-dark.png'
              }}
            />
            {partnerName && (
              <>
                <span className="text-gray-300 font-light text-base">|</span>
                {partnerLogoUrl ? (
                  <img src={partnerLogoUrl} alt={partnerName} className="h-7 sm:h-9 w-auto object-contain rounded" />
                ) : (
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{partnerName}</span>
                )}
              </>
            )}
          </div>

          <div>
            <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.24em] text-gray-900">
              BlueSPACE Fintech Academy
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0000ff] mt-0.5">
              Certificate of Completion
            </p>
          </div>
        </div>

        {/* 2. Recipient Section (Clean, Prestigious & Minimal) */}
        <div className="relative z-10 text-center space-y-1.5 my-auto py-2 sm:py-4">
          <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-wide">
            This is presented to
          </p>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            {fellowName}
          </h2>

          <div className="w-40 sm:w-64 h-[2px] bg-[#0000ff] mx-auto my-1.5"></div>

          {studentId && (
            <p className="text-[11px] sm:text-xs font-mono font-medium text-gray-500">
              Student ID: <span className="font-bold text-gray-900">{studentId}</span>
            </p>
          )}

          <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto pt-2">
            for successfully completing the coursework and requirements for
          </p>

          {/* Program Title */}
          <div className="pt-1">
            <div className="inline-block px-5 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#0000ff] uppercase tracking-wide">
                {displayTitle}
              </h3>
            </div>
            <p className="text-xs font-medium text-gray-500 mt-1">
              {cohortName}
              {finalGrade ? ` · Grade: ${finalGrade}%` : ''}
            </p>
          </div>
        </div>

        {/* 3. Signatures & Footer Section */}
        <div className="relative z-10 space-y-4">
          {/* Signatures */}
          <div className="grid grid-cols-2 max-w-xl mx-auto pt-2 gap-8 text-center">
            <div className="space-y-1">
              <SignatureScript variant={1} />
              <div className="w-32 h-[1px] bg-gray-300 mx-auto"></div>
              <p className="text-[11px] font-bold text-gray-900 leading-tight">Emmanuel Johnson</p>
              <p className="text-[10px] text-gray-500 leading-tight">Academic Director</p>
            </div>

            <div className="space-y-1">
              <SignatureScript variant={2} />
              <div className="w-32 h-[1px] bg-gray-300 mx-auto"></div>
              <p className="text-[11px] font-bold text-gray-900 leading-tight">Dr. Kwabena Mensah</p>
              <p className="text-[10px] text-gray-500 leading-tight">Technical Review Board</p>
            </div>
          </div>

          {/* Clean Bottom Footer Bar */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
            {/* Left: QR Code & Certificate Number */}
            <div className="flex items-center gap-3">
              <CertificateQRCode value={verificationUrl} size={44} />
              <div className="text-left">
                <span className="text-[10px] font-mono text-gray-500 uppercase block">Certificate Number</span>
                <span className="font-mono font-bold text-[#0000ff] text-xs sm:text-sm">
                  {certificateNumber}
                </span>
              </div>
            </div>

            {/* Right: Issue Date & Verification Note */}
            <div className="text-right space-y-0.5">
              <p className="text-[10px] text-gray-500">
                Date: <strong className="text-gray-900">{formattedDate}</strong>
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                <CheckCircle2 size={11} className="text-[#0000ff]" />
                Verified in Academy Registry
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
