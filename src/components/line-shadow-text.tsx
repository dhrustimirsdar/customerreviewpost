import * as React from "react"

interface LineShadowTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  shadowColor?: string;
}

export function LineShadowText({
  children,
  className = "",
  shadowColor = "white",
  ...props
}: LineShadowTextProps) {
  return (
    <span
      className={`relative inline-block ${className}`}
      style={{
        textShadow: `0 0 20px ${shadowColor}, 0 0 40px ${shadowColor}40`
      }}
      {...props}
    >
      {children}
    </span>
  )
}
