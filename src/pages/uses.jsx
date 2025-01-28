import Head from 'next/head'

import { Card } from '@/components/Card'
import { Section } from '@/components/Section'
import { SimpleLayout } from '@/components/SimpleLayout'

function ToolsSection({ children, ...props }) {
  return (
    <Section {...props}>
      <ul role="list" className="space-y-16">
        {children}
      </ul>
    </Section>
  )
}

function Tool({ title, href, children }) {
  return (
    <Card as="li">
      <Card.Title as="h3" href={href}>
        {title}
      </Card.Title>
      <Card.Description>{children}</Card.Description>
    </Card>
  )
}

export default function Uses() {
  return (
    <>
      <Head>
        <title>Uses - Alec Mingione</title>
        <meta
          name="description"
          content="Software I use, gadgets I love, and other things I recommend."
        />
      </Head>
      <SimpleLayout
        title="Software I use, gadgets I love, and other things I recommend."
        intro="I get asked a lot about the things I use to build software, stay productive, or buy to fool myself into thinking I’m being productive when I’m really just procrastinating. Here’s a big list of all of my favorite stuff."
      >
        <div className="space-y-20">
          <ToolsSection title="Workstation">
            <Tool title="Macbook Pro 16&apos; Max, 64GB RAM">
              The best laptop for the job. I use this for everything from coding, to video editing, to rendering models to training mini AI models.
            </Tool>
            <Tool title="Samsung Odessey Neo G9">
              The best display for multi-tasking, video editing, designing, and all else you can split for your processes that&#39;s
              bigger than 27”. When you’re working to create masterpieces, every
              pixel you can get counts.
            </Tool>
            <Tool title="SteelSeries APEX Pro">
              They don’t make keyboards the way they used to. I buy these any
              time I see them go up for sale and keep them in storage in case I
              need parts or need to retire my main.
            </Tool>
            <Tool title="Secret Lab - Titan">
              If I’m going to slouch in the worst ergonomic position imaginable
              all day, I might as well do it in an expensive chair.
            </Tool>
          </ToolsSection>
          <ToolsSection title="Development tools">
            <Tool title="WebStorm">
              Its like a bag full of all the power-tools I need to build a house without all the weight. I get everything I need in one place.
            </Tool>
            <Tool title="IDEA Ultimate">
              The C#, Java, C++ stuff I use to create cool stuff in all kinds of environments. Games, APIs, programmed graphic animations, and more neat stuff.
              I typically follow it with Shadron to render the graphic bits of my code.
            </Tool>
            <Tool title="TablePlus">
              Great software for working with databases. Has saved me from
              building about a thousand admin interfaces for my various projects
              over the years.
            </Tool>
          </ToolsSection>
          <ToolsSection title="Design">
            <Tool title="Figma">
              We started using Figma as just a design tool but now it’s become
              our virtual whiteboard for the entire company. Never would have
              expected the collaboration features to be the real hook.
            </Tool>
          </ToolsSection>
          <ToolsSection title="Productivity">
            <Tool title="Rize">
              If you find yourself not knowing when to take a break because everything is so interstellar.
              This is the definition of time management and productivity. The past few years this has helped train my instincts to time,
              and how just a short break can solve your current problem(s).
            </Tool>
            <Tool title="Jira">
              Its been around for a while. The classic KANBAN board which I love for any project to organize the priority of tasks and bugs.
            </Tool>
            <Tool title="Stashpad">
              Using a daily notes system instead of trying to keep things
              organized by topics has been super powerful for me. And with
              Stashpad, it’s still easy for me to keep all of that stuff
              discoverable by topic even though all of my writing happens in bucket.
            </Tool>
            <Tool title="TidyCal">
              Great tool for scheduling meetings while protecting my calendar
              and making sure I still have lots of time for deep work during the
              week.
            </Tool>
            <Tool title="Focus">
              Simple tool for blocking distracting websites when I need to just
              do the work and get some momentum going.
            </Tool>
          </ToolsSection>
        </div>
      </SimpleLayout>
    </>
  )
}
