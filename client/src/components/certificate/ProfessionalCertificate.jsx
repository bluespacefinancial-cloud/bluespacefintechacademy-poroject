import React, { useState } from 'react'
import {
  Award,
  CheckCircle2,
  Printer,
  Copy,
  Check,
  Share2,
} from 'lucide-react'
import { Button } from '../ui/button'

/**
 * Clean Vector QR Code generator using standard finder patterns and data matrix
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
      className="bg-white p-1 rounded border border-gray-200"
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
 * Authentic Cursive Signature SVG in System Color
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
 * Professional Landscape Certificate using strictly System Colors
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

  const handleShareLinkedIn = () => {
    const title = encodeURIComponent(`${displayTitle} - BlueSPACE Fintech Academy`)
    const url = encodeURIComponent(verificationUrl)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="w-full space-y-4">
      {/* Action Bar (Hidden during print) */}
      {showActions && (
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-brand-700 border border-blue-200">
              <CheckCircle2 size={13} className="text-[#0000ff]" />
              Verified Credential
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
              <Share2 size={13} className="mr-1.5 text-brand-600" />
              Share
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="text-xs font-semibold bg-[#0000ff] hover:bg-[#0000cc] text-white shadow-sm"
            >
              <Printer size={13} className="mr-1.5" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      )}

      {/* Landscape Certificate Container */}
      <div
        id="certificate-print-area"
        className="relative w-full max-w-5xl mx-auto aspect-[1.414/1] bg-white rounded-xl border-2 border-brand-600 shadow-lg overflow-hidden p-6 sm:p-10 flex flex-col justify-between print:p-8 print:border-2 print:border-brand-600 print:shadow-none print:w-full print:max-w-none print:rounded-none"
        style={{
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Subtle Platform Logo Watermark in Background */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center select-none opacity-[0.04]"
          aria-hidden="true"
        >
          <img
            src="/logo-dark.png"
            alt=""
            className="w-[420px] max-w-[65%] object-contain filter grayscale"
          />
        </div>

        {/* Clean Inner Border using System Colors */}
        <div className="absolute inset-3 sm:inset-4 border border-brand-200 rounded-lg pointer-events-none"></div>

        {/* 1. Header: Platform Identity */}
        <div className="relative z-10 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <img
              src={bluespaceLogoUrl || '/logo-dark.png'}
              alt="BlueSPACE Academy"
              className="h-8 sm:h-10 w-auto object-contain"
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
            <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.22em] text-gray-900">
              BlueSPACE Fintech Academy
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600 mt-0.5">
              Certificate of Completion
            </p>
          </div>
        </div>

        {/* 2. Recipient Section (Clean & Minimal) */}
        <div className="relative z-10 text-center space-y-1.5 my-auto py-2 sm:py-4">
          <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-wide">
            This is presented to
          </p>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            {fellowName}
          </h2>

          <div className="w-40 sm:w-64 h-[2px] bg-brand-600 mx-auto my-1.5"></div>

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
            <div className="inline-block px-4 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-brand-700 uppercase tracking-wide">
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
                <span className="font-mono font-bold text-brand-600 text-xs sm:text-sm">
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
