import Link from "next/link"
import { getGradeById } from "@/lib/actions/grade"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Pencil,
  CheckCircle2,
  AlertCircle,
  User,
  BookOpen,
  GraduationCap,
  Calendar,
  Tag,
  MessageSquare,
  Layers,
} from "lucide-react"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function TeacherGradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const result = await getGradeById(id)

  if (!result.success) {
    if (result.error === "Note non trouvée" || result.error === "Forbidden") {
      notFound()
    }
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Erreur de chargement</h2>
            <p className="text-sm text-gray-500 mt-1">{result.error}</p>
          </div>
          <Link href="/teacher/grades">
            <Button variant="outline">Retour à mes notes</Button>
          </Link>
        </div>
      </div>
    )
  }

  const grade = result.data
  const isPassing = grade.value >= 10
  const studentName = grade.student.firstName
    ? `${grade.student.firstName} ${grade.student.lastName}`
    : grade.student.lastName
  const teacherName = grade.teacher.firstName
    ? `${grade.teacher.firstName} ${grade.teacher.lastName}`
    : grade.teacher.lastName

  // Check if the current teacher owns this grade (to show edit button)
  const isOwner = session?.user?.teacherId === grade.teacher.id

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/teacher/grades"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-3 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à mes notes</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Détail de la note</h1>
            <p className="text-sm text-gray-500 mt-1">
              {grade.subject.name} — {studentName}
            </p>
          </div>
          {isOwner && (
            <Link href={`/teacher/grades/${id}/edit`}>
              <Button size="sm" className="gap-1.5">
                <Pencil className="w-3.5 h-3.5" />
                Modifier
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Note badge */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Note obtenue</p>
          <span
            className={`inline-flex items-center gap-2 text-3xl font-bold px-4 py-2 rounded-xl border ${
              isPassing
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {isPassing ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            {grade.value} / 20
          </span>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</p>
          <span
            className={`px-3 py-1.5 inline-flex text-sm font-semibold rounded-full border ${
              grade.type === "EXAM"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {grade.type === "EXAM" ? "Examen" : "Note journalière"}
          </span>
        </div>
      </div>

      {/* Details grid */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Informations</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Élève</dt>
              <dd className="text-sm font-semibold text-gray-900 mt-0.5">{studentName}</dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Matière</dt>
              <dd className="text-sm font-semibold text-gray-900 mt-0.5">{grade.subject.name}</dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</dt>
              <dd className="text-sm font-semibold text-gray-900 mt-0.5">
                {grade.classroom.schoolGrade.name} {grade.classroom.section}
              </dd>
              <dd className="text-xs text-gray-400">{grade.classroom.schoolYear}</dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Enseignant</dt>
              <dd className="text-sm font-semibold text-gray-900 mt-0.5">{teacherName}</dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date de l&apos;évaluation</dt>
              <dd className="text-sm font-semibold text-gray-900 mt-0.5">
                {new Date(grade.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Période</dt>
              <dd className="text-sm font-semibold text-gray-900 mt-0.5">
                {grade.period?.name || <span className="text-gray-400 font-normal">Non définie</span>}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cycle</dt>
              <dd className="text-sm font-semibold text-gray-900 mt-0.5">{grade.classroom.schoolGrade.cycle}</dd>
            </div>
          </div>
        </dl>

        {/* Comment */}
        {grade.comment && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Commentaire</dt>
                <dd className="text-sm text-gray-700 mt-1 leading-relaxed">{grade.comment}</dd>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-400 text-right">
        Saisie le{" "}
        {new Date(grade.createdAt).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
    </div>
  )
}
