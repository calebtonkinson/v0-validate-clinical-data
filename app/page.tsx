"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { AnnotationReportReview } from "@/components/annotation-report-review"
import { AnnotationReportInput } from "@/components/annotation-report-input"

export default function Home() {
  const [activeTab, setActiveTab] = useState("input")
  const [annotationReportData, setAnnotationReportData] = useState<any>(null)

  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Clinical Evidence Review Tool</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="input">Input Data</TabsTrigger>
          <TabsTrigger value="review">Review Annotations</TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <AnnotationReportInput onDataChange={setAnnotationReportData} />
        </TabsContent>

        <TabsContent value="review">
          {annotationReportData && annotationReportData.snippets && annotationReportData.letter ? (
            <AnnotationReportReview letter={annotationReportData.letter} snippets={annotationReportData.snippets} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-10 text-muted-foreground">
                  Please enter valid annotation report data with both letter and snippets to review
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}
