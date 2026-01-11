import type { NavigationGroup } from "@/features/navigation/navigation.type";
import { AlertCircle, Home, ListTodo, Mail, User, User2 } from "lucide-react";

export const getAccountNavigation = (): NavigationGroup[] => {
  return ACCOUNT_LINKS;
};

const ACCOUNT_LINKS: NavigationGroup[] = [
  {
    title: "Your profile",
    links: [
      {
        href: "/account",
        Icon: User2,
        label: "Profile",
      },
      {
        href: "/account/email",
        Icon: Mail,
        label: "Mail",
      },
      {
        href: "/account/danger",
        Icon: AlertCircle,
        label: "Danger",
      },
    ],
  },
  {
    title: "App",
    links: [
      {
        href: "/app",
        Icon: Home,
        label: "Dashboard",
      },
      {
        href: "/app/backlog",
        Icon: ListTodo,
        label: "Task Backlog",
      },
      {
        href: "/app/users",
        Icon: User,
        label: "Analytics",
      },
    ],
  },
];
