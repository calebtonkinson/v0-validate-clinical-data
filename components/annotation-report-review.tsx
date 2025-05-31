"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Quote,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Activity,
  Camera,
  MessageSquare,
  Pill,
  HelpCircle,
  Stethoscope,
  Replace,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { AnnotationReportLetterView } from "./annotation-report-letter-view"

interface AppendixCitation {
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
}

interface AnnotationSnippet {
  quote: string
  type: "quote" | "statement"
  category: "lab" | "vital" | "imaging" | "cdi_query" | "note" | "med" | "other"
  evidence: AppendixCitation[]
  supportRating: "strong" | "partial" | "none"
  replacement?: {
    currentText: string
    replacementText: string
    justification: string
  }
}

interface AnnotationReportReviewProps {
  letter: string
  snippets: AnnotationSnippet[]
}

export function AnnotationReportReview({ letter, snippets }: AnnotationReportReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedSnippetIndex, setSelectedSnippetIndex] = useState<number | null>(null)

  const goToNext = () => {
    if (currentIndex < snippets.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToSnippet = (index: number) => {
    if (index >= 0 && index < snippets.length) {
      setCurrentIndex(index)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "lab":
        return <FileText className="h-4 w-4" />
      case "vital":
        return <Activity className="h-4 w-4" />
      case "imaging":
        return <Camera className="h-4 w-4" />
      case "cdi_query":
        return <MessageSquare className="h-4 w-4" />
      case "note":
        return <Stethoscope className="h-4 w-4" />
      case "med":
        return <Pill className="h-4 w-4" />
      default:
        return <HelpCircle className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "lab":
        return "bg-blue-100 dark:bg-blue-900/30 border-blue-300 text-blue-700 dark:text-blue-300"
      case "vital":
        return "bg-green-100 dark:bg-green-900/30 border-green-300 text-green-700 dark:text-green-300"
      case "imaging":
        return "bg-purple-100 dark:bg-purple-900/30 border-purple-300 text-purple-700 dark:text-purple-300"
      case "cdi_query":
        return "bg-orange-100 dark:bg-orange-900/30 border-orange-300 text-orange-700 dark:text-orange-300"
      case "note":
        return "bg-gray-100 dark:bg-gray-900/30 border-gray-300 text-gray-700 dark:text-gray-300"
      case "med":
        return "bg-red-100 dark:bg-red-900/30 border-red-300 text-red-700 dark:text-red-300"
      default:
        return "bg-gray-100 dark:bg-gray-900/30 border-gray-300 text-gray-700 dark:text-gray-300"
    }
  }

  const getSupportRatingBadge = (rating: string) => {
    switch (rating) {
      case "strong":
        return (
          <Badge className="bg-green-100 dark:bg-green-900/30 border-green-300 text-green-700 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" /> Strong Support
          </Badge>
        )
      case "partial":
        return (
          <Badge className="bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 text-yellow-700 dark:text-yellow-300">
            <AlertCircle className="h-3 w-3 mr-1" /> Partial Support
          </Badge>
        )
      case "none":
        return (
          <Badge className="bg-red-100 dark:bg-red-900/30 border-red-300 text-red-700 dark:text-red-300">
            <XCircle className="h-3 w-3 mr-1" /> No Support
          </Badge>
        )
      default:
        return null
    }
  }

  const getTypeIcon = (type: string) => {
    return type === "quote" ? <Quote className="h-3 w-3" /> : <FileText className="h-3 w-3" />
  }

  // Get summary statistics
  const getSummaryStats = () => {
    const categoryCount = snippets.reduce(
      (acc, snippet) => {
        acc[snippet.category] = (acc[snippet.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const supportCount = snippets.reduce(
      (acc, snippet) => {
        acc[snippet.supportRating] = (acc[snippet.supportRating] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const replacementCount = snippets.filter((s) => s.replacement).length

    return { categoryCount, supportCount, replacementCount }
  }

  const currentSnippet = snippets[currentIndex]
  const stats = getSummaryStats()

  if (!currentSnippet) {
    return <div>No snippets available</div>
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="letter">Letter View</TabsTrigger>
          <TabsTrigger value="review">Review Snippets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Snippets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{snippets.length}</div>
                <p className="text-sm text-muted-foreground">annotations to review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Support Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Strong:</span>
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30">
                      {stats.supportCount.strong || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Partial:</span>
                    <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30">
                      {stats.supportCount.partial || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">None:</span>
                    <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30">
                      {stats.supportCount.none || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.categoryCount).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <span className="text-sm capitalize">{category}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Replacements Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.replacementCount}</div>
                <p className="text-sm text-muted-foreground">snippets have suggested replacements</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="letter">
          <AnnotationReportLetterView
            letter={letter}
            snippets={snippets}
            selectedSnippetIndex={selectedSnippetIndex}
            onSelectSnippet={setSelectedSnippetIndex}
          />
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle>Snippet Review</CardTitle>
                    <CardDescription>
                      Reviewing snippet {currentIndex + 1} of {snippets.length}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getCategoryColor(currentSnippet.category)}>
                      {getCategoryIcon(currentSnippet.category)}
                      <span className="ml-1 capitalize">{currentSnippet.category}</span>
                    </Badge>
                    {getSupportRatingBadge(currentSnippet.supportRating)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    title="Previous snippet"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNext}
                    disabled={currentIndex === snippets.length - 1}
                    title="Next snippet"
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
                    {getTypeIcon(currentSnippet.type)}
                    <span className="ml-2 capitalize">{currentSnippet.type}</span>
                  </h3>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium">"{currentSnippet.quote}"</p>
                    </CardContent>
                  </Card>
                </div>

                {currentSnippet.replacement && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <Replace className="h-4 w-4 mr-2" /> Suggested Replacement
                    </h3>
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Current text:</p>
                            <p className="text-sm line-through text-gray-500">
                              "{currentSnippet.replacement.currentText}"
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Replacement text:</p>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              "{currentSnippet.replacement.replacementText}"
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Justification:</p>
                            <p className="text-sm italic text-gray-700 dark:text-gray-300">
                              {currentSnippet.replacement.justification}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium mb-2">Supporting Evidence ({currentSnippet.evidence.length})</h3>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {currentSnippet.evidence.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                          No evidence available for this snippet
                        </div>
                      ) : (
                        currentSnippet.evidence.map((evidence, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">{evidence.type}</h4>
                                  {evidence.id && <Badge variant="outline">{evidence.id}</Badge>}
                                </div>

                                {!evidence.hideTimestamp && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(evidence.timestamp).toLocaleString()}
                                    {evidence.timezone && <span className="ml-1">({evidence.timezone})</span>}
                                  </div>
                                )}

                                <Separator />

                                {!evidence.hideResult && (
                                  <div>
                                    <h5 className="text-xs font-medium mb-1">{evidence.resultLabel || "Result:"}</h5>
                                    <div className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                                      {evidence.result}
                                    </div>
                                  </div>
                                )}

                                {evidence.reasoning && (
                                  <div>
                                    <h5 className="text-xs font-medium mb-1">Reasoning:</h5>
                                    <div className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                                      {evidence.reasoning}
                                    </div>
                                  </div>
                                )}

                                {evidence.reference && (
                                  <div>
                                    <h5 className="text-xs font-medium mb-1">Reference:</h5>
                                    <div className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                                      {evidence.reference}
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
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="w-full flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {currentSnippet.evidence.length} evidence items for this snippet
                </div>
                <div className="flex items-center space-x-1">
                  {snippets.map((snippet, index) => (
                    <Button
                      key={index}
                      variant={index === currentIndex ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => goToSnippet(index)}
                      title={`Snippet ${index + 1}: ${snippet.quote.substring(0, 50)}...`}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
