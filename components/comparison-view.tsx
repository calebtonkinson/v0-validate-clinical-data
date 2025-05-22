"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CheckCircle, XCircle, ChevronDown, ChevronRight, Clock } from "lucide-react"

interface ComparisonViewProps {
  outputVersions: Array<{ name: string; data: string }>
  parsedOutputs: any[]
  parsedInput: any
}

export function ComparisonView({ outputVersions, parsedOutputs, parsedInput }: ComparisonViewProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [expandedEvidenceMap, setExpandedEvidenceMap] = useState<Record<string, boolean>>({})

  // Calculate agreement percentage between versions
  const calculateAgreement = () => {
    if (parsedOutputs.length < 2) return 0

    const totalClaims = parsedOutputs[0].claims.length
    let agreementCount = 0

    for (let i = 0; i < totalClaims; i++) {
      const allSupported = parsedOutputs.every((output) => output.claims[i].supported)
      const allUnsupported = parsedOutputs.every((output) => !output.claims[i].supported)

      if (allSupported || allUnsupported) {
        agreementCount++
      }
    }

    return Math.round((agreementCount / totalClaims) * 100)
  }

  // Find claims with disagreement
  const findDisagreements = () => {
    if (parsedOutputs.length < 2) return []

    const disagreements = []

    for (let i = 0; i < parsedOutputs[0].claims.length; i++) {
      const allSame = parsedOutputs.every(
        (output) => output.claims[i].supported === parsedOutputs[0].claims[i].supported,
      )

      if (!allSame) {
        disagreements.push({
          claimIndex: i,
          text: parsedOutputs[0].claims[i].text,
          assessments: parsedOutputs.map((output) => ({
            supported: output.claims[i].supported,
            reason: output.claims[i].supported ? null : output.claims[i].reason,
            evidence: output.claims[i].supported ? output.claims[i].supportingEvidence : [],
          })),
        })
      }
    }

    return disagreements
  }

  // Find evidence details by ID
  const findEvidenceById = (evidenceId: string) => {
    if (!parsedInput || !parsedInput.expected || !parsedInput.expected.annotations) return null

    for (const annotation of parsedInput.expected.annotations) {
      if (!annotation.appendix) continue

      for (const evidence of annotation.appendix) {
        if (evidence.id === evidenceId) {
          return evidence
        }
      }
    }

    return null
  }

  const toggleEvidence = (claimIndex: number, versionIndex: number, evidenceId: string) => {
    const key = `${claimIndex}-${versionIndex}-${evidenceId}`
    setExpandedEvidenceMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const isEvidenceExpanded = (claimIndex: number, versionIndex: number, evidenceId: string) => {
    const key = `${claimIndex}-${versionIndex}-${evidenceId}`
    return !!expandedEvidenceMap[key]
  }

  const disagreements = findDisagreements()
  const agreementPercentage = calculateAgreement()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comparison Summary</CardTitle>
          <CardDescription>Analysis of agreement between different versions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Agreement</h3>
              <div className="text-3xl font-bold">{agreementPercentage}%</div>
              <p className="text-sm text-muted-foreground">of claims have the same assessment across all versions</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Disagreements</h3>
              <div className="text-3xl font-bold">{disagreements.length}</div>
              <p className="text-sm text-muted-foreground">claims have different assessments between versions</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Versions Compared</h3>
              <div className="text-3xl font-bold">{parsedOutputs.length}</div>
              <p className="text-sm text-muted-foreground">different analysis versions being compared</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="disagreements">Disagreements</TabsTrigger>
          <TabsTrigger value="all-claims">All Claims</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Overall Assessment Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Fully Supported</TableHead>
                    <TableHead>Unsupported Claims</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedOutputs.map((output, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{outputVersions[index].name}</TableCell>
                      <TableCell>
                        <Badge variant={output.overallAssessment.fullySupported ? "default" : "destructive"}>
                          {output.overallAssessment.fullySupported ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>{output.overallAssessment.unsupportedClaimsCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disagreements">
          <Card>
            <CardHeader>
              <CardTitle>Claims with Disagreements</CardTitle>
              <CardDescription>These claims have different assessments across versions</CardDescription>
            </CardHeader>
            <CardContent>
              {disagreements.length > 0 ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-6">
                    {disagreements.map((disagreement, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="mb-3">
                          <Badge variant="outline" className="mb-2">
                            Claim {disagreement.claimIndex + 1}
                          </Badge>
                          <p className="text-sm font-medium">"{disagreement.text}"</p>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Version</TableHead>
                              <TableHead>Assessment</TableHead>
                              <TableHead>Reason / Evidence</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {disagreement.assessments.map((assessment, vIndex) => (
                              <TableRow key={vIndex}>
                                <TableCell>{outputVersions[vIndex].name}</TableCell>
                                <TableCell>
                                  <Badge variant={assessment.supported ? "default" : "destructive"}>
                                    {assessment.supported ? (
                                      <>
                                        <CheckCircle className="h-3 w-3 mr-1" /> Supported
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-3 w-3 mr-1" /> Unsupported
                                      </>
                                    )}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {assessment.supported ? (
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap gap-1">
                                        {assessment.evidence.map((evidenceId: string, eIndex: number) => {
                                          const evidence = findEvidenceById(evidenceId)
                                          return (
                                            <div key={eIndex} className="w-full">
                                              <Collapsible>
                                                <CollapsibleTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full justify-between mb-1"
                                                    onClick={() =>
                                                      toggleEvidence(disagreement.claimIndex, vIndex, evidenceId)
                                                    }
                                                  >
                                                    <span className="flex items-center">
                                                      <Badge variant="outline" className="mr-2">
                                                        {evidenceId}
                                                      </Badge>
                                                      {evidence?.type || "Unknown Evidence"}
                                                    </span>
                                                    {isEvidenceExpanded(disagreement.claimIndex, vIndex, evidenceId) ? (
                                                      <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                      <ChevronRight className="h-4 w-4" />
                                                    )}
                                                  </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                  {evidence ? (
                                                    <div className="border rounded-md p-3 mb-3 bg-gray-50 dark:bg-gray-800 text-sm">
                                                      <div className="flex items-center text-xs text-muted-foreground mb-2">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {new Date(evidence.timestamp).toLocaleString()}
                                                      </div>

                                                      <div className="mb-2">
                                                        <h4 className="text-xs font-medium mb-1">
                                                          {evidence.resultLabel}
                                                        </h4>
                                                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded border">
                                                          {evidence.result}
                                                        </div>
                                                      </div>

                                                      <div>
                                                        <h4 className="text-xs font-medium mb-1">Reasoning:</h4>
                                                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded border">
                                                          {evidence.reasoning}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="border rounded-md p-3 mb-3 bg-gray-50 dark:bg-gray-800 text-sm">
                                                      Evidence details not found
                                                    </div>
                                                  )}
                                                </CollapsibleContent>
                                              </Collapsible>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm">{assessment.reason}</p>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-10 text-muted-foreground">No disagreements found between versions</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-claims">
          <Card>
            <CardHeader>
              <CardTitle>All Claims Comparison</CardTitle>
              <CardDescription>Complete comparison of all claims across versions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Claim</TableHead>
                      <TableHead>Text</TableHead>
                      {parsedOutputs.map((_, index) => (
                        <TableHead key={index}>{outputVersions[index].name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedInput &&
                      parsedInput.expected.annotations.map((annotation: any, index: number) => (
                        <TableRow
                          key={index}
                          className={
                            disagreements.some((d) => d.claimIndex === index)
                              ? "bg-yellow-50 dark:bg-yellow-900/20"
                              : ""
                          }
                        >
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="max-w-[300px] truncate" title={annotation.quote}>
                            {annotation.quote}
                          </TableCell>
                          {parsedOutputs.map((output, vIndex) => (
                            <TableCell key={vIndex}>
                              <Badge variant={output.claims[index].supported ? "default" : "destructive"}>
                                {output.claims[index].supported ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" /> Supported
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" /> Unsupported
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
