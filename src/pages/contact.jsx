import Head from 'next/head'
import Script from 'next/script'

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
      <Script src="https://cdn.deftform.com/embed.js" />

      <SimpleLayout
        title="Get in touch"
        intro="Have a question, proposal, or just want to say hello? Fill out the form below and I’ll get back to you."
      >
        <div className="relative w-full overflow-hidden rounded-3xl ring-1 ring-zinc-200 dark:ring-zinc-700">
          <div className="df-grid-overlay" />
          <div
            className="deftform w-full bg-transparent p-4 sm:p-8"
            data-form-id="eCcVtS"
            data-form-width="100%"
            data-form-align="center"
            data-form-auto-height="1"
          />
        </div>
        
      </SimpleLayout>
    </>
  )
}




