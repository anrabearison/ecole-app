import { Plus, RefreshCw, Users, GraduationCap, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface EmptyStateProps {
  type: "teachers" | "students" | "classrooms" | "subjects" | "generic"
  hasActiveFilters?: boolean
  onResetFilters?: () => void
  resetFiltersHref?: string
  createAction?: {
    label: string
    href: string
  }
}

const emptyStateConfig = {
  teachers: {
    icon: Users,
    title: (hasFilters: boolean) => hasFilters ? "Aucun enseignant trouvé" : "Aucun enseignant",
    description: (hasFilters: boolean) => 
      hasFilters 
        ? "Essayez d'ajuster vos filtres de recherche pour trouver l'enseignant recherché."
        : "Commencez par ajouter votre premier enseignant à l'établissement.",
  },
  students: {
    icon: GraduationCap,
    title: (hasFilters: boolean) => hasFilters ? "Aucun élève trouvé" : "Aucun élève",
    description: (hasFilters: boolean) => 
      hasFilters 
        ? "Essayez d'ajuster vos filtres de recherche pour trouver l'élève recherché."
        : "Commencez par inscrire votre premier élève dans l'établissement.",
  },
  classrooms: {
    icon: BookOpen,
    title: (hasFilters: boolean) => hasFilters ? "Aucune classe trouvée" : "Aucune classe",
    description: (hasFilters: boolean) => 
      hasFilters 
        ? "Essayez d'ajuster vos filtres de recherche pour trouver la classe recherchée."
        : "Commencez par créer votre première classe dans l'établissement.",
  },
  subjects: {
    icon: BookOpen,
    title: (hasFilters: boolean) => hasFilters ? "Aucune matière trouvée" : "Aucune matière",
    description: (hasFilters: boolean) => 
      hasFilters 
        ? "Essayez d'ajuster vos filtres de recherche pour trouver la matière recherchée."
        : "Commencez par créer votre première matière dans l'établissement.",
  },
  generic: {
    icon: RefreshCw,
    title: (hasFilters: boolean) => hasFilters ? "Aucun résultat" : "Aucune donnée",
    description: (hasFilters: boolean) => 
      hasFilters 
        ? "Essayez d'ajuster vos filtres de recherche."
        : "Aucune donnée disponible pour le moment.",
  },
}

export function EmptyState({ 
  type, 
  hasActiveFilters = false, 
  onResetFilters,
  resetFiltersHref,
  createAction 
}: EmptyStateProps) {
  const config = emptyStateConfig[type]
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Illustration */}
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      
      {/* Message principal */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {config.title(hasActiveFilters)}
      </h3>
      
      {/* Message contextuel */}
      <p className="text-gray-500 text-center max-w-sm mb-6">
        {config.description(hasActiveFilters)}
      </p>
      
      {/* Actions */}
      <div className="flex gap-3">
        {hasActiveFilters && (onResetFilters || resetFiltersHref) && (
          onResetFilters ? (
            <Button onClick={onResetFilters} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Réinitialiser les filtres
            </Button>
          ) : (
            <Link href={resetFiltersHref || "#"}>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réinitialiser les filtres
              </Button>
            </Link>
          )
        )}
        
        {!hasActiveFilters && createAction && (
          <Link href={createAction.href}>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {createAction.label}
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
