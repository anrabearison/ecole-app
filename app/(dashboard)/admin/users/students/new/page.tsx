"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createStudent, getClassrooms } from "@/lib/actions/student"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { studentFormSchema, type StudentFormInput, type StudentInput } from "@/lib/validations/student"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmActionButton } from "@/components/ConfirmDialog"
import { 
  ArrowLeft, 
  User, 
  GraduationCap, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  AlertTriangle 
} from "lucide-react"

export default function NewStudentPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [classrooms, setClassrooms] = useState<Array<{ id: string; name: string; schoolYear: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [studentInfo, setStudentInfo] = useState<{ email?: string; name: string; registrationNumber?: string } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      status: "PASSING",
    }
  })

  const selectedSex = watch("sex")

  useEffect(() => {
    async function fetchClassrooms() {
      const result = await getClassrooms()
      if (result.success) {
        setClassrooms(result.data)
      }
      setIsLoading(false)
    }
    fetchClassrooms()
  }, [])

  function generateMatricule() {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(100 + Math.random() * 900)
    setValue("registrationNumber", `${year}-${randomNum}`, { shouldValidate: true })
  }

  async function onSubmit(data: StudentFormInput) {
    setError(null)
    const payload: StudentInput = {
      ...data,
      classroomId: data.classroomId || undefined,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      guardianName: data.guardianName || undefined,
      guardianPhone: data.guardianPhone || undefined,
      status: data.status || "PASSING",
    }
    const result = await createStudent(payload)

    if (result.success) {
      setTemporaryPassword(result.data.temporaryPassword)
      setStudentInfo({
        email: data.email ?? undefined,
        name: `${data.firstName} ${data.lastName}`,
        registrationNumber: data.registrationNumber,
      })
      setShowPasswordModal(true)
      reset()
    } else {
      setError(result.error)
    }
  }

  function handleCopy(text: string, fieldName: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  function handlePasswordModalClose() {
    setShowPasswordModal(false)
    setTemporaryPassword(null)
    setStudentInfo(null)
    router.push("/admin/users/students")
    router.refresh()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/admin/users/students"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-2 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des élèves</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Nouvel élève</h1>
        <p className="text-gray-600 mt-1">
          Renseignez les informations pour inscrire un élève et créer son compte d'accès.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Informations personnelles */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="firstName" className="font-medium text-gray-700">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="Ex: Jean"
                  {...register("firstName")}
                  className="mt-1.5"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName" className="font-medium text-gray-700">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Ex: Rakoto"
                  {...register("lastName")}
                  className="mt-1.5"
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Sexe : Segmented Control Buttons */}
            <div>
              <Label className="font-medium text-gray-700 block mb-2">
                Sexe <span className="text-gray-400 font-normal">(Optionnel)</span>
              </Label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setValue("sex", "MALE", { shouldValidate: true })}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-all ${
                    selectedSex === "MALE"
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs ring-1 ring-indigo-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">♂️</span>
                  <span>Masculin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("sex", "FEMALE", { shouldValidate: true })}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-all ${
                    selectedSex === "FEMALE"
                      ? "bg-pink-50 border-pink-600 text-pink-700 shadow-xs ring-1 ring-pink-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">♀️</span>
                  <span>Féminin</span>
                </button>
              </div>
              {errors.sex && (
                <p className="text-sm text-red-600 mt-1">{errors.sex.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="dateOfBirth" className="font-medium text-gray-700">
                  Date de naissance
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                  className="mt-1.5"
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="placeOfBirth" className="font-medium text-gray-700">
                  Lieu de naissance
                </Label>
                <Input
                  id="placeOfBirth"
                  placeholder="Ex: Antananarivo"
                  {...register("placeOfBirth")}
                  className="mt-1.5"
                />
                {errors.placeOfBirth && (
                  <p className="text-sm text-red-600 mt-1">{errors.placeOfBirth.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Scolarité & Compte d'accès */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Scolarité & Compte d'accès</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="registrationNumber" className="font-medium text-gray-700">
                    Numéro matricule <span className="text-red-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={generateMatricule}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Générer
                  </button>
                </div>
                <Input
                  id="registrationNumber"
                  placeholder="Ex: 2025-001"
                  {...register("registrationNumber")}
                  className="mt-1.5 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Identifiant unique de l'élève pour la connexion et la scolarité.
                </p>
                {errors.registrationNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.registrationNumber.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status" className="font-medium text-gray-700">
                  Statut scolaire
                </Label>
                <select
                  id="status"
                  {...register("status")}
                  className="mt-1.5 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
                >
                  <option value="PASSING">Passant</option>
                  <option value="REPEATING">Redoublant</option>
                  <option value="TRIPLING">Triplant</option>
                </select>
                {errors.status && (
                  <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="classroomId" className="font-medium text-gray-700">
                  Classe assignée
                </Label>
                <select
                  id="classroomId"
                  {...register("classroomId")}
                  className="mt-1.5 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
                  disabled={isLoading}
                >
                  <option value="">Non assigné (à affecter ultérieurement)</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name} ({classroom.schoolYear})
                    </option>
                  ))}
                </select>
                {errors.classroomId && (
                  <p className="text-sm text-red-600 mt-1">{errors.classroomId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="font-medium text-gray-700">
                  Email <span className="text-gray-400 font-normal">(Optionnel)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ex: eleve@exemple.mg"
                  {...register("email")}
                  className="mt-1.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si vide, l'élève se connectera uniquement avec son numéro matricule.
                </p>
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Responsable légal / Tuteur */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Responsable légal / Tuteur</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="guardianName" className="font-medium text-gray-700">
                  Nom du tuteur
                </Label>
                <Input
                  id="guardianName"
                  placeholder="Ex: Parent Rakoto"
                  {...register("guardianName")}
                  className="mt-1.5"
                />
                {errors.guardianName && (
                  <p className="text-sm text-red-600 mt-1">{errors.guardianName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="guardianPhone" className="font-medium text-gray-700">
                  Téléphone du tuteur
                </Label>
                <Input
                  id="guardianPhone"
                  placeholder="Ex: +261 34 00 000 00"
                  {...register("guardianPhone")}
                  className="mt-1.5"
                />
                {errors.guardianPhone && (
                  <p className="text-sm text-red-600 mt-1">{errors.guardianPhone.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <ConfirmActionButton
            type="submit"
            variant="create"
            btnVariant="default"
            title="Confirmation d'enregistrement"
            message="Êtes-vous sûr de vouloir enregistrer cet élève ?"
            confirmLabel="Oui, enregistrer"
            disabled={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? "Création..." : "Créer l'élève"}
          </ConfirmActionButton>
        </div>
      </form>

      {/* Temporary Password Modal */}
      {showPasswordModal && temporaryPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Compte créé avec succès !</h2>
              <p className="text-sm text-gray-600 mt-1">
                L'élève <strong className="text-gray-900">{studentInfo?.name}</strong> a bien été enregistré.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mb-5">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Identifiant de connexion</span>
                <span className="font-mono text-sm font-semibold text-gray-900">
                  {studentInfo?.email || studentInfo?.registrationNumber}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Mot de passe temporaire</span>
                <div className="flex items-center gap-2">
                  <Input
                    value={temporaryPassword}
                    readOnly
                    className="font-mono text-base font-bold bg-white text-indigo-600 border-gray-300"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(temporaryPassword, "password")}
                    className="shrink-0 gap-1"
                  >
                    {copiedField === "password" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copiedField === "password" ? "Copié !" : "Copier"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Attention :</strong> Ce mot de passe temporaire ne sera plus affiché. Veuillez le copier maintenant et le transmettre à l'élève ou à son tuteur.
              </p>
            </div>

            <Button onClick={handlePasswordModalClose} className="w-full">
              J'ai copié les identifiants
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
