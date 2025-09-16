import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Github, Star } from "lucide-react"

interface Project {
  id: number
  title: string
  description: string
  image: string
  technologies: string[]
  category: string
  liveUrl: string
  githubUrl: string
  featured: boolean
}

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="group overflow-hidden bg-card border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="p-0 relative">
        {project.featured && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-accent text-accent-foreground">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={project.image || "/placeholder.svg"}
            alt={`${project.title} project screenshot`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="mb-2">
          <Badge variant="secondary" className="text-xs">
            {project.category}
          </Badge>
        </div>

        <h3 className="text-xl font-semibold mb-2 text-balance group-hover:text-primary transition-colors">
          {project.title}
        </h3>

        <p className="text-muted-foreground text-sm leading-relaxed mb-4 text-pretty">{project.description}</p>

        <div className="flex flex-wrap gap-1">
          {project.technologies.map((tech) => (
            <Badge key={tech} variant="outline" className="text-xs bg-muted/50 text-muted-foreground border-border">
              {tech}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-2">
        <Button asChild size="sm" className="flex-1">
          <Link href={project.liveUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Live Demo
          </Link>
        </Button>

        <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
          <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer">
            <Github className="w-4 h-4 mr-2" />
            Code
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
