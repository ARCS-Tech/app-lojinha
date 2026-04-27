declare module 'react-simple-maps' {
  import { ComponentType, ReactNode, CSSProperties } from 'react'

  interface ProjectionConfig {
    scale?: number
    center?: [number, number]
    rotate?: [number, number, number]
    parallels?: [number, number]
  }

  interface ComposableMapProps {
    projection?: string
    projectionConfig?: ProjectionConfig
    width?: number
    height?: number
    className?: string
    children?: ReactNode
  }

  interface Geography {
    rsmKey: string
    id: string
    properties: Record<string, unknown>
    geometry: unknown
  }

  interface GeographiesChildProps {
    geographies: Geography[]
  }

  interface GeographiesProps {
    geography: string | object
    children: (props: GeographiesChildProps) => ReactNode
  }

  interface GeographyProps {
    geography: Geography
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: CSSProperties & { outline?: string }
      hover?: CSSProperties & { outline?: string; opacity?: number }
      pressed?: CSSProperties & { outline?: string }
    }
    key?: string
    className?: string
    onClick?: (event: React.MouseEvent) => void
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
}
