import type { Metadata, Viewport } from "next"
import "@/styles/globals.css"
import ReactQueryProvider from "@/components/providers/ReactQueryProvider"

export const metadata: Metadata = {
  title: "WordMash Battle",
  description: "Random Word Challenge - Create stories, practice English, have fun!",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json"
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#8B5CF6"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  )
}