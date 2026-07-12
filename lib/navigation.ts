import type { LucideIcon } from "lucide-react"
import {
  CalendarDays,
  Clock,
  FileText,
  Layers,
  LayoutDashboard,
  MapPin,
  Pencil,
  School,
  Settings,
  Users,
  User,
  BookOpen,
  ClipboardList,
} from "lucide-react"

type Role =
  | "PLATFORM_SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "STAFF_ADMIN"
  | "TEACHER"
  | "STUDENT"

export type NavLink = {
  type: "link"
  label: string
  href: string
  icon: LucideIcon
}

export type NavGroup = {
  type: "group"
  label: string
  icon: LucideIcon
  items: NavLink[]
}

export type NavItem = NavLink | NavGroup

export const navByRole: Record<Role, NavItem[]> = {
  PLATFORM_SUPER_ADMIN: [
    {
      type: "link",
      label: "Écoles",
      href: "/platform",
      icon: School,
    },
  ],
  SCHOOL_ADMIN: [
    {
      type: "link",
      label: "Tableau de bord",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      type: "group",
      label: "Utilisateurs",
      icon: Users,
      items: [
        { type: "link", label: "Élèves", href: "/admin/users/students", icon: User },
        { type: "link", label: "Enseignants", href: "/admin/users/teachers", icon: User },
      ],
    },
    {
      type: "group",
      label: "Académique",
      icon: School,
      items: [
        {
          type: "link",
          label: "Classes",
          href: "/admin/academics/classrooms",
          icon: Layers,
        },
        {
          type: "link",
          label: "Niveaux",
          href: "/admin/academics/grades",
          icon: BookOpen,
        },
        {
          type: "link",
          label: "Séries",
          href: "/admin/academics/tracks",
          icon: ClipboardList,
        },
        {
          type: "link",
          label: "Matières",
          href: "/admin/academics/subjects",
          icon: FileText,
        },
        {
          type: "link",
          label: "Salles",
          href: "/admin/academics/rooms",
          icon: MapPin,
        },
        {
          type: "link",
          label: "Périodes",
          href: "/admin/academics/periods",
          icon: CalendarDays,
        },
      ],
    },
    {
      type: "link",
      label: "Notes",
      href: "/admin/grades",
      icon: FileText,
    },
    {
      type: "link",
      label: "Emploi du temps",
      href: "/admin/schedule",
      icon: Clock,
    },
    {
      type: "link",
      label: "Paramètres",
      href: "/admin/settings",
      icon: Settings,
    },
  ],
  STAFF_ADMIN: [
    {
      type: "link",
      label: "Tableau de bord",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      type: "group",
      label: "Utilisateurs",
      icon: Users,
      items: [
        { type: "link", label: "Élèves", href: "/admin/users/students", icon: User },
        { type: "link", label: "Enseignants", href: "/admin/users/teachers", icon: User },
      ],
    },
    {
      type: "group",
      label: "Académique",
      icon: School,
      items: [
        {
          type: "link",
          label: "Classes",
          href: "/admin/academics/classrooms",
          icon: Layers,
        },
        {
          type: "link",
          label: "Niveaux",
          href: "/admin/academics/grades",
          icon: BookOpen,
        },
        {
          type: "link",
          label: "Séries",
          href: "/admin/academics/tracks",
          icon: ClipboardList,
        },
        {
          type: "link",
          label: "Matières",
          href: "/admin/academics/subjects",
          icon: FileText,
        },
        {
          type: "link",
          label: "Salles",
          href: "/admin/academics/rooms",
          icon: MapPin,
        },
        {
          type: "link",
          label: "Périodes",
          href: "/admin/academics/periods",
          icon: CalendarDays,
        },
      ],
    },
    {
      type: "link",
      label: "Notes",
      href: "/admin/grades",
      icon: FileText,
    },
    {
      type: "link",
      label: "Emploi du temps",
      href: "/admin/schedule",
      icon: Clock,
    },
    {
      type: "link",
      label: "Paramètres",
      href: "/admin/settings",
      icon: Settings,
    },
  ],
  TEACHER: [
    {
      type: "link",
      label: "Mes classes",
      href: "/teacher/my-classrooms",
      icon: LayoutDashboard,
    },
    {
      type: "group",
      label: "Notes",
      icon: FileText,
      items: [
        { type: "link", label: "Saisir des notes", href: "/teacher/grades/new", icon: Pencil },
        { type: "link", label: "Consulter", href: "/teacher/grades", icon: FileText },
      ],
    },
    {
      type: "link",
      label: "Emploi du temps",
      href: "/teacher/schedule",
      icon: Clock,
    },
  ],
  STUDENT: [
    {
      type: "link",
      label: "Mes notes",
      href: "/student/my-grades",
      icon: FileText,
    },
    {
      type: "link",
      label: "Emploi du temps",
      href: "/student/schedule",
      icon: Clock,
    },
  ],
}
