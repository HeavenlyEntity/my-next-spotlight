import { withSocialImage } from '@/lib/social/metadata'
import ProjectsContent from './ProjectsContent'

export const metadata = withSocialImage(
  {
    title: 'Projects',
    description: "Things I've made trying to put my dent in the universe.",
  },
  'projects'
)

export default function ProjectsPage() {
  return <ProjectsContent />
}
