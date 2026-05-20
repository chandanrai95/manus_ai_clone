import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import React from "react"

interface BaseModalProps {
  open: boolean,
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  width: number
  height: number
  background?: string
}

export function BaseModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width,
  height,
  background
}: BaseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          width: "500vw",
          maxWidth: width + "px",
          maxHeight: height + "px",
          background: background,
          zIndex: 1000
        }}
      >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle className="text-foreground">{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}

        <div className="py-2 overflow-auto overflow-y-auto">{children}</div>


      </DialogContent>
    </Dialog>
  )
}