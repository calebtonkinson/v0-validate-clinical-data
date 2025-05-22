"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"

interface DebugPanelProps {
  inputData: string
  outputData: string[]
  parsedInput: any
  parsedOutputs: any[]
}

export function DebugPanel({ inputData, outputData, parsedInput, parsedOutputs }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatJson = (json: string): string => {
    try {
      return JSON.stringify(JSON.parse(json), null, 2)
    } catch (e) {
      return json
    }
  }

  const generateSampleInput = () => {
    return {
      letter:
        "Patient was admitted with severe abdominal pain. CT scan showed appendicitis. Surgery was performed successfully.",
      annotations: [
        {
          quote: "Patient was admitted with severe abdominal pain",
          appendix: [
            {
              type: "Clinical Notes: ED Triage",
              timestamp: "2023-05-15T08:30:00Z",
              id: "ev-1001",
              resultLabel: "Notes:",
              result: "Patient presents with severe abdominal pain in lower right quadrant.",
              reasoning: "Directly states the patient was admitted with severe abdominal pain.",
            },
          ],
        },
        {
          quote: "CT scan showed appendicitis",
          appendix: [
            {
              type: "Radiology Report",
              timestamp: "2023-05-15T09:45:00Z",
              id: "ev-1002",
              resultLabel: "Findings:",
              result: "CT scan of abdomen reveals inflamed appendix consistent with acute appendicitis.",
              reasoning: "Confirms CT scan results showing appendicitis.",
            },
          ],
        },
      ],
    }
  }

  const generateSampleOutput = () => {
    return {
      claims: [
        {
          text: "Patient was admitted with severe abdominal pain",
          supported: true,
          supportingEvidence: ["ev-1001"],
        },
        {
          text: "CT scan showed appendicitis",
          supported: true,
          supportingEvidence: ["ev-1002"],
        },
      ],
      overallAssessment: {
        fullySupported: true,
        unsupportedClaimsCount: 0,
      },
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center justify-between">
            <CardTitle>Debug Panel</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CardDescription>Troubleshoot JSON parsing and structure issues</CardDescription>

          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(generateSampleInput(), null, 2))
                }}
              >
                Copy Sample Input JSON
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(generateSampleOutput(), null, 2))
                }}
              >
                Copy Sample Output JSON
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Parsed Input Structure:</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-60">
                {parsedInput ? JSON.stringify(parsedInput, null, 2) : "No valid input parsed"}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Parsed Output Structures:</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-60">
                {parsedOutputs.some(Boolean)
                  ? JSON.stringify(parsedOutputs.filter(Boolean), null, 2)
                  : "No valid outputs parsed"}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Raw Input:</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-60">
                {inputData ? formatJson(inputData) : "No input provided"}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  )
}
