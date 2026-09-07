import { MachineNavigation } from '@/components/ai/MachineDocument'
export default function NotFound() {
  return (
    <>
      <MachineNavigation />
      <main id="machine-content">
        <h1>Document not found</h1>
        <p>This URL does not identify a published machine document.</p>
        <a href="/ai/home">Return to the index</a>
      </main>
    </>
  )
}
