import { ReactNode } from "react"

interface PoliciesLayoutProps {
  children: ReactNode
}

export default function PoliciesLayout({ children }: PoliciesLayoutProps) {
  return <>{children}</>
}
