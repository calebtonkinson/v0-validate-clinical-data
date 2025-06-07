"use client"

import type React from "react"
import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, XCircle, Clock, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface AppendixCitation {
  id?: string
  type: string
  timestamp: string
  hideTimestamp?: boolean
  hideResult?: boolean
  resultLabel?: string
  result: string
  reference?: string
  reasoning?: string
  timezone?: string
  generatedId?: string
}

interface SupportingSource {
  source: string
  sourceUrl?: string
  citation: string
  whenToUse?: string
  howToUse?: string
  generatedId: string
}

interface AnnotationSnippet {
  quote: string
  type: "quote" | "statement" | "source"
  category: "lab" | "vital" | "imaging" | "cdi_query" | "note" | "med" | "other"
  evidence: AppendixCitation[]
  supportingSources?: SupportingSource[]
  supportRating: "strong" | "partial" | "none"
  replacement?: {
    currentText: string
    replacementText: string
    justification: string
  }
}

interface AnnotationReportLetterViewProps {
  letter: string
  snippets: AnnotationSnippet[]
  selectedSnippetIndex: number | null
  onSelectSnippet: (index: number) => void
}

export function AnnotationReportLetterView({
  letter,
  snippets,
  selectedSnippetIndex,
  onSelectSnippet,
}: AnnotationReportLetterViewProps) {
  const [showEvidencePanel, setShowEvidencePanel] = useState(false)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "lab":
        return "🧪"
      case "vital":
        return "💓"
      case "imaging":
        return "📷"
      case "cdi_query":
        return "💬"
      case "note":
        return "📝"
      case "med":
        return "💊"
      default:
        return "❓"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "source":
        return "📚"
      case "quote":
        return "💬"
      case "statement":
        return "📄"
      default:
        return "❓"
    }
  }

  const getSupportRatingColor = (rating: string) => {
    switch (rating) {
      case "strong":
        return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700"
      case "partial":
        return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700"
      case "none":
        return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700"
      default:
        return "bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "source":
        return "border-l-indigo-500"
      case "quote":
        return "border-l-emerald-500"
      case "statement":
        return "border-l-amber-500"
      default:
        return "border-l-gray-400"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "lab":
        return "border-l-blue-500"
      case "vital":
        return "border-l-green-500"
      case "imaging":
        return "border-l-purple-500"
      case "cdi_query":
        return "border-l-orange-500"
      case "note":
        return "border-l-gray-500"
      case "med":
        return "border-l-red-500"
      default:
        return "border-l-gray-400"
    }
  }

  // Create a highlighted version of the letter
  const renderHighlightedLetter = () => {
    let result = letter
    const modifications: Array<{
      start: number
      end: number
      replacement: string
      priority: number
    }> = []

    // Process each snippet
    snippets.forEach((snippet, index) => {
      const quote = snippet.quote
      let start = letter.indexOf(quote)
      let textToHighlight = quote

      // If we can't find the original quote but there's a replacement,
      // try to find the replacement text in the letter
      if (start === -1 && snippet.replacement) {
        const replacementStart = letter.indexOf(snippet.replacement.replacementText)
        if (replacementStart !== -1) {
          start = replacementStart
          textToHighlight = snippet.replacement.replacementText
        }
      }

      if (start !== -1) {
        const end = start + textToHighlight.length
        const isSelected = selectedSnippetIndex === index

        let colorClass = getSupportRatingColor(snippet.supportRating)
        const borderClass = snippet.type === "source" ? getTypeColor(snippet.type) : getCategoryColor(snippet.category)

        if (isSelected) {
          colorClass += " ring-2 ring-blue-500"
        }

        const typeIcon = getTypeIcon(snippet.type)
        const categoryIcon = getCategoryIcon(snippet.category)
        const supportIcon = snippet.supportRating === "strong" ? "✓" : snippet.supportRating === "partial" ? "⚠" : "✗"

        let highlightedQuote: string

        if (snippet.replacement) {
          // Check if the text in the letter matches the replacement text (already applied)
          const isReplacementApplied = textToHighlight === snippet.replacement.replacementText

          if (isReplacementApplied) {
            // Replacement has been applied - show the current text with an indicator
            highlightedQuote = `<span 
            class="px-1 py-0.5 rounded cursor-pointer border-l-4 ${colorClass} ${borderClass} hover:opacity-80 snippet-highlight inline-block my-0.5" 
            data-index="${index}"
            title="Type: ${snippet.type} | Category: ${snippet.category} | Support: ${snippet.supportRating} | Replacement applied"
          ><span class="text-xs mr-1">${typeIcon}</span><span class="text-xs mr-1">${categoryIcon}</span><span class="text-blue-700 dark:text-blue-300 font-medium">${textToHighlight}</span><span class="text-xs ml-1 text-blue-600" title="Replacement applied">🔄</span><span class="text-xs ml-1">${supportIcon}</span></span>`
          } else {
            // Original text found - show crossed out with replacement
            highlightedQuote = `<span 
            class="px-1 py-0.5 rounded cursor-pointer border-l-4 ${colorClass} ${borderClass} hover:opacity-80 snippet-highlight inline-block my-0.5" 
            data-index="${index}"
            title="Type: ${snippet.type} | Category: ${snippet.category} | Support: ${snippet.supportRating} | Has replacement"
          ><span class="text-xs mr-1">${typeIcon}</span><span class="text-xs mr-1">${categoryIcon}</span><span class="line-through text-gray-500 dark:text-gray-400">${snippet.replacement.currentText}</span> <span class="text-blue-700 dark:text-blue-300 font-medium">${snippet.replacement.replacementText}</span><span class="text-xs ml-1">${supportIcon}</span></span>`
          }
        } else {
          // No replacement - standard highlighting
          highlightedQuote = `<span 
          class="px-1 py-0.5 rounded cursor-pointer border-l-4 ${colorClass} ${borderClass} hover:opacity-80 snippet-highlight inline-block my-0.5" 
          data-index="${index}"
          title="Type: ${snippet.type} | Category: ${snippet.category} | Support: ${snippet.supportRating}"
        ><span class="text-xs mr-1">${typeIcon}</span><span class="text-xs mr-1">${categoryIcon}</span>${textToHighlight}<span class="text-xs ml-1">${supportIcon}</span></span>`
        }

        modifications.push({
          start,
          end,
          replacement: highlightedQuote,
          priority: 1,
        })
      }
    })

    // Sort modifications by position (from end to start to avoid index shifting)
    modifications.sort((a, b) => b.start - a.start)

    // Apply all modifications
    modifications.forEach(({ start, end, replacement }) => {
      result = result.substring(0, start) + replacement + result.substring(end)
    })

    return result
  }

  const handleSnippetClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const snippetElement = target.closest(".snippet-highlight")

    if (snippetElement) {
      const index = Number.parseInt(snippetElement.getAttribute("data-index") || "-1", 10)
      if (index !== -1) {
        onSelectSnippet(index)
        setShowEvidencePanel(true)
      }
    }
  }

  const selectedSnippet = selectedSnippetIndex !== null ? snippets[selectedSnippetIndex] : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="outline" className="flex items-center gap-1 border-green-300 bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-3 w-3 text-green-500" /> Strong Support
        </Badge>
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-yellow-300 bg-yellow-100 dark:bg-yellow-900/30"
        >
          <AlertCircle className="h-3 w-3 text-yellow-500" /> Partial Support
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 border-red-300 bg-red-100 dark:bg-red-900/30">
          <XCircle className="h-3 w-3 text-red-500" /> No Support
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 border-blue-300 bg-blue-100 dark:bg-blue-900/30">
          <span className="line-through text-gray-500">Original</span>{" "}
          <span className="text-blue-700">Replacement</span>
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 border-blue-300 bg-blue-100 dark:bg-blue-900/30">
          🔄 <span className="text-blue-700">Applied</span>
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-2 mb-4">
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-indigo-300 bg-indigo-100 dark:bg-indigo-900/30"
        >
          📚 Source
        </Badge>
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-emerald-300 bg-emerald-100 dark:bg-emerald-900/30"
        >
          💬 Quote
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 border-amber-300 bg-amber-100 dark:bg-amber-900/30">
          📄 Statement
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 border-blue-300 bg-blue-100 dark:bg-blue-900/30">
          🧪 Lab
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 border-green-300 bg-green-100 dark:bg-green-900/30">
          💓 Vital
        </Badge>
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-purple-300 bg-purple-100 dark:bg-purple-900/30"
        >
          📷 Imaging
        </Badge>
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-orange-300 bg-orange-100 dark:bg-orange-900/30"
        >
          💬 CDI Query
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 border-gray-300 bg-gray-100 dark:bg-gray-900/30">
          📝 Note
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 border-red-300 bg-red-100 dark:bg-red-900/30">
          💊 Med
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 border-gray-300 bg-gray-100 dark:bg-gray-900/30">
          ❓ Other
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Letter</CardTitle>
              <CardDescription>Click on highlighted snippets to view evidence and sources</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] rounded-md border p-4">
                <div
                  className="prose dark:prose-invert max-w-none leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: renderHighlightedLetter() }}
                  onClick={handleSnippetClick}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Evidence Panel</CardTitle>
                  <CardDescription>
                    {selectedSnippet ? "Evidence and sources for selected snippet" : "Click a snippet to view details"}
                  </CardDescription>
                </div>
                {selectedSnippet && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowEvidencePanel(false)
                      onSelectSnippet(-1)
                    }}
                  >
                    ✕
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedSnippet ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTypeIcon(selectedSnippet.type)}</span>
                      <span className="font-medium capitalize">{selectedSnippet.type}</span>
                      <span className="text-lg">{getCategoryIcon(selectedSnippet.category)}</span>
                      <span className="font-medium capitalize">{selectedSnippet.category}</span>
                      <Badge variant="outline" className={getSupportRatingColor(selectedSnippet.supportRating)}>
                        {selectedSnippet.supportRating}
                      </Badge>
                    </div>
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">"{selectedSnippet.quote}"</p>
                        {selectedSnippet.replacement && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Suggested replacement:</p>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">
                                <span className="line-through">"{selectedSnippet.replacement.currentText}"</span>
                              </p>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                "{selectedSnippet.replacement.replacementText}"
                              </p>
                              <p className="text-xs text-muted-foreground italic">
                                {selectedSnippet.replacement.justification}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {selectedSnippet.supportingSources && selectedSnippet.supportingSources.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">
                        Supporting Sources ({selectedSnippet.supportingSources.length})
                      </h3>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-3">
                          {selectedSnippet.supportingSources.map((source, index) => (
                            <Card key={index} className="border-l-4 border-l-indigo-500">
                              <CardContent className="p-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm">{source.source}</h4>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {source.generatedId}
                                      </Badge>
                                      {source.sourceUrl && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => window.open(source.sourceUrl, "_blank")}
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  <Separator />

                                  <div>
                                    <h5 className="text-xs font-medium mb-1">Citation:</h5>
                                    <div className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                                      {source.citation}
                                    </div>
                                  </div>

                                  {source.whenToUse && (
                                    <div>
                                      <h5 className="text-xs font-medium mb-1">When to Use:</h5>
                                      <div className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                                        {source.whenToUse}
                                      </div>
                                    </div>
                                  )}

                                  {source.howToUse && (
                                    <div>
                                      <h5 className="text-xs font-medium mb-1">How to Use:</h5>
                                      <div className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                                        {source.howToUse}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Supporting Evidence ({selectedSnippet.evidence.length})
                    </h3>
                    <ScrollArea className="h-[350px]">
                      <div className="space-y-3">
                        {selectedSnippet.evidence.length === 0 ? (
                          <div className="text-center py-10 text-muted-foreground text-sm">
                            No evidence available for this snippet
                          </div>
                        ) : (
                          selectedSnippet.evidence.map((evidence, index) => (
                            <Card key={index} className="border-l-4 border-l-blue-500">
                              <CardContent className="p-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm">{evidence.type}</h4>
                                    {evidence.id && (
                                      <Badge variant="outline" className="text-xs">
                                        {evidence.id}
                                      </Badge>
                                    )}
                                  </div>

                                  {!evidence.hideTimestamp && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {new Date(evidence.timestamp).toLocaleString()}
                                      {evidence.timezone && <span className="ml-1">({evidence.timezone})</span>}
                                    </div>
                                  )}

                                  <Separator />

                                  {!evidence.hideResult && (
                                    <div>
                                      <h5 className="text-xs font-medium mb-1">{evidence.resultLabel || "Result:"}</h5>
                                      <div className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                                        {evidence.result}
                                      </div>
                                    </div>
                                  )}

                                  {evidence.reasoning && (
                                    <div>
                                      <h5 className="text-xs font-medium mb-1">Reasoning:</h5>
                                      <div className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                                        {evidence.reasoning}
                                      </div>
                                    </div>
                                  )}

                                  {evidence.reference && (
                                    <div>
                                      <h5 className="text-xs font-medium mb-1">Reference:</h5>
                                      <div className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                                        {evidence.reference}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <div className="text-4xl mb-4">👆</div>
                  <p className="text-sm">
                    Click on any highlighted snippet in the letter to view its evidence and sources
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
