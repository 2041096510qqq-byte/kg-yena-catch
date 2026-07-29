import type { ButtonHTMLAttributes } from 'react'
import './ImageButton.less'

interface ImageButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  src: string
  label: string
}

export function ImageButton({ src, label, className = '', ...props }: ImageButtonProps) {
  return (
    <button
      type="button"
      className={`image-button ${className}`.trim()}
      {...props}
      aria-label={label}
    >
      <img src={src} alt="" draggable={false} />
    </button>
  )
}
