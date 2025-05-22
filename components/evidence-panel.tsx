"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock } from "lucide-react"

interface EvidencePanelProps {
  evidence: Array<{
    type: string
    timestamp: string
    id: string
    resultLabel: string
    result: string
    reasoning: string
  }>
  outputVersions: any[]
  claimIndex: number
}

export function EvidencePanel({ evidence, outputVersions, claimIndex }: EvidencePanelProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  // Check if this evidence is used in any of the output versions
  const isEvidenceUsed = (evidenceId: string, versionIndex: number) => {
    const output = outputVersions[versionIndex]
    const claim = output.claims[claimIndex]

    if (claim && claim.supported && claim.supportingEvidence) {
      return claim.supportingEvidence.includes(evidenceId)
    }

    return false
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-4">
        {evidence.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No evidence available for this claim</div>
        ) : (
          evidence.map((item, index) => (
            <Card key={index} className={expandedItems.includes(item.id) ? "border-primary" : ""}>
              <CardContent className="p-0">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => toggleItem(item.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{item.type}</h3>
                    <div className="flex items-center gap-2">
                      {outputVersions.map((_, versionIndex) => (
                        <Badge
                          key={versionIndex}
                          variant={isEvidenceUsed(item.id, versionIndex) ? "default" : "outline"}
                          className="text-xs"
                        >
                          {outputVersions[versionIndex].claims[claimIndex]?.supported ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {isEvidenceUsed(item.id, versionIndex) ? "Used" : "Not Used"}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground mb-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(item.timestamp).toLocaleString()}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {item.id}
                    </Badge>
                  </div>

                  {expandedItems.includes(item.id) && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <h4 className="text-xs font-medium mb-1">{item.resultLabel}</h4>
                        <div className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded border">{item.result}</div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium mb-1">Reasoning:</h4>
                        <div className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded border">{item.reasoning}</div>
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
  )
}
