"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { AnnotationReportReview } from "@/components/annotation-report-review"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Copy, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

// Appeal Plan Schema
export const AppealPlanSchema = z
  .object({
    keyArguments: z.array(
      z
        .object({
          title: z.string(),
          evidenceIds: z.array(z.string()),
          narrative: z.string(),
          supportingCitationIds: z.array(z.string()),
        })
        .passthrough(),
    ),
    anticipatedCounterarguments: z.array(
      z
        .object({
          counterargument: z.string(),
          refutingEvidenceIds: z.array(z.string()),
          refutationNarrative: z.string(),
        })
        .passthrough(),
    ),
  })
  .passthrough()

interface AppealPlan {
  keyArguments: Array<{
    title: string
    evidenceIds: string[]
    narrative: string
    supportingCitationIds: string[]
  }>
  anticipatedCounterarguments: Array<{
    counterargument: string
    refutingEvidenceIds: string[]
    refutationNarrative: string
  }>
}

interface AnnotationData {
  letter: string
  snippets: Array<{
    quote: string
    type: "quote" | "statement" | "source"
    category: "lab" | "vital" | "imaging" | "cdi_query" | "note" | "med" | "other"
    evidence: Array<{
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
    }>
    supportingSources?: Array<{
      source: string
      sourceUrl?: string
      citation: string
      whenToUse?: string
      howToUse?: string
      generatedId: string
    }>
    supportRating: "strong" | "partial" | "none"
    replacement?: {
      currentText: string
      replacementText: string
      justification: string
    }
  }>
  plan?: AppealPlan
}

export default function IframePage() {
  const [data, setData] = useState<AnnotationData | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<any>(null)
  const [rawInput, setRawInput] = useState<any>(null)
  const [debugExpanded, setDebugExpanded] = useState(false)
  const [dataSource, setDataSource] = useState<"output" | "expected" | "direct" | null>(null)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  // Flexible data extraction function
  const extractAnnotationData = (messageData: any): { data: AnnotationData; source: string } | null => {
    // Handle settings messages
    if (messageData.type === "settings" && messageData.settings) {
      if (messageData.settings.theme) {
        setTheme(messageData.settings.theme)
        if (messageData.settings.theme === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      }
      return null
    }

    // Skip non-data messages
    if (messageData.type !== "data") {
      return null
    }

    let annotationData: any = null
    let source = "unknown"

    // Try to find annotation data in various locations
    if (messageData.data) {
      // Check for Braintrust format with output
      if (messageData.data.output?.letter && messageData.data.output?.fullAnnotationReport?.snippets) {
        annotationData = {
          letter: messageData.data.output.letter,
          snippets: messageData.data.output.fullAnnotationReport.snippets,
          plan: messageData.data.output.plan,
        }
        source = "output"
      }
      // Check for Braintrust format with expected
      else if (messageData.data.expected?.letter && messageData.data.expected?.fullAnnotationReport?.snippets) {
        annotationData = {
          letter: messageData.data.expected.letter,
          snippets: messageData.data.expected.fullAnnotationReport.snippets,
          plan: messageData.data.expected.plan,
        }
        source = "expected"
      }
      // Check for direct format
      else if (messageData.data.letter && messageData.data.snippets) {
        annotationData = {
          letter: messageData.data.letter,
          snippets: messageData.data.snippets,
          plan: messageData.data.plan,
        }
        source = "direct"
      }
    }

    // Validate that we have the minimum required data
    if (!annotationData || !annotationData.letter || !Array.isArray(annotationData.snippets)) {
      return null
    }

    // Basic validation and cleanup of snippets
    const validSnippets = annotationData.snippets.filter((snippet: any) => {
      return (
        snippet &&
        typeof snippet.quote === "string" &&
        snippet.quote.trim() !== "" &&
        Array.isArray(snippet.evidence) &&
        ["quote", "statement", "source"].includes(snippet.type) &&
        ["lab", "vital", "imaging", "cdi_query", "note", "med", "other"].includes(snippet.category) &&
        ["strong", "partial", "none"].includes(snippet.supportRating)
      )
    })

    if (validSnippets.length === 0) {
      return null
    }

    return {
      data: {
        letter: annotationData.letter,
        snippets: validSnippets,
        plan: annotationData.plan,
      },
      source,
    }
  }

  const formatError = (error: any) => {
    if (error && typeof error === "object") {
      if (error.issues && Array.isArray(error.issues)) {
        return error.issues.map((issue: any, index: number) => ({
          index,
          path: Array.isArray(issue.path) ? issue.path.join(".") || "root" : "unknown",
          message: issue.message || "Unknown error",
          code: issue.code || "unknown",
          expected: issue.expected,
          received: issue.received,
        }))
      }
    }
    return [{ index: 0, path: "root", message: String(error), code: "unknown" }]
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        // Store the raw input for debugging
        setRawInput(event.data)

        // Skip invalid messages
        if (!event.data || typeof event.data !== "object") {
          console.log("Skipping invalid message:", event.data)
          return
        }

        console.log("Processing message:", event.data)

        const result = extractAnnotationData(event.data)

        if (result) {
          console.log("Successfully extracted annotation data from:", result.source)
          setData(result.data)
          setDataSource(result.source as "output" | "expected" | "direct")
          setIsLoading(false)
          setError(null)
          setValidationError(null)
        } else if (event.data.type === "data") {
          // Only show error for data messages that failed to parse
          console.warn("Failed to extract annotation data from data message")
          setValidationError({ message: "Could not extract valid annotation data from message" })
          setError("validation")
          setIsLoading(false)
        }
        // For non-data messages (like settings), just continue without error
      } catch (error) {
        console.error("Message processing failed:", error)
        setValidationError(error)
        setError("validation")
        setIsLoading(false)
      }
    }

    window.addEventListener("message", handleMessage)

    // Send ready message to parent only once
    const sendReady = () => {
      try {
        window.parent.postMessage({ type: "ready" }, "*")
      } catch (e) {
        console.warn("Could not send ready message:", e)
      }
    }

    sendReady()

    // Set up a timeout to show not supported message if no valid message is received
    const timeout = setTimeout(() => {
      if (!data && !error) {
        setError("unsupported")
        setIsLoading(false)
      }
    }, 3000)

    return () => {
      window.removeEventListener("message", handleMessage)
      clearTimeout(timeout)
    }
  }, [data, error])

  // Apply theme class to body
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }
  }, [theme])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <div className="text-center">
                <h3 className="text-lg font-medium">Loading Annotation Report</h3>
                <p className="text-sm text-muted-foreground mt-1">Checking data format...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error === "validation" && validationError) {
    const formattedErrors = formatError(validationError)

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-red-600">Data Extraction Failed</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Could not extract valid annotation data from the received message.
                </p>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>The message doesn't contain the required annotation data structure.</AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Issues Found:</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {formattedErrors.map((error) => (
                    <Card key={error.index} className="border-red-200 dark:border-red-800">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-red-700 dark:text-red-300">
                              Issue #{error.index + 1}
                            </span>
                            <span className="text-xs bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                              {error.code}
                            </span>
                          </div>

                          <div>
                            <span className="text-xs text-muted-foreground">Path:</span>
                            <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                              {error.path}
                            </code>
                          </div>

                          <div>
                            <span className="text-xs text-muted-foreground">Message:</span>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error.message}</p>
                          </div>

                          {error.expected && (
                            <div>
                              <span className="text-xs text-muted-foreground">Expected:</span>
                              <code className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 px-1 py-0.5 rounded">
                                {Array.isArray(error.expected) ? error.expected.join(" | ") : String(error.expected)}
                              </code>
                            </div>
                          )}

                          {error.received !== undefined && (
                            <div>
                              <span className="text-xs text-muted-foreground">Received:</span>
                              <code className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 px-1 py-0.5 rounded">
                                {String(error.received)}
                              </code>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="text-left">
                <Collapsible open={debugExpanded} onOpenChange={setDebugExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      {debugExpanded ? (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Hide Raw Data
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-4 w-4 mr-2" />
                          Show Raw Data
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Received Message:</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(rawInput, null, 2))}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md border">
                          <pre className="text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                            {JSON.stringify(rawInput, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Expected Data Locations:</h4>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                          <div className="text-xs space-y-2">
                            <div>
                              <strong>Option 1 - Braintrust Output:</strong>
                              <code className="block mt-1 p-2 bg-white dark:bg-gray-900 rounded">
                                data.output.letter + data.output.fullAnnotationReport.snippets
                              </code>
                            </div>
                            <div>
                              <strong>Option 2 - Braintrust Expected:</strong>
                              <code className="block mt-1 p-2 bg-white dark:bg-gray-900 rounded">
                                data.expected.letter + data.expected.fullAnnotationReport.snippets
                              </code>
                            </div>
                            <div>
                              <strong>Option 3 - Direct:</strong>
                              <code className="block mt-1 p-2 bg-white dark:bg-gray-900 rounded">
                                data.letter + data.snippets
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error === "unsupported") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">🚧</div>
              <div>
                <h3 className="text-lg font-medium">No Annotation Data Received</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Waiting for a message containing annotation report data...
                </p>
              </div>

              {rawInput && (
                <div className="mt-6 text-left">
                  <Collapsible open={debugExpanded} onOpenChange={setDebugExpanded}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        {debugExpanded ? (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Hide Debug Info
                          </>
                        ) : (
                          <>
                            <ChevronRight className="h-4 w-4 mr-2" />
                            Show Debug Info
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Last Received Message:</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(rawInput, null, 2))}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md border">
                          <pre className="text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                            {JSON.stringify(rawInput, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">❌</div>
              <div>
                <h3 className="text-lg font-medium text-red-600">Error Loading Data</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium">No Data Available</h3>
              <p className="text-sm text-muted-foreground mt-1">No annotation report data has been received.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 px-4">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Clinical Evidence Review</h1>
              <p className="text-sm text-muted-foreground">Annotation report loaded in Braintrust iframe</p>
            </div>
            {dataSource && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Data source:</p>
                <Badge variant="outline" className="text-xs">
                  {dataSource === "output" ? "Output" : dataSource === "expected" ? "Expected" : "Direct"}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <AnnotationReportReview letter={data.letter} snippets={data.snippets} plan={data.plan} />
      </div>
    </div>
  )
}
