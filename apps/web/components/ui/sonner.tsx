'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'rgba(17, 17, 20, 0.96)',
          '--normal-text': '#F9F9F7',
          '--normal-border': 'rgba(255, 255, 255, 0.12)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
