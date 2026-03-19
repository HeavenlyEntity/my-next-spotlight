import Head from 'next/head'
import { SimpleLayout } from '@/components/SimpleLayout'

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact - Alec Mingione</title>
        <meta
          name="description"
          content="Have a question or proposal? Use the form to get in touch."
        />
      </Head>

      <SimpleLayout
        title="Get in touch"
        intro="Have a question, proposal, or just want to say hello? Fill out the form below and I'll get back to you."
      >
        <div className="relative h-[calc(100vh-400px)] min-h-[600px] w-full overflow-hidden rounded-3xl ring-1 ring-zinc-200 dark:ring-zinc-700">
          <div className="df-grid-overlay" />
          <iframe
            src="https://share.deftform.com/eCcVtS"
            className="h-full w-full border-0 bg-transparent"
            title="Contact Form"
            loading="lazy"
          />
        </div>
      </SimpleLayout>
    </>
  )
}
