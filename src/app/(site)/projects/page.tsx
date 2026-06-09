import type { Metadata } from 'next'
import ProjectsContent from './ProjectsContent'

export const metadata: Metadata = {
  title: 'Projects',
  description: "Things I've made trying to put my dent in the universe.",
}

export default function ProjectsPage() {
  return <ProjectsContent />
}
