/* amw brand language layered onto the template's section headers: the
   numbered terminal eyebrow that the rest of the site uses. */

export function SectionEyebrow({ index, label, className = '' }) {
  return (
    <p className={`amw-eyebrow mb-4 ${className}`}>
      <span aria-hidden="true">{`// SEC.${index} / `}</span>
      {label}
    </p>
  )
}
