"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Clock, Quote, CheckCircle, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface AnnotationsReviewProps {
  letter: string
  annotations: Array<{
    quote: string
    appendix: Array<{
      type: string
      timestamp: string
      id: string
      resultLabel: string
      result: string
      reasoning: string
    }>
  }>
  outputVersions?: any[]
}

export function AnnotationsReview({ letter, annotations, outputVersions = [] }: AnnotationsReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToNext = () => {
    if (currentIndex < annotations.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToAnnotation = (index: number) => {
    if (index >= 0 && index < annotations.length) {
      setCurrentIndex(index)
    }
  }

  // Get the current annotation
  const currentAnnotation = annotations[currentIndex]

  // Check if this annotation is supported in any output version
  const isAnnotationSupported = () => {
    if (outputVersions.length === 0) return false

    return outputVersions.some((output) => {
      const claim = output.claims[currentIndex]
      return claim && claim.supported
    })
  }

  // Get support status badge
  const getSupportBadge = () => {
    if (outputVersions.length === 0) return null

    const isSupported = isAnnotationSupported()

    return (
      <Badge
        variant="outline"
        className={`ml-2 ${
          isSupported
            ? "bg-green-100 dark:bg-green-900/30 border-green-300"
            : "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300"
        }`}
      >
        {isSupported ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1 text-green-500" /> Supported
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3 mr-1 text-yellow-500" /> Unsupported
          </>
        )}
      </Badge>
    )
  }

  // Find the quote in the letter and get some context
  const getQuoteWithContext = () => {
    if (!currentAnnotation) return { before: "", quote: "", after: "" }

    const quote = currentAnnotation.quote
    const quoteIndex = letter.indexOf(quote)

    if (quoteIndex === -1) return { before: "", quote, after: "" }

    // Get some context before and after the quote (up to 100 characters)
    const contextLength = 100
    const beforeStart = Math.max(0, quoteIndex - contextLength)
    const afterEnd = Math.min(letter.length, quoteIndex + quote.length + contextLength)

    const before = letter.substring(beforeStart, quoteIndex)
    const after = letter.substring(quoteIndex + quote.length, afterEnd)

    return { before, quote, after }
  }

  const { before, quote, after } = getQuoteWithContext()

  if (!currentAnnotation) {
    return <div>No annotations available</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <CardTitle>Annotation Review</CardTitle>
                <CardDescription>
                  Reviewing annotation {currentIndex + 1} of {annotations.length}
                </CardDescription>
              </div>
              {getSupportBadge()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                title="Previous annotation"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                disabled={currentIndex === annotations.length - 1}
                title="Next annotation"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Quote className="h-4 w-4 mr-2" /> Quote in Context
              </h3>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm">
                    <span className="text-muted-foreground">{before}</span>
                    <span
                      className={`px-1 rounded border ${
                        isAnnotationSupported()
                          ? "bg-green-100 dark:bg-green-900/30 border-green-300"
                          : "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300"
                      }`}
                    >
                      {quote}
                    </span>
                    <span className="text-muted-foreground">{after}</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Supporting Evidence ({currentAnnotation.appendix.length})</h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {currentAnnotation.appendix.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No evidence available for this quote</div>
                  ) : (
                    currentAnnotation.appendix.map((evidence, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{evidence.type}</h4>
                              <Badge variant="outline">{evidence.id}</Badge>
                            </div>

                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(evidence.timestamp).toLocaleString()}
                            </div>

                            <Separator />

                            <div>
                              <h5 className="text-xs font-medium mb-1">{evidence.resultLabel}</h5>
                              <div className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                                {evidence.result}
                              </div>
                            </div>

                            <div>
                              <h5 className="text-xs font-medium mb-1">Reasoning:</h5>
                              <div className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                                {evidence.reasoning}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="w-full flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {currentAnnotation.appendix.length} evidence items for this quote
            </div>
            <div className="flex items-center space-x-1">
              {annotations.map((_, index) => (
                <Button
                  key={index}
                  variant={index === currentIndex ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => goToAnnotation(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
