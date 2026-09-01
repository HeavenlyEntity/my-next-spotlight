'use client'

import type { TextFieldClientProps } from 'payload'

import {
  Button,
  FieldLabel,
  TextInput,
  useField,
  useForm,
  useFormFields,
} from '@payloadcms/ui'
import React, { useCallback, useEffect } from 'react'

import { formatSlug } from './formatSlug'
import './index.scss'

type SlugComponentProps = {
  fieldToUse: string
  checkboxFieldPath: string
} & TextFieldClientProps

export const SlugComponent: React.FC<SlugComponentProps> = ({
  field,
  fieldToUse,
  checkboxFieldPath: checkboxFieldPathFromProps,
  path,
  readOnly,
}) => {
  const { label } = field

  // Resolve sibling field paths whether the slug lives at the top level or
  // inside a nested group/array row.
  const checkboxFieldPath = path?.includes('.')
    ? `${path.split('.').slice(0, -1).join('.')}.${checkboxFieldPathFromProps}`
    : checkboxFieldPathFromProps

  const { value, setValue } = useField<string>({ path: path || field.name })

  const { dispatchFields } = useForm()

  const checkboxValue = useFormFields(
    ([fields]) => fields[checkboxFieldPath]?.value as boolean
  )

  const targetFieldValue = useFormFields(
    ([fields]) => fields[fieldToUse]?.value as string
  )

  // While locked, mirror the source field (title/name) into the slug.
  // `setValue` from useField is ref-stable; `value` is deliberately NOT a dep
  // — including it would re-run this effect on its own writes.
  useEffect(() => {
    if (!checkboxValue) return

    setValue(targetFieldValue ? formatSlug(targetFieldValue) : '')
  }, [targetFieldValue, checkboxValue, setValue])

  const handleLock = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      dispatchFields({
        type: 'UPDATE',
        path: checkboxFieldPath,
        value: !checkboxValue,
      })
    },
    [checkboxValue, checkboxFieldPath, dispatchFields]
  )

  const readOnlyStyle: React.CSSProperties = readOnly
    ? { opacity: 0.4, pointerEvents: 'none' }
    : {}

  return (
    <div className="field-type slug-field-component">
      <div className="label-wrapper">
        <FieldLabel htmlFor={`field-${path}`} label={label} />

        <Button className="lock-button" buttonStyle="none" onClick={handleLock}>
          {checkboxValue ? 'Unlock' : 'Lock'}
        </Button>
      </div>

      <TextInput
        value={value}
        onChange={setValue}
        path={path || field.name}
        readOnly={Boolean(readOnly || checkboxValue)}
        style={readOnlyStyle}
      />
    </div>
  )
}
