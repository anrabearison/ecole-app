"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  updateProfileSchema,
  updatePasswordSchema,
  type UpdateProfileInput,
  type UpdatePasswordInput,
} from "@/lib/validations/profile"
import { updateProfile, updatePassword, type UserProfileData } from "@/lib/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmActionButton } from "@/components/ConfirmDialog"
import { User, Lock, CheckCircle2, AlertCircle, Shield, Building2 } from "lucide-react"

type ProfileFormProps = {
  profile: UserProfileData
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState<"info" | "security">("info")

  // State messages
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // React Hook Form for Profile
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      email: profile.email || "",
      firstName: profile.teacher?.firstName || profile.student?.firstName || "",
      lastName: profile.teacher?.lastName || profile.student?.lastName || "",
      phone: profile.teacher?.phone || "",
      guardianName: profile.student?.guardianName || "",
      guardianPhone: profile.student?.guardianPhone || "",
    },
  })

  // React Hook Form for Password
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // Submit Profile Info
  const onProfileSubmit = async (data: UpdateProfileInput) => {
    setProfileLoading(true)
    setProfileSuccess(null)
    setProfileError(null)

    try {
      const res = await updateProfile(data)
      if (res.success) {
        setProfileSuccess(res.data.message)
      } else {
        setProfileError(res.error)
      }
    } catch {
      setProfileError("Une erreur inattendue est survenue.")
    } finally {
      setProfileLoading(false)
    }
  }

  // Submit Password Change
  const onPasswordSubmit = async (data: UpdatePasswordInput) => {
    setPasswordLoading(true)
    setPasswordSuccess(null)
    setPasswordError(null)

    try {
      const res = await updatePassword(data)
      if (res.success) {
        setPasswordSuccess(res.data.message)
        resetPasswordForm()
      } else {
        setPasswordError(res.error)
      }
    } catch {
      setPasswordError("Une erreur inattendue est survenue.")
    } finally {
      setPasswordLoading(false)
    }
  }

  const roleLabels: Record<string, string> = {
    PLATFORM_SUPER_ADMIN: "Super Administrateur",
    SCHOOL_ADMIN: "Administrateur de l'école",
    STAFF_ADMIN: "Personnel Administratif",
    TEACHER: "Enseignant",
    STUDENT: "Élève",
  }

  return (
    <div className="space-y-6">
      {/* User Summary Card */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0">
            {(profile.teacher?.firstName?.[0] || profile.student?.firstName?.[0] || profile.email?.[0] || "U").toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {profile.teacher
                ? `${profile.teacher.firstName} ${profile.teacher.lastName}`
                : profile.student
                ? `${profile.student.firstName} ${profile.student.lastName}`
                : profile.email}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Shield className="w-3 h-3" />
                {roleLabels[profile.role] || profile.role}
              </span>
              {profile.schoolName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  <Building2 className="w-3 h-3" />
                  {profile.schoolName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-2 overflow-x-auto" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "info"
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <User className="w-4 h-4" />
            Informations personnelles
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === "security"
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Lock className="w-4 h-4" />
            Sécurité & Mot de passe
          </button>
        </nav>
      </div>

      {/* Tab 1: Informations Personnelles */}
      {activeTab === "info" && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 space-y-6">
          {profileSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Email */}
              <div className="sm:col-span-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...registerProfile("email")}
                  placeholder="votre.email@exemple.com"
                  className="mt-1"
                />
                {profileErrors.email && (
                  <p className="text-xs text-rose-600 mt-1">{profileErrors.email.message}</p>
                )}
              </div>

              {/* First Name */}
              {(profile.teacher || profile.student) && (
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    Prénom
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    {...registerProfile("firstName")}
                    className="mt-1"
                  />
                  {profileErrors.firstName && (
                    <p className="text-xs text-rose-600 mt-1">{profileErrors.firstName.message}</p>
                  )}
                </div>
              )}

              {/* Last Name */}
              {(profile.teacher || profile.student) && (
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Nom
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    {...registerProfile("lastName")}
                    className="mt-1"
                  />
                  {profileErrors.lastName && (
                    <p className="text-xs text-rose-600 mt-1">{profileErrors.lastName.message}</p>
                  )}
                </div>
              )}

              {/* Teacher Phone */}
              {profile.teacher && (
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="text"
                    {...registerProfile("phone")}
                    placeholder="034 00 000 00"
                    className="mt-1"
                  />
                </div>
              )}

              {/* Teacher CIN (Readonly) */}
              {profile.teacher && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Numéro CIN (Immuable)</Label>
                  <Input
                    type="text"
                    disabled
                    value={profile.teacher.nationalIdNumber}
                    className="mt-1 bg-gray-50"
                  />
                </div>
              )}

              {/* Student Guardian Name */}
              {profile.student && (
                <div>
                  <Label htmlFor="guardianName" className="text-sm font-medium text-gray-700">
                    Nom du tuteur / responsable
                  </Label>
                  <Input
                    id="guardianName"
                    type="text"
                    {...registerProfile("guardianName")}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Student Guardian Phone */}
              {profile.student && (
                <div>
                  <Label htmlFor="guardianPhone" className="text-sm font-medium text-gray-700">
                    Téléphone du tuteur
                  </Label>
                  <Input
                    id="guardianPhone"
                    type="text"
                    {...registerProfile("guardianPhone")}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Student Matricule (Readonly) */}
              {profile.student && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Matricule (Immuable)</Label>
                  <Input
                    type="text"
                    disabled
                    value={profile.student.registrationNumber}
                    className="mt-1 bg-gray-50"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <ConfirmActionButton
                type="submit"
                variant="update"
                btnVariant="default"
                title="Confirmation de modification"
                message="Êtes-vous sûr de vouloir mettre à jour vos informations personnelles ?"
                confirmLabel="Oui, enregistrer"
                disabled={profileLoading}
                className="w-full sm:w-auto"
              >
                {profileLoading ? "Enregistrement..." : "Enregistrer les modifications"}
              </ConfirmActionButton>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Sécurité & Mot de passe */}
      {activeTab === "security" && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Changer le mot de passe</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Pour votre sécurité, choisissez un mot de passe fort d'au moins 6 caractères.
            </p>
          </div>

          {passwordSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                Mot de passe actuel
              </Label>
              <Input
                id="currentPassword"
                type="password"
                {...registerPassword("currentPassword")}
                placeholder="••••••••"
                className="mt-1"
              />
              {passwordErrors.currentPassword && (
                <p className="text-xs text-rose-600 mt-1">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                Nouveau mot de passe
              </Label>
              <Input
                id="newPassword"
                type="password"
                {...registerPassword("newPassword")}
                placeholder="••••••••"
                className="mt-1"
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-rose-600 mt-1">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirmer le nouveau mot de passe
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                {...registerPassword("confirmPassword")}
                placeholder="••••••••"
                className="mt-1"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-rose-600 mt-1">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <div className="pt-2">
              <ConfirmActionButton
                type="submit"
                variant="update"
                btnVariant="default"
                title="Confirmation de sécurité"
                message="Êtes-vous sûr de vouloir modifier votre mot de passe ?"
                confirmLabel="Oui, modifier"
                disabled={passwordLoading}
                className="w-full sm:w-auto"
              >
                {passwordLoading ? "Modification..." : "Modifier mon mot de passe"}
              </ConfirmActionButton>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
