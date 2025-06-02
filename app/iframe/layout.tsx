import type React from "react"
import type { Metadata } from "next"
import "../globals.css"

export const metadata: Metadata = {
  title: "Clinical Evidence Review - Iframe",
  description: "Annotation report viewer for Braintrust",
}

export default function IframeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background">{children}</body>
    </html>
  )
}
