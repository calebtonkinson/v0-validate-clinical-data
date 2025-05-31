"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AnnotationReportInputProps {
  onDataChange: (data: any) => void
}

export function AnnotationReportInput({ onDataChange }: AnnotationReportInputProps) {
  const [letterData, setLetterData] = useState<string>("")
  const [snippetsData, setSnippetsData] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const validateAndCombineData = (letter: string, snippets: string) => {
    setError(null)

    try {
      if (!letter.trim()) {
        setError("Letter text is required")
        onDataChange(null)
        return
      }

      if (!snippets.trim()) {
        setError("Snippets JSON is required")
        onDataChange(null)
        return
      }

      const parsedSnippets = JSON.parse(snippets)

      // Validate snippets structure
      if (!Array.isArray(parsedSnippets)) {
        setError("Snippets must be an array")
        onDataChange(null)
        return
      }

      // Validate each snippet
      for (let i = 0; i < parsedSnippets.length; i++) {
        const snippet = parsedSnippets[i]

        if (!snippet.quote) {
          setError(`Snippet at index ${i} is missing the 'quote' property`)
          onDataChange(null)
          return
        }

        if (!snippet.type || !["quote", "statement"].includes(snippet.type)) {
          setError(`Snippet at index ${i} must have a 'type' of 'quote' or 'statement'`)
          onDataChange(null)
          return
        }

        if (
          !snippet.category ||
          !["lab", "vital", "imaging", "cdi_query", "note", "med", "other"].includes(snippet.category)
        ) {
          setError(`Snippet at index ${i} must have a valid 'category'`)
          onDataChange(null)
          return
        }

        if (!snippet.supportRating || !["strong", "partial", "none"].includes(snippet.supportRating)) {
          setError(`Snippet at index ${i} must have a 'supportRating' of 'strong', 'partial', or 'none'`)
          onDataChange(null)
          return
        }

        if (!snippet.evidence || !Array.isArray(snippet.evidence)) {
          setError(`Snippet at index ${i} is missing the 'evidence' array`)
          onDataChange(null)
          return
        }

        // Validate each evidence item
        for (let j = 0; j < snippet.evidence.length; j++) {
          const evidence = snippet.evidence[j]
          if (!evidence.type) {
            setError(`Evidence at index ${j} in snippet ${i} is missing the 'type' property`)
            onDataChange(null)
            return
          }
          if (!evidence.timestamp) {
            setError(`Evidence at index ${j} in snippet ${i} is missing the 'timestamp' property`)
            onDataChange(null)
            return
          }
          if (!evidence.result) {
            setError(`Evidence at index ${j} in snippet ${i} is missing the 'result' property`)
            onDataChange(null)
            return
          }
        }

        // Validate replacement if present
        if (snippet.replacement) {
          if (typeof snippet.replacement !== "object") {
            setError(`Snippet at index ${i}: 'replacement' must be an object`)
            onDataChange(null)
            return
          }

          if (!snippet.replacement.currentText) {
            setError(`Snippet at index ${i}: replacement is missing 'currentText' property`)
            onDataChange(null)
            return
          }

          if (!snippet.replacement.replacementText) {
            setError(`Snippet at index ${i}: replacement is missing 'replacementText' property`)
            onDataChange(null)
            return
          }

          if (!snippet.replacement.justification) {
            setError(`Snippet at index ${i}: replacement is missing 'justification' property`)
            onDataChange(null)
            return
          }
        }
      }

      // Combine letter and snippets
      const combinedData = {
        letter: letter.trim(),
        snippets: parsedSnippets,
      }

      onDataChange(combinedData)
    } catch (e) {
      setError(`Invalid JSON in snippets: ${(e as Error).message}`)
      onDataChange(null)
    }
  }

  const handleLetterChange = (value: string) => {
    setLetterData(value)
    validateAndCombineData(value, snippetsData)
  }

  const handleSnippetsChange = (value: string) => {
    setSnippetsData(value)
    validateAndCombineData(letterData, value)
  }

  const generateSampleLetter = () => {
    return `Patient was admitted to the emergency department with severe chest pain that started 2 hours prior to arrival. Initial vital signs showed blood pressure was 180/95 mmHg, heart rate 110 bpm, and oxygen saturation 98% on room air. Lab results showed elevated troponin levels indicating cardiac injury. The patient reported the pain as crushing and radiating to the left arm. CT scan was completely normal according to the initial read, though the final radiology report noted some findings. Patient was started on appropriate cardiac medications and monitored closely.`
  }

  const generateSampleSnippets = () => {
    return [
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
        quote: "severe chest pain",
        type: "quote",
        category: "note",
        evidence: [
          {
            type: "Clinical Notes",
            timestamp: "2023-05-15T07:45:00Z",
            resultLabel: "Chief Complaint:",
            result: "Patient states 'I have severe crushing chest pain that started 2 hours ago'",
            reasoning: "Direct quote from patient during initial assessment",
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
    ]
  }

  const loadSampleData = () => {
    const sampleLetter = generateSampleLetter()
    const sampleSnippets = JSON.stringify(generateSampleSnippets(), null, 2)

    setLetterData(sampleLetter)
    setSnippetsData(sampleSnippets)
    validateAndCombineData(sampleLetter, sampleSnippets)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>JSON Structure Validator</CardTitle>
          <CardDescription>Check your annotation report against the expected structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Expected Snippets Structure:</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto">
                {`[
  {
    "quote": "string",
    "type": "quote" | "statement",
    "category": "lab" | "vital" | "imaging" | "cdi_query" | "note" | "med" | "other",
    "evidence": [
      {
        "id": "string (optional)",
        "type": "string",
        "timestamp": "string (ISO format)",
        "hideTimestamp": boolean (optional),
        "hideResult": boolean (optional),
        "resultLabel": "string (optional)",
        "result": "string",
        "reference": "string (optional)",
        "reasoning": "string (optional)",
        "timezone": "string (optional)",
        "generatedId": "string (optional)"
      }
    ],
    "supportRating": "strong" | "partial" | "none",
    "replacement": {
      "currentText": "string",
      "replacementText": "string", 
      "justification": "string"
    } (optional)
  }
]`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Validation Status:</h3>
              <div className="p-3 rounded border">
                {error ? (
                  <div className="text-red-500">{error}</div>
                ) : (
                  <div className="text-green-500">
                    {letterData.trim() && snippetsData.trim()
                      ? "Letter and snippets are valid ✓"
                      : "Please provide both letter text and snippets JSON"}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={loadSampleData} variant="outline">
                Load Sample Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Letter Text</CardTitle>
          <CardDescription>Enter or paste the clinical letter text</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter the clinical letter text here..."
            className="h-40"
            value={letterData}
            onChange={(e) => handleLetterChange(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Snippets JSON</CardTitle>
          <CardDescription>Enter the snippets array as JSON</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste your snippets JSON array here..."
            className="font-mono h-80"
            value={snippetsData}
            onChange={(e) => handleSnippetsChange(e.target.value)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
