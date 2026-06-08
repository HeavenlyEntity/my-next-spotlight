import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react'

type ContainerProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>

type ContainerComponent = ForwardRefExoticComponent<ContainerProps> & {
  Outer: ForwardRefExoticComponent<ContainerProps>
  Inner: ForwardRefExoticComponent<ContainerProps>
}

export declare const Container: ContainerComponent
