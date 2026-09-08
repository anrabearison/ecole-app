"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getGradeById, updateGrade } from "@/lib/actions/grade"
import { gradeUpdateSchema, type GradeUpdateInput } from "@/lib/validations/grade"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/Skeleton"
import { useToast } from "@/components/Toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, BookOpen, AlertCircle } from "lucide-react"

export default function TeacherEditGradePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string | undefined
  const [formError, setFormError] = useState<string | null>(null)
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  // Fetch grade data
  const { data: grade, isLoading, isError, error: queryError } = useQuery({
    queryKey: ["grade", id],
    queryFn: async () => {
      if (!id) throw new Error("ID manquant")
      const result = await getGradeById(id)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!id,
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GradeUpdateInput>({
    resolver: zodResolver(gradeUpdateSchema),
  })

  // Pre-fill form when grade data is loaded
  useEffect(() => {
    if (grade) {
      setValue("value", grade.value)
      setValue("type", grade.type)
      setValue("date", new Date(grade.date).toISOString().split("T")[0])
      setValue("comment", grade.comment ?? "")
    }
  }, [grade, setValue])

  // Update mutation using teacher action
  const updateMutation = useMutation({
    mutationFn: async (data: GradeUpdateInput) => {
      if (!id) throw new Error("ID manquant")
      const result = await updateGrade(id, data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade", id] })
      queryClient.invalidateQueries({ queryKey: ["grades"] })
      showToast("success", "Note mise à jour avec succès")
      router.push(`/teacher/grades/${id}`)
    },
    onError: (err: Error) => {
      setFormError(err.message)
      showToast("error", err.message)
    },
  })

  const onSubmit = (data: GradeUpdateInput) => {
    setFormError(null)
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (isError || !grade) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Note introuvable</h2>
            <p className="text-sm text-gray-500 mt-1">
              {queryError instanceof Error ? queryError.message : "La note demandée n'existe pas."}
            </p>
          </div>
          <Link href="/teacher/grades">
            <Button variant="outline">Retour à mes notes</Button>
          </Link>
        </div>
      </div>
    )
  }

  const studentName = grade.student.firstName
    ? `${grade.student.firstName} ${grade.student.lastName}`
    : grade.student.lastName

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/teacher/grades/${id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-3 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au détail</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Modifier la note</h1>
        <p className="text-sm text-gray-500 mt-1">
          {grade.subject.name} — {studentName}
        </p>
      </div>

      {/* Context banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 flex items-start gap-3">
        <BookOpen className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
        <div className="text-sm text-indigo-700">
          <span className="font-medium">{studentName}</span> — {grade.subject.name} —{" "}
          {grade.classroom.schoolGrade.name} {grade.classroom.section} ({grade.classroom.schoolYear})
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 space-y-5">

          {/* Value */}
          <div className="space-y-1.5">
            <Label htmlFor="grade-value">Note (sur 20) <span className="text-rose-500">*</span></Label>
            <Input
              id="grade-value"
              type="number"
              step="0.01"
              min="0"
              max="20"
              placeholder="Ex: 14.5"
              {...register("value", { valueAsNumber: true })}
              className={errors.value ? "border-red-300 focus:ring-red-500" : ""}
            />
            {errors.value && (
              <p className="text-xs text-red-500">{errors.value.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="grade-type">Type d&apos;évaluation <span className="text-rose-500">*</span></Label>
            <select
              id="grade-type"
              {...register("type")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="EXAM">Examen</option>
              <option value="DAILY">Note journalière</option>
            </select>
            {errors.type && (
              <p className="text-xs text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="grade-date">Date de l&apos;évaluation <span className="text-rose-500">*</span></Label>
            <Input
              id="grade-date"
              type="date"
              {...register("date")}
              className={errors.date ? "border-red-300 focus:ring-red-500" : ""}
            />
            {errors.date && (
              <p className="text-xs text-red-500">{String(errors.date.message)}</p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <Label htmlFor="grade-comment">Commentaire (facultatif)</Label>
            <textarea
              id="grade-comment"
              rows={3}
              placeholder="Observation, remarque sur cette évaluation..."
              {...register("comment")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            {errors.comment && (
              <p className="text-xs text-red-500">{errors.comment.message}</p>
            )}
          </div>

          {/* Global error */}
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href={`/teacher/grades/${id}`}>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
            {updateMutation.isPending ? "Enregistrement…" : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </div>
  )
}
