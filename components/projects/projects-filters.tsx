"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

const categories = ["All", "Web Development", "Mobile Apps", "Full Stack", "Frontend", "Backend", "AI/ML"]

export function ProjectsFilters() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="mb-8 space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border focus:ring-primary/20"
          aria-label="Search projects"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={activeCategory === category ? "default" : "secondary"}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
              activeCategory === category
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            onClick={() => setActiveCategory(category)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setActiveCategory(category)
              }
            }}
          >
            {category}
          </Badge>
        ))}
      </div>
    </div>
  )
}
