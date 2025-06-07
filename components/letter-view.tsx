"use client"

import type React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface LetterViewProps {
  letter: string
  annotations: Array<{
    quote: string
    appendix: Array<any>
  }>
  outputVersions: any[]
  selectedClaimIndex: number | null
  onSelectClaim: (index: number) => void
}

export function LetterView({
  letter,
  annotations,
  outputVersions,
  selectedClaimIndex,
  onSelectClaim,
}: LetterViewProps) {
  // Find all quoted text in the letter
  const findQuotedText = (text: string) => {
    const quotes: { start: number; end: number; text: string }[] = []
    const quoteRegex = /"([^"]+)"/g
    let match

    while ((match = quoteRegex.exec(text)) !== null) {
      quotes.push({
        start: match.index + 1, // +1 to skip the opening quote
        end: match.index + match[0].length - 1, // -1 to exclude the closing quote
        text: match[1],
      })
    }

    return quotes
  }

  // Check if a quote is part of annotations
  const isQuoteInAnnotations = (quoteText: string) => {
    return annotations.some((annotation) => annotation.quote === quoteText)
  }

  // Check if a quote is supported in any output version
  const isQuoteSupported = (quoteText: string) => {
    if (outputVersions.length === 0) return false

    // Find the annotation index for this quote
    const annotationIndex = annotations.findIndex((annotation) => annotation.quote === quoteText)
    if (annotationIndex === -1) return false

    // Check if this quote is supported in any output version
    return outputVersions.some((output) => {
      const claim = output.claims[annotationIndex]
      return claim && claim.supported
    })
  }

  // Create a highlighted version of the letter
  const renderHighlightedLetter = () => {
    let result = letter
    const modifications: Array<{
      start: number
      end: number
      replacement: string
    }> = []

    // First, handle annotation quotes (supported or unsupported)
    annotations.forEach((annotation, index) => {
      const quote = annotation.quote
      const start = letter.indexOf(quote)

      if (start !== -1) {
        const end = start + quote.length
        const isSelected = selectedClaimIndex === index
        const isSupported = isQuoteSupported(quote)

        // Determine the appropriate class based on support status
        let colorClass = isSupported
          ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700"
          : "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700"

        if (isSelected) {
          colorClass += " ring-2 ring-blue-500"
        }

        const supportIcons = outputVersions
          .map((output, versionIndex) => {
            const claim = output.claims.find((c: any) => c.text === quote)
            if (claim) {
              if (claim.supported) {
                return `<span class="inline-flex ml-1" title="${output.claims.find((c: any) => c.text === quote).text} - Supported">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </span>`
              } else {
                return `<span class="inline-flex ml-1" title="${output.claims.find((c: any) => c.text === quote).text} - Unsupported: ${output.claims.find((c: any) => c.text === quote).reason}">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-red-500"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              </span>`
              }
            }
            return ""
          })
          .join("")

        const highlightedQuote = `<span 
          class="px-1 rounded cursor-pointer border ${colorClass} hover:opacity-80 claim-highlight" 
          data-index="${index}"
        >${quote}${supportIcons}</span>`

        modifications.push({
          start,
          end,
          replacement: highlightedQuote,
        })
      }
    })

    // Then, find quoted text that isn't part of annotations and highlight in red
    const quotedTexts = findQuotedText(letter)
    quotedTexts.forEach((quotedText) => {
      // Skip if this quote is already part of annotations
      if (isQuoteInAnnotations(quotedText.text)) return

      const start = quotedText.start - 1 // Adjust to include the opening quote
      const end = quotedText.end + 1 // Adjust to include the closing quote

      // Check if this quote overlaps with any annotation quote
      const overlapsWithAnnotation = modifications.some(
        (mod) => (start >= mod.start && start < mod.end) || (end > mod.start && end <= mod.end),
      )

      if (!overlapsWithAnnotation) {
        const highlightedQuote = `<span class="px-1 rounded border bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 uncaptured-quote">"${quotedText.text}"</span>`

        modifications.push({
          start,
          end,
          replacement: highlightedQuote,
        })
      }
    })

    // Sort modifications in reverse order to avoid position shifts
    modifications.sort((a, b) => b.start - a.start)

    // Apply all modifications
    modifications.forEach(({ start, end, replacement }) => {
      result = result.substring(0, start) + replacement + result.substring(end)
    })

    return result
  }

  const handleClaimClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const claimElement = target.closest(".claim-highlight")

    if (claimElement) {
      const index = Number.parseInt(claimElement.getAttribute("data-index") || "-1", 10)
      if (index !== -1) {
        onSelectClaim(index)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="outline" className="flex items-center gap-1 border-green-300 bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-3 w-3 text-green-500" /> Supported Claim
        </Badge>
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-yellow-300 bg-yellow-100 dark:bg-yellow-900/30"
        >
          <AlertCircle className="h-3 w-3 text-yellow-500" /> Unsupported Claim
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 border-red-300 bg-red-100 dark:bg-red-900/30">
          <XCircle className="h-3 w-3 text-red-500" /> Uncaptured Quote
        </Badge>
      </div>

      <ScrollArea className="h-[500px] rounded-md border p-4">
        <div
          className="prose dark:prose-invert max-w-none whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: renderHighlightedLetter() }}
          onClick={handleClaimClick}
        />
      </ScrollArea>
    </div>
  )
}
