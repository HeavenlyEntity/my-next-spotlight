import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')

export type ContactSubmission = {
  name: string
  email: string
  subject?: string
  message: string
}

export async function sendContactEmails(
  submission: ContactSubmission
): Promise<void> {
  const from = process.env.RESEND_FROM || 'Amware <hello@amware.dev>'
  const notifyTo = process.env.CONTACT_NOTIFY_TO

  if (notifyTo) {
    await resend.emails.send({
      from,
      to: notifyTo,
      replyTo: submission.email,
      subject: `New contact submission: ${
        submission.subject || '(no subject)'
      }`,
      text: `Name: ${submission.name}\nEmail: ${submission.email}\n\n${submission.message}`,
    })
  }

  await resend.emails.send({
    from,
    to: submission.email,
    subject: 'Thanks for reaching out',
    text: `Hi ${submission.name},\n\nThanks for getting in touch — I received your message and will get back to you soon.\n\n— Alec`,
  })
}
