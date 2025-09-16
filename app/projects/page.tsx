import type { Metadata } from "next"
import { ProjectsHeader } from "@/components/projects/projects-header"
import { ProjectsGrid } from "@/components/projects/projects-grid"
import { ProjectsFilters } from "@/components/projects/projects-filters"

export const metadata: Metadata = {
  title: "Projects | My Portfolio",
  description: "Explore my latest development projects and technical work",
}

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <ProjectsHeader />
        <ProjectsFilters />
        <ProjectsGrid />
      </div>
    </main>
  )
}
