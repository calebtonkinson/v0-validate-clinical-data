"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Plus, Trash2 } from "lucide-react"
import { LetterView } from "@/components/letter-view"
import { EvidencePanel } from "@/components/evidence-panel"
import { ComparisonView } from "@/components/comparison-view"
import { DebugPanel } from "@/components/debug-panel"
import { AnnotationsReview } from "@/components/annotations-review"

export default function Home() {
  const [inputData, setInputData] = useState<string>("")
  const [outputVersions, setOutputVersions] = useState<Array<{ name: string; data: string }>>([
    { name: "Version 1", data: "" },
  ])
  const [activeTab, setActiveTab] = useState("input")
  const [parsedInput, setParsedInput] = useState<any>(null)
  const [parsedOutputs, setParsedOutputs] = useState<any[]>([])
  const [selectedClaimIndex, setSelectedClaimIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (value: string) => {
    setInputData(value)
    setError(null)

    try {
      if (value.trim()) {
        const parsed = JSON.parse(value)

        // Validate the structure of the input
        if (!parsed.letter) {
          setError("Input JSON must have a 'letter' property")
          setParsedInput(null)
          return
        }

        if (!parsed.annotations || !Array.isArray(parsed.annotations)) {
          setError("Input JSON must have an 'annotations' array")
          setParsedInput(null)
          return
        }

        // Validate each annotation
        for (let i = 0; i < parsed.annotations.length; i++) {
          const annotation = parsed.annotations[i]
          if (!annotation.quote) {
            setError(`Annotation at index ${i} is missing the 'quote' property`)
            setParsedInput(null)
            return
          }

          if (!annotation.appendix || !Array.isArray(annotation.appendix)) {
            setError(`Annotation at index ${i} is missing the 'appendix' array`)
            setParsedInput(null)
            return
          }

          // Validate each evidence source
          for (let j = 0; j < annotation.appendix.length; j++) {
            const evidence = annotation.appendix[j]
            if (!evidence.id) {
              setError(`Evidence at index ${j} in annotation ${i} is missing the 'id' property`)
              setParsedInput(null)
              return
            }
          }
        }

        // Wrap the parsed data in an expected object to maintain compatibility with the rest of the app
        setParsedInput({ expected: parsed })
      } else {
        setParsedInput(null)
      }
    } catch (e) {
      setError(`Invalid JSON input: ${(e as Error).message}`)
      setParsedInput(null)
    }
  }

  const handleOutputChange = (index: number, value: string) => {
    const newOutputs = [...outputVersions]
    newOutputs[index].data = value
    setOutputVersions(newOutputs)
    setError(null)

    try {
      if (value.trim()) {
        const parsed = JSON.parse(value)

        // Validate the structure of the output
        if (!parsed.claims || !Array.isArray(parsed.claims)) {
          setError(`Output ${outputVersions[index].name} must have a 'claims' array`)
          const newParsedOutputs = [...parsedOutputs]
          newParsedOutputs[index] = null
          setParsedOutputs(newParsedOutputs)
          return
        }

        if (!parsed.overallAssessment) {
          setError(`Output ${outputVersions[index].name} must have an 'overallAssessment' property`)
          const newParsedOutputs = [...parsedOutputs]
          newParsedOutputs[index] = null
          setParsedOutputs(newParsedOutputs)
          return
        }

        if (typeof parsed.overallAssessment.fullySupported !== "boolean") {
          setError(
            `Output ${outputVersions[index].name} must have an 'overallAssessment.fullySupported' boolean property`,
          )
          const newParsedOutputs = [...parsedOutputs]
          newParsedOutputs[index] = null
          setParsedOutputs(newParsedOutputs)
          return
        }

        if (typeof parsed.overallAssessment.unsupportedClaimsCount !== "number") {
          setError(
            `Output ${outputVersions[index].name} must have an 'overallAssessment.unsupportedClaimsCount' number property`,
          )
          const newParsedOutputs = [...parsedOutputs]
          newParsedOutputs[index] = null
          setParsedOutputs(newParsedOutputs)
          return
        }

        // Validate each claim
        for (let i = 0; i < parsed.claims.length; i++) {
          const claim = parsed.claims[i]
          if (!claim.text) {
            setError(`Claim at index ${i} in output ${outputVersions[index].name} is missing the 'text' property`)
            const newParsedOutputs = [...parsedOutputs]
            newParsedOutputs[index] = null
            setParsedOutputs(newParsedOutputs)
            return
          }

          if (typeof claim.supported !== "boolean") {
            setError(
              `Claim at index ${i} in output ${outputVersions[index].name} is missing the 'supported' boolean property`,
            )
            const newParsedOutputs = [...parsedOutputs]
            newParsedOutputs[index] = null
            setParsedOutputs(newParsedOutputs)
            return
          }

          if (claim.supported && (!claim.supportingEvidence || !Array.isArray(claim.supportingEvidence))) {
            setError(
              `Supported claim at index ${i} in output ${outputVersions[index].name} is missing the 'supportingEvidence' array`,
            )
            const newParsedOutputs = [...parsedOutputs]
            newParsedOutputs[index] = null
            setParsedOutputs(newParsedOutputs)
            return
          }

          if (!claim.supported && !claim.reason) {
            setError(
              `Unsupported claim at index ${i} in output ${outputVersions[index].name} is missing the 'reason' property`,
            )
            const newParsedOutputs = [...parsedOutputs]
            newParsedOutputs[index] = null
            setParsedOutputs(newParsedOutputs)
            return
          }
        }

        const newParsedOutputs = [...parsedOutputs]
        newParsedOutputs[index] = parsed
        setParsedOutputs(newParsedOutputs)
      } else {
        const newParsedOutputs = [...parsedOutputs]
        newParsedOutputs[index] = null
        setParsedOutputs(newParsedOutputs)
      }
    } catch (e) {
      setError(`Invalid JSON in ${outputVersions[index].name}: ${(e as Error).message}`)
      const newParsedOutputs = [...parsedOutputs]
      newParsedOutputs[index] = null
      setParsedOutputs(newParsedOutputs)
    }
  }

  const addOutputVersion = () => {
    setOutputVersions([...outputVersions, { name: `Version ${outputVersions.length + 1}`, data: "" }])
    setParsedOutputs([...parsedOutputs, null])
  }

  const removeOutputVersion = (index: number) => {
    if (outputVersions.length > 1) {
      const newOutputs = outputVersions.filter((_, i) => i !== index)
      setOutputVersions(newOutputs)

      const newParsedOutputs = parsedOutputs.filter((_, i) => i !== index)
      setParsedOutputs(newParsedOutputs)
    }
  }

  const renameOutputVersion = (index: number, newName: string) => {
    const newOutputs = [...outputVersions]
    newOutputs[index].name = newName
    setOutputVersions(newOutputs)
  }

  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Clinical Evidence Review Tool</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {activeTab === "input" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>JSON Structure Validator</CardTitle>
            <CardDescription>Check your JSON against the expected structure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Expected Input Structure:</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto">
                  {`{
  "letter": "string",
  "annotations": [
    {
      "quote": "string",
      "appendix": [
        {
          "type": "string",
          "timestamp": "string",
          "id": "string",
          "resultLabel": "string",
          "result": "string",
          "reasoning": "string"
        }
      ]
    }
  ]
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Expected Output Structure:</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto">
                  {`{
  "claims": [
    {
      "text": "string",
      "supported": true,
      "supportingEvidence": ["string"]
    },
    {
      "text": "string",
      "supported": false,
      "reason": "string"
    }
  ],
  "overallAssessment": {
    "fullySupported": boolean,
    "unsupportedClaimsCount": number
  }
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Validation Status:</h3>
                <div className="p-3 rounded border">
                  {error ? (
                    <div className="text-red-500">{error}</div>
                  ) : (
                    <div className="text-green-500">
                      {parsedInput ? "Input JSON is valid ✓" : "No input provided yet"}
                      {parsedOutputs.some(Boolean)
                        ? ` | ${parsedOutputs.filter(Boolean).length} valid output version(s) ✓`
                        : " | No valid output versions yet"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="input">Input Data</TabsTrigger>
          <TabsTrigger value="annotations">Annotations</TabsTrigger>
          <TabsTrigger value="review">Review Analysis</TabsTrigger>
          <TabsTrigger value="compare">Compare Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Input Data</CardTitle>
              <CardDescription>Paste your input JSON containing the letter and annotations</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your input JSON here..."
                className="font-mono h-80"
                value={inputData}
                onChange={(e) => handleInputChange(e.target.value)}
              />
            </CardContent>
          </Card>

          {outputVersions.map((version, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">
                    <input
                      type="text"
                      value={version.name}
                      onChange={(e) => renameOutputVersion(index, e.target.value)}
                      className="bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-primary"
                    />
                  </CardTitle>
                  <CardDescription>Paste the output JSON for this analysis version</CardDescription>
                </div>
                {outputVersions.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeOutputVersion(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste your output JSON here..."
                  className="font-mono h-60"
                  value={version.data}
                  onChange={(e) => handleOutputChange(index, e.target.value)}
                />
              </CardContent>
            </Card>
          ))}

          <Button onClick={addOutputVersion} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Another Output Version
          </Button>

          <DebugPanel
            inputData={inputData}
            outputData={outputVersions.map((v) => v.data)}
            parsedInput={parsedInput}
            parsedOutputs={parsedOutputs}
          />
        </TabsContent>

        <TabsContent value="annotations">
          {parsedInput && parsedInput.expected ? (
            <AnnotationsReview
              letter={parsedInput.expected.letter}
              annotations={parsedInput.expected.annotations}
              outputVersions={parsedOutputs.filter(Boolean)}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-10 text-muted-foreground">Please enter valid input data to review</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          {parsedInput && parsedInput.expected ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Letter with Claims</CardTitle>
                    <CardDescription>Review the letter with highlighted claims</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LetterView
                      letter={parsedInput.expected.letter}
                      annotations={parsedInput.expected.annotations}
                      outputVersions={parsedOutputs.filter(Boolean)}
                      selectedClaimIndex={selectedClaimIndex}
                      onSelectClaim={setSelectedClaimIndex}
                    />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Evidence Sources</CardTitle>
                    <CardDescription>Supporting evidence for the selected claim</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedClaimIndex !== null && parsedInput.expected.annotations[selectedClaimIndex] ? (
                      <EvidencePanel
                        evidence={parsedInput.expected.annotations[selectedClaimIndex].appendix}
                        outputVersions={parsedOutputs.filter(Boolean)}
                        claimIndex={selectedClaimIndex}
                      />
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">Select a claim to view its evidence</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-10 text-muted-foreground">Please enter valid input data to review</div>
              </CardContent>
            </Card>
          )}

          {parsedOutputs.some(Boolean) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parsedOutputs.filter(Boolean).map((output, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{outputVersions[parsedOutputs.indexOf(output)].name}</CardTitle>
                    <CardDescription>Overall assessment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Fully Supported:</span>
                        <Badge variant={output.overallAssessment.fullySupported ? "default" : "destructive"}>
                          {output.overallAssessment.fullySupported ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Unsupported Claims:</span>
                        <Badge
                          variant={output.overallAssessment.unsupportedClaimsCount > 0 ? "destructive" : "default"}
                        >
                          {output.overallAssessment.unsupportedClaimsCount}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compare">
          {parsedOutputs.filter(Boolean).length >= 2 ? (
            <ComparisonView
              outputVersions={outputVersions.filter((_, i) => parsedOutputs[i])}
              parsedOutputs={parsedOutputs.filter(Boolean)}
              parsedInput={parsedInput}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-10 text-muted-foreground">
                  Please enter at least two valid output versions to compare
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}
