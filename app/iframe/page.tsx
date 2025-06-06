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

// Common annotation data schema
const annotationDataSchema = z
  .object({
    letter: z.string(),
    fullAnnotationReport: z
      .object({
        snippets: z.array(
          z
            .object({
              quote: z.string(),
              type: z.enum(["quote", "statement", "source"]),
              category: z.enum(["lab", "vital", "imaging", "cdi_query", "note", "med", "other"]),
              supportingSources: z
                .array(
                  z
                    .object({
                      source: z.string(),
                      sourceUrl: z.string().optional(),
                      citation: z.string(),
                      whenToUse: z.string().optional(),
                      howToUse: z.string().optional(),
                      generatedId: z.string(),
                    })
                    .passthrough(),
                )
                .optional(),
              evidence: z.array(
                z
                  .object({
                    id: z.string().optional(),
                    type: z.string(),
                    timestamp: z.string(),
                    hideTimestamp: z.boolean().optional(),
                    hideResult: z.boolean().optional(),
                    resultLabel: z.string().optional(),
                    result: z.string(),
                    reference: z.string().optional(),
                    reasoning: z.string().optional(),
                    timezone: z.string().optional(),
                    generatedId: z.string().optional(),
                  })
                  .passthrough(),
              ),
              supportRating: z.enum(["strong", "partial", "none"]),
              replacement: z
                .object({
                  currentText: z.string(),
                  replacementText: z.string(),
                  justification: z.string(),
                })
                .passthrough()
                .optional(),
            })
            .passthrough(),
        ),
      })
      .passthrough(),
    plan: AppealPlanSchema.optional(),
  })
  .passthrough()

// Zod schemas for message validation - made permissive with .passthrough()
export const settingsMessageSchema = z
  .object({
    type: z.literal("settings"),
    settings: z
      .object({
        theme: z.enum(["light", "dark"]),
        readOnly: z.boolean(),
      })
      .passthrough(), // Allow extra fields
  })
  .passthrough()

// Schema for Braintrust data format - made permissive
export const braintrustDataMessageSchema = z
  .object({
    type: z.literal("data"),
    data: z
      .object({
        span_id: z.string(),
        output: annotationDataSchema.optional(), // Data might be in output
        expected: annotationDataSchema.optional(), // Or in expected
      })
      .passthrough() // Allow extra fields in data
      .refine((data) => data.output || data.expected, {
        message: "Either 'output' or 'expected' must contain annotation data",
      }),
  })
  .passthrough()

// Legacy direct format schema (for backwards compatibility) - made permissive
export const directDataMessageSchema = z
  .object({
    type: z.literal("data"),
    data: z
      .object({
        letter: z.string(),
        snippets: z.array(
          z
            .object({
              quote: z.string(),
              type: z.enum(["quote", "statement"]),
              category: z.enum(["lab", "vital", "imaging", "cdi_query", "note", "med", "other"]),
              evidence: z.array(
                z
                  .object({
                    id: z.string().optional(),
                    type: z.string(),
                    timestamp: z.string(),
                    hideTimestamp: z.boolean().optional(),
                    hideResult: z.boolean().optional(),
                    resultLabel: z.string().optional(),
                    result: z.string(),
                    reference: z.string().optional(),
                    reasoning: z.string().optional(),
                    timezone: z.string().optional(),
                    generatedId: z.string().optional(),
                  })
                  .passthrough(),
              ),
              supportRating: z.enum(["strong", "partial", "none"]),
              replacement: z
                .object({
                  currentText: z.string(),
                  replacementText: z.string(),
                  justification: z.string(),
                })
                .passthrough()
                .optional(),
            })
            .passthrough(),
        ),
        plan: AppealPlanSchema.optional(), // Add optional plan to legacy format too
      })
      .passthrough(),
  })
  .passthrough()

export const messageSchema = z.union([settingsMessageSchema, braintrustDataMessageSchema, directDataMessageSchema])

export type Message = z.infer<typeof messageSchema>

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
    type: "quote" | "statement"
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
  const [validationError, setValidationError] = useState<z.ZodError | null>(null)
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

  const mapBraintrustData = (braintrustData: any): { data: AnnotationData; source: "output" | "expected" } => {
    // Check output first, then expected
    if (braintrustData.output && braintrustData.output.letter && braintrustData.output.fullAnnotationReport) {
      return {
        data: {
          letter: braintrustData.output.letter,
          snippets: braintrustData.output.fullAnnotationReport.snippets,
          plan: braintrustData.output.plan,
        },
        source: "output",
      }
    } else if (
      braintrustData.expected &&
      braintrustData.expected.letter &&
      braintrustData.expected.fullAnnotationReport
    ) {
      return {
        data: {
          letter: braintrustData.expected.letter,
          snippets: braintrustData.expected.fullAnnotationReport.snippets,
          plan: braintrustData.expected.plan,
        },
        source: "expected",
      }
    }

    // Fallback - shouldn't reach here due to schema validation
    throw new Error("No valid annotation data found in output or expected")
  }

  const formatZodError = (zodError: z.ZodError) => {
    return zodError.issues.map((issue, index) => ({
      index,
      path: issue.path.join(".") || "root",
      message: issue.message,
      code: issue.code,
      expected: "expected" in issue ? issue.expected : undefined,
      received: "received" in issue ? issue.received : undefined,
      options: "options" in issue ? issue.options : undefined,
    }))
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        // Store the raw input for debugging
        setRawInput(event.data)

        const message = messageSchema.parse(event.data)

        if (message.type === "settings") {
          setTheme(message.settings.theme)
          // Apply theme to document
          if (message.settings.theme === "dark") {
            document.documentElement.classList.add("dark")
          } else {
            document.documentElement.classList.remove("dark")
          }
        } else if (message.type === "data") {
          let mappedData: AnnotationData
          let source: "output" | "expected" | "direct"

          // Check if it's Braintrust format (has output or expected with fullAnnotationReport)
          if ("output" in message.data || "expected" in message.data) {
            const result = mapBraintrustData(message.data)
            mappedData = result.data
            source = result.source
          } else {
            // Direct format
            mappedData = message.data as AnnotationData
            source = "direct"
          }

          setData(mappedData)
          setDataSource(source)
          setIsLoading(false)
          setError(null)
          setValidationError(null)
        }
      } catch (error) {
        console.warn("Validation failed:", error)

        // Capture the Zod error details
        if (error instanceof z.ZodError) {
          setValidationError(error)
          setError("validation")
        } else {
          setError("unsupported")
        }
        setIsLoading(false)
      }
    }

    window.addEventListener("message", handleMessage)

    // Send ready message to parent
    window.parent.postMessage({ type: "ready" }, "*")

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
    const formattedErrors = formatZodError(validationError)

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-red-600">Data Validation Failed</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  The received data doesn't match the expected schema. See details below:
                </p>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Found {formattedErrors.length} validation error{formattedErrors.length !== 1 ? "s" : ""}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Validation Errors:</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {formattedErrors.map((error) => (
                    <Card key={error.index} className="border-red-200 dark:border-red-800">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-red-700 dark:text-red-300">
                              Error #{error.index + 1}
                            </span>
                            <span className="text-xs bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                              {error.code}
                            </span>
                          </div>

                          <div>
                            <span className="text-xs text-muted-foreground">Path:</span>
                            <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                              {error.path || "root"}
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

                          {error.options && (
                            <div>
                              <span className="text-xs text-muted-foreground">Valid options:</span>
                              <code className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 px-1 py-0.5 rounded">
                                {Array.isArray(error.options) ? error.options.join(", ") : String(error.options)}
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
                          Hide Raw Data & Schema
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-4 w-4 mr-2" />
                          Show Raw Data & Schema
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Complete Zod Error Object:</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(validationError, null, 2))}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Error
                          </Button>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                          <pre className="text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                            {JSON.stringify(validationError, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Received Input Data:</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(rawInput, null, 2))}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Input
                          </Button>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md border">
                          <pre className="text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                            {JSON.stringify(rawInput, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Expected Braintrust Format:</h4>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                          <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                            {`{
  "type": "data",
  "data": {
    "span_id": "...",
    "output": {  // Data can be in 'output'
      "letter": "Clinical letter text...",
      "fullAnnotationReport": { "snippets": [...] },
      "plan": { "keyArguments": [...], "anticipatedCounterarguments": [...] }
    },
    "expected": {  // OR in 'expected'
      "letter": "Clinical letter text...",
      "fullAnnotationReport": { "snippets": [...] },
      "plan": { "keyArguments": [...], "anticipatedCounterarguments": [...] }
    }
  }
}`}
                          </pre>
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
                <h3 className="text-lg font-medium">Log Format Not Supported</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  This log doesn't contain annotation report data in the expected format.
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  Expected: Braintrust span with data in output.fullAnnotationReport or expected.fullAnnotationReport
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
                          <h4 className="text-sm font-medium">Received Input Data:</h4>
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
