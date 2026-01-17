import { Home, ListTodo, User } from "lucide-react";

export const APP_PATH = "/app";

/**
 * Shared app navigation links
 * Used in both app sidebar and account sidebar
 */
export const APP_NAV_LINKS = [
  {
    href: APP_PATH,
    Icon: Home,
    label: "Dashboard",
  },
  {
    href: `${APP_PATH}/backlog`,
    Icon: ListTodo,
    label: "Task Backlog",
  },
  {
    href: `${APP_PATH}/users`,
    Icon: User,
    label: "Analytics",
  },
] as const;
