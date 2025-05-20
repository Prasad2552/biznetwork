import { Scrollbar } from "react-scrollbars-custom"

export const ScrollArea = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <Scrollbar className={`overflow-x-auto ${className}`}>{children}</Scrollbar>
}

