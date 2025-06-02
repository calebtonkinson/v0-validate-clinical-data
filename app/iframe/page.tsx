"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { AnnotationReportReview } from "@/components/annotation-report-review"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Copy } from "lucide-react"

// Zod schemas for message validation
export const settingsMessageSchema = z.object({
  type: z.literal("settings"),
  settings: z.object({
    theme: z.enum(["light", "dark"]),
    readOnly: z.boolean(),
  }),
})

// Schema for Braintrust data format
export const braintrustDataMessageSchema = z.object({
  type: z.literal("data"),
  data: z.object({
    span_id: z.string(),
    output: z.object({
      letter: z.string(),
      fullAnnotationReport: z.object({
        snippets: z.array(
          z.object({
            quote: z.string(),
            type: z.enum(["quote", "statement"]),
            category: z.enum(["lab", "vital", "imaging", "cdi_query", "note", "med", "other"]),
            evidence: z.array(
              z.object({
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
              }),
            ),
            supportRating: z.enum(["strong", "partial", "none"]),
            replacement: z
              .object({
                currentText: z.string(),
                replacementText: z.string(),
                justification: z.string(),
              })
              .optional(),
          }),
        ),
      }),
    }),
  }),
})

// Legacy direct format schema (for backwards compatibility)
export const directDataMessageSchema = z.object({
  type: z.literal("data"),
  data: z.object({
    letter: z.string(),
    snippets: z.array(
      z.object({
        quote: z.string(),
        type: z.enum(["quote", "statement"]),
        category: z.enum(["lab", "vital", "imaging", "cdi_query", "note", "med", "other"]),
        evidence: z.array(
          z.object({
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
          }),
        ),
        supportRating: z.enum(["strong", "partial", "none"]),
        replacement: z
          .object({
            currentText: z.string(),
            replacementText: z.string(),
            justification: z.string(),
          })
          .optional(),
      }),
    ),
  }),
})

export const messageSchema = z.union([settingsMessageSchema, braintrustDataMessageSchema, directDataMessageSchema])

export type Message = z.infer<typeof messageSchema>

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
}

export default function IframePage() {
  const [data, setData] = useState<AnnotationData | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawInput, setRawInput] = useState<any>(null)
  const [debugExpanded, setDebugExpanded] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const mapBraintrustData = (braintrustData: any): AnnotationData => {
    return {
      letter: braintrustData.output.letter,
      snippets: braintrustData.output.fullAnnotationReport.snippets,
    }
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

          // Check if it's Braintrust format (has output.fullAnnotationReport)
          if ("output" in message.data && "fullAnnotationReport" in message.data.output) {
            mappedData = mapBraintrustData(message.data)
          } else {
            // Direct format
            mappedData = message.data as AnnotationData
          }

          setData(mappedData)
          setIsLoading(false)
          setError(null)
        }
      } catch (error) {
        console.warn("Unsupported data format received:", error)
        setError("unsupported")
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
                  Expected: Braintrust span with output.letter and output.fullAnnotationReport.snippets
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

                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Expected Braintrust Format:</h4>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                            <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                              {`{
  "type": "data",
  "data": {
    "span_id": "...",
    "output": {
      "letter": "Clinical letter text...",
      "fullAnnotationReport": {
        "snippets": [
          {
            "quote": "text from letter",
            "type": "quote" | "statement",
            "category": "lab" | "vital" | "imaging" | "cdi_query" | "note" | "med" | "other",
            "evidence": [
              {
                "id": "optional-id",
                "type": "Evidence Type",
                "timestamp": "2023-05-15T08:30:00Z",
                "result": "Evidence result text",
                "reasoning": "Why this evidence supports the quote"
              }
            ],
            "supportRating": "strong" | "partial" | "none",
            "replacement": {
              "currentText": "original text",
              "replacementText": "suggested replacement",
              "justification": "reason for replacement"
            }
          }
        ]
      }
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
          <h1 className="text-2xl font-bold">Clinical Evidence Review</h1>
          <p className="text-sm text-muted-foreground">Annotation report loaded in Braintrust iframe</p>
        </div>

        <AnnotationReportReview letter={data.letter} snippets={data.snippets} />
      </div>
    </div>
  )
}
