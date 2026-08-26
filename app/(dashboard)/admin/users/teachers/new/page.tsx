"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createTeacher } from "@/lib/actions/teacher"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { teacherFormSchema, type TeacherFormInput, type TeacherInput } from "@/lib/validations/teacher"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  User, 
  Briefcase, 
  KeyRound, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  AlertTriangle 
} from "lucide-react"

export default function NewTeacherPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [teacherInfo, setTeacherInfo] = useState<{ email?: string; name: string; cin?: string } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TeacherFormInput>({
    resolver: zodResolver(teacherFormSchema),
  })

  const selectedSex = watch("sex")
  const selectedContract = watch("contractType")

  function generateCin() {
    const randomCin = "301" + Math.floor(100000000 + Math.random() * 900000000).toString()
    setValue("nationalIdNumber", randomCin, { shouldValidate: true })
  }

  async function onSubmit(data: TeacherFormInput) {
    setError(null)
    const payload: TeacherInput = {
      ...data,
      phone: data.phone || undefined,
      contractType: data.contractType || undefined,
      registrationNumber: data.registrationNumber || undefined,
    }
    const result = await createTeacher(payload)

    if (result.success) {
      setTemporaryPassword(result.data.temporaryPassword)
      setTeacherInfo({
        email: data.email ?? undefined,
        name: `${data.firstName} ${data.lastName}`,
        cin: data.nationalIdNumber,
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
    setTeacherInfo(null)
    router.push("/admin/users/teachers")
    router.refresh()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/admin/users/teachers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-2 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des enseignants</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Nouvel enseignant</h1>
        <p className="text-gray-600 mt-1">
          Renseignez les informations pour inscrire un enseignant et créer son compte d'accès.
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
                  placeholder="Ex: Marie"
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
                  placeholder="Ex: Ravelo"
                  {...register("lastName")}
                  className="mt-1.5"
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Sexe : Segmented Control Buttons */}
              <div>
                <Label className="font-medium text-gray-700 block mb-2">
                  Sexe <span className="text-gray-400 font-normal">(Optionnel)</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
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

              <div>
                <Label htmlFor="phone" className="font-medium text-gray-700">
                  Téléphone <span className="text-gray-400 font-normal">(Optionnel)</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="Ex: +261 34 00 000 00"
                  {...register("phone")}
                  className="mt-1.5"
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Statut & Identification */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Statut & Identification</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="nationalIdNumber" className="font-medium text-gray-700">
                    Numéro CIN <span className="text-red-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={generateCin}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Générer
                  </button>
                </div>
                <Input
                  id="nationalIdNumber"
                  placeholder="Ex: 301234567890"
                  {...register("nationalIdNumber")}
                  className="mt-1.5 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Identifiant national CIN (servira d'identifiant de connexion si pas d'email).
                </p>
                {errors.nationalIdNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.nationalIdNumber.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="registrationNumber" className="font-medium text-gray-700">
                  Numéro matricule interne <span className="text-gray-400 font-normal">(Optionnel)</span>
                </Label>
                <Input
                  id="registrationNumber"
                  placeholder="Ex: ENS-2025-01"
                  {...register("registrationNumber")}
                  className="mt-1.5 font-mono"
                />
                {errors.registrationNumber && (
                  <p className="text-sm text-red-600 mt-1">{errors.registrationNumber.message}</p>
                )}
              </div>
            </div>

            {/* Type de contrat : Segmented Control */}
            <div>
              <Label className="font-medium text-gray-700 block mb-2">
                Type de contrat <span className="text-gray-400 font-normal">(Optionnel)</span>
              </Label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setValue("contractType", "FONCTIONNAIRE", { shouldValidate: true })}
                  className={`px-4 py-2.5 rounded-lg border font-medium text-sm transition-all ${
                    selectedContract === "FONCTIONNAIRE"
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs ring-1 ring-indigo-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Fonctionnaire
                </button>
                <button
                  type="button"
                  onClick={() => setValue("contractType", "ENF", { shouldValidate: true })}
                  className={`px-4 py-2.5 rounded-lg border font-medium text-sm transition-all ${
                    selectedContract === "ENF"
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs ring-1 ring-indigo-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  ENF
                </button>
              </div>
              {errors.contractType && (
                <p className="text-sm text-red-600 mt-1">{errors.contractType.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Compte d'accès */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Compte d'accès</h2>
          </div>
          <div className="p-6">
            <div>
              <Label htmlFor="email" className="font-medium text-gray-700">
                Email professionnel <span className="text-gray-400 font-normal">(Optionnel)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex: prof@exemple.mg"
                {...register("email")}
                className="mt-1.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Si non renseigné, l'enseignant utilisera son numéro CIN pour se connecter.
              </p>
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
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
          <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
            {isSubmitting ? "Création..." : "Créer l'enseignant"}
          </Button>
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
                L'enseignant <strong className="text-gray-900">{teacherInfo?.name}</strong> a bien été enregistré.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mb-5">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Identifiant de connexion</span>
                <span className="font-mono text-sm font-semibold text-gray-900">
                  {teacherInfo?.email || teacherInfo?.cin}
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
                <strong>Attention :</strong> Ce mot de passe temporaire ne sera plus affiché. Veuillez le copier maintenant et le transmettre à l'enseignant.
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
