
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { AlertTriangle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, variant, ...props }) {
        const Icon = variant === 'destructive' ? AlertTriangle : 
                    variant === 'success' ? CheckCircle : Info;
                    
        return (
          <Toast key={id} {...props} variant={variant}>
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <Icon className={cn(
                  "h-5 w-5",
                  variant === 'destructive' && "text-destructive",
                  variant === 'success' && "text-green-500",
                  !variant && "text-blue-500"
                )} />
                {title && <ToastTitle className="font-medium text-sm">{title}</ToastTitle>}
              </div>
              {description && (
                <ToastDescription className="text-sm text-muted-foreground">
                  {description}
                </ToastDescription>
              )}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
