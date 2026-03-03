import type { ReactNode } from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

export type ToasterToast = ToastProps & {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ToastActionElement;
};

export type ActionType = {
  readonly ADD_TOAST: "ADD_TOAST";
  readonly UPDATE_TOAST: "UPDATE_TOAST";
  readonly DISMISS_TOAST: "DISMISS_TOAST";
  readonly REMOVE_TOAST: "REMOVE_TOAST";
};

export type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

export interface State {
  toasts: ToasterToast[];
}

export type Toast = Omit<ToasterToast, "id">;
