import { Home, ListTodo, User } from "lucide-react";

export const APP_PATH = "/app";

/**
 * Shared app navigation links
 * Used in both app sidebar and account sidebar
 * Labels are i18n keys - translate with t(label) in components
 */
export const APP_NAV_LINKS = [
  {
    href: APP_PATH,
    Icon: Home,
    label: "dashboard",
  },
  {
    href: `${APP_PATH}/backlog`,
    Icon: ListTodo,
    label: "taskBacklog",
  },
  {
    href: `${APP_PATH}/users`,
    Icon: User,
    label: "analytics",
  },
] as const;
