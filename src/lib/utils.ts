import { clsx, type ClassValue } from "clsx"
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// ✅ Success toast
export const showSuccess = (message?: string) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    theme: "colored",
  });
};

// ✅ Error toast
export const showError = (message: string) => {
  toast.error(message, {
    position: "bottom-right",
    autoClose: 4000,
    theme: "colored",
  });
};

// ✅ Info toast
export const showInfo = (message: string) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 3000,
    theme: "light",
  });
};
