import { ProjectCard } from "./project-card"

// Mock project data - in a real app, this would come from a CMS or API
const projects = [
  {
    id: 1,
    title: "E-Commerce Platform",
    description:
      "A full-stack e-commerce solution built with Next.js, featuring real-time inventory management and secure payment processing.",
    image: "/modern-ecommerce-interface.png",
    technologies: ["Next.js", "TypeScript", "Stripe", "PostgreSQL"],
    category: "Full Stack",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/example",
    featured: true,
  },
  {
    id: 2,
    title: "Task Management App",
    description:
      "A collaborative task management application with real-time updates, drag-and-drop functionality, and team collaboration features.",
    image: "/task-management-dashboard.png",
    technologies: ["React", "Node.js", "Socket.io", "MongoDB"],
    category: "Web Development",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/example",
    featured: false,
  },
  {
    id: 3,
    title: "AI Content Generator",
    description:
      "An AI-powered content generation tool that helps users create blog posts, social media content, and marketing copy.",
    image: "/ai-content-generation-interface.jpg",
    technologies: ["Python", "OpenAI API", "FastAPI", "React"],
    category: "AI/ML",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/example",
    featured: true,
  },
  {
    id: 4,
    title: "Mobile Fitness Tracker",
    description:
      "A React Native mobile app for tracking workouts, nutrition, and fitness goals with social sharing capabilities.",
    image: "/fitness-tracking-app.png",
    technologies: ["React Native", "Expo", "Firebase", "Redux"],
    category: "Mobile Apps",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/example",
    featured: false,
  },
  {
    id: 5,
    title: "Portfolio Website",
    description:
      "A responsive portfolio website showcasing creative work with smooth animations and optimized performance.",
    image: "/creative-portfolio-website.png",
    technologies: ["Next.js", "Tailwind CSS", "Framer Motion", "Vercel"],
    category: "Frontend",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/example",
    featured: false,
  },
  {
    id: 6,
    title: "API Gateway Service",
    description:
      "A scalable API gateway built with microservices architecture, featuring rate limiting, authentication, and monitoring.",
    image: "/api-gateway-architecture-diagram.jpg",
    technologies: ["Node.js", "Docker", "Redis", "PostgreSQL"],
    category: "Backend",
    liveUrl: "https://example.com",
    githubUrl: "https://github.com/example",
    featured: false,
  },
]

export function ProjectsGrid() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </section>
  )
}
