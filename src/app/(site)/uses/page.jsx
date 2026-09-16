import { withSocialImage } from '@/lib/social/metadata'
import { ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/Card'
import { Section } from '@/components/Section'
import { SimpleLayout } from '@/components/SimpleLayout'

export const metadata = withSocialImage(
  {
    title: 'Uses',
    description:
      'Software I use, gadgets I love, and other things I recommend.',
  },
  'uses'
)

function ToolsSection({ children, ...props }) {
  return (
    <Section {...props}>
      <ul role="list" className="space-y-16">
        {children}
      </ul>
    </Section>
  )
}

function Tool({ title, href, affiliate = false, children }) {
  return (
    <Card as="li">
      <Card.Title
        as="h3"
        href={href}
        {...(href
          ? {
              target: '_blank',
              rel: affiliate
                ? 'sponsored noopener noreferrer'
                : 'noopener noreferrer',
            }
          : {})}
      >
        <span className="inline-flex items-center gap-1">
          {title}
          {href ? (
            <ArrowUpRight
              className="h-3.5 w-3.5 text-zinc-400 transition-colors group-hover:text-teal-500 dark:text-zinc-500"
              aria-hidden="true"
            />
          ) : null}
        </span>
      </Card.Title>
      <Card.Description>{children}</Card.Description>
    </Card>
  )
}

export default function Uses() {
  return (
    <SimpleLayout
      title="Software I use, gadgets I love, and other things I recommend."
      intro="I get asked a lot about the things I use to build software, stay productive, or buy to fool myself into thinking I'm being productive when I'm really just procrastinating. Here's a big list of all of my favorite stuff. Some links are affiliate: I may earn a commission if you buy through them, at no extra cost to you."
    >
      <div className="space-y-20">
        <ToolsSection title="Workstation">
          <Tool title="Macbook Pro 16' Max, 64GB RAM">
            The best laptop for the job. I use this for everything from coding,
            to video editing, to rendering models to training mini AI models.
          </Tool>
          <Tool title="Samsung Odessey Neo G9">
            The best display for multi-tasking, video editing, designing, and
            all else you can split for your processes that&#39;s bigger than
            27&quot;. When you&apos;re working to create masterpieces, every
            pixel you can get counts.
          </Tool>
          <Tool title="SteelSeries APEX Pro">
            They don&apos;t make keyboards the way they used to. I buy these any
            time I see them go up for sale and keep them in storage in case I
            need parts or need to retire my main.
          </Tool>
          <Tool title="Secret Lab - Titan">
            If I&apos;m going to slouch in the worst ergonomic position
            imaginable all day, I might as well do it in an expensive chair.
          </Tool>
        </ToolsSection>
        <ToolsSection title="Development tools">
          <Tool title="WebStorm">
            Its like a bag full of all the power-tools I need to build a house
            without all the weight. I get everything I need in one place.
          </Tool>
          <Tool title="IDEA Ultimate">
            The C#, Java, C++ stuff I use to create cool stuff in all kinds of
            environments. Games, APIs, programmed graphic animations, and more
            neat stuff. I typically follow it with Shadron to render the graphic
            bits of my code.
          </Tool>
          <Tool title="TablePlus">
            Great software for working with databases. Has saved me from
            building about a thousand admin interfaces for my various projects
            over the years.
          </Tool>
        </ToolsSection>
        <ToolsSection title="Design">
          <Tool title="Figma">
            We started using Figma as just a design tool but now it&apos;s
            become our virtual whiteboard for the entire company. Never would
            have expected the collaboration features to be the real hook.
          </Tool>
        </ToolsSection>
        <ToolsSection title="Productivity">
          <Tool title="Rize" href="https://pxllnk.co/rize" affiliate>
            If you find yourself not knowing when to take a break because
            everything is so interstellar. This is the definition of time
            management and productivity. The past few years this has helped
            train my instincts to time, and how just a short break can solve
            your current problem(s).
          </Tool>
          <Tool title="Blitzit" href="https://pxllnk.co/blitzit" affiliate>
            The board I actually keep open. Tasks, a pomodoro timer, and the
            day&apos;s focus in one place, without the ceremony of a full issue
            tracker.
          </Tool>
          <Tool title="Stashpad">
            Using a daily notes system instead of trying to keep things
            organized by topics has been super powerful for me. And with
            Stashpad, it&apos;s still easy for me to keep all of that stuff
            discoverable by topic even though all of my writing happens in
            bucket.
          </Tool>
          <Tool title="Roam HQ" href="https://pxllnk.co/roamware" affiliate>
            The room I take meetings in. It protects the calendar so I still
            have lots of time for deep work, and keeps the call, the notes, and
            the next action in one place.
          </Tool>
          <Tool title="Focus">
            Simple tool for blocking distracting websites when I need to just do
            the work and get some momentum going.
          </Tool>
        </ToolsSection>
        <ToolsSection title="Finance">
          <Tool
            title="Sequence"
            href="https://go.getsequence.io/landing/join-and-earn-75?code=DHPHD"
            affiliate
          >
            This is how I supercharged and automated my finances. Deposits route
            into pods for operating cash, taxes, and savings before I can spend
            them, so the money map runs without me babysitting transfers.
          </Tool>
        </ToolsSection>
      </div>
    </SimpleLayout>
  )
}
