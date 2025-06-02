"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { AnnotationReportReview } from "@/components/annotation-report-review"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// Zod schemas for message validation
export const settingsMessageSchema = z.object({
  type: z.literal("settings"),
  settings: z.object({
    theme: z.enum(["light", "dark"]),
    readOnly: z.boolean(),
  }),
})

export const dataMessageSchema = z.object({
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

export const messageSchema = z.union([settingsMessageSchema, dataMessageSchema])

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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
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
          setData(message.data)
          setIsLoading(false)
          setError(null)
        }
      } catch (error) {
        console.error("Invalid message received:", error)
        setError("Invalid data format received")
        setIsLoading(false)
      }
    }

    window.addEventListener("message", handleMessage)

    // Send ready message to parent
    window.parent.postMessage({ type: "ready" }, "*")

    // Set up a timeout to show sample data if no message is received
    const timeout = setTimeout(() => {
      if (!data) {
        // Load sample data for testing
        const sampleData: AnnotationData = {
          letter: `Patient was admitted to the emergency department with severe chest pain that started 2 hours prior to arrival. Initial vital signs showed blood pressure was 180/95 mmHg, heart rate 110 bpm, and oxygen saturation 98% on room air. Lab results showed elevated troponin levels indicating cardiac injury. The patient reported the pain as crushing and radiating to the left arm. CT scan was completely normal according to the initial read, though the final radiology report noted some findings. Patient was started on appropriate cardiac medications and monitored closely.`,
          snippets: [
            {
              quote: "blood pressure was 180/95 mmHg",
              type: "quote",
              category: "vital",
              evidence: [
                {
                  id: "vital-001",
                  type: "Vital Signs",
                  timestamp: "2023-05-15T08:30:00Z",
                  resultLabel: "Blood Pressure:",
                  result: "180/95 mmHg",
                  reasoning: "Direct measurement from automated cuff at 08:30",
                  timezone: "EST",
                },
              ],
              supportRating: "strong",
            },
            {
              quote: "Lab results showed elevated troponin levels",
              type: "statement",
              category: "lab",
              evidence: [
                {
                  id: "lab-002",
                  type: "Laboratory Report",
                  timestamp: "2023-05-15T09:15:00Z",
                  resultLabel: "Troponin I:",
                  result: "0.8 ng/mL (Normal: <0.04 ng/mL)",
                  reasoning: "Significantly elevated indicating cardiac injury",
                  reference: "Lab Report #12345",
                },
              ],
              supportRating: "strong",
            },
            {
              quote: "CT scan was completely normal",
              type: "statement",
              category: "imaging",
              evidence: [
                {
                  id: "img-003",
                  type: "Radiology Report",
                  timestamp: "2023-05-15T10:30:00Z",
                  resultLabel: "CT Chest Findings:",
                  result: "Mild atelectasis in bilateral lower lobes. No acute findings.",
                  reasoning: "Report shows mild findings, not completely normal as stated",
                },
              ],
              supportRating: "none",
              replacement: {
                currentText: "CT scan was completely normal",
                replacementText: "CT scan showed mild atelectasis in bilateral lower lobes with no acute findings",
                justification:
                  "The radiology report indicates mild atelectasis, which contradicts the claim that the scan was completely normal",
              },
            },
          ],
        }
        setData(sampleData)
        setIsLoading(false)
      }
    }, 2000)

    return () => {
      window.removeEventListener("message", handleMessage)
      clearTimeout(timeout)
    }
  }, [data])

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
                <p className="text-sm text-muted-foreground mt-1">Waiting for data from Braintrust...</p>
                <p className="text-xs text-muted-foreground mt-2">
                  If this takes too long, sample data will be loaded for testing.
                </p>
              </div>
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
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-600">Error Loading Data</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
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
