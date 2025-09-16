import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl lg:text-6xl font-bold text-balance">Welcome to My Portfolio</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto text-pretty">
          Explore my latest projects and development work
        </p>
        <Button asChild size="lg">
          <Link href="/projects">View Projects</Link>
        </Button>
      </div>
    </main>
  )
}
