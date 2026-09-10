"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  getSchoolScheduleSettings,
  updateSchoolScheduleSettings,
  getSchoolLogo,
  updateSchoolLogo,
  deleteSchoolLogo,
  type ScheduleSettings,
} from "@/lib/actions/school"

export default function SettingsPage() {
  const [settings, setSettings] = useState<ScheduleSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoLoading, setLogoLoading] = useState(true)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoSuccess, setLogoSuccess] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form fields
  const [scheduleStartTime, setScheduleStartTime] = useState("07:00")
  const [morningEndTime, setMorningEndTime] = useState("12:00")
  const [afternoonStartTime, setAfternoonStartTime] = useState("14:00")
  const [scheduleEndTime, setScheduleEndTime] = useState("18:00")
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(60)

  useEffect(() => {
    async function load() {
      const [scheduleRes, logoRes] = await Promise.all([
        getSchoolScheduleSettings(),
        getSchoolLogo(),
      ])

      if (scheduleRes.success) {
        setSettings(scheduleRes.data)
        setScheduleStartTime(scheduleRes.data.scheduleStartTime)
        setMorningEndTime(scheduleRes.data.morningEndTime)
        setAfternoonStartTime(scheduleRes.data.afternoonStartTime)
        setScheduleEndTime(scheduleRes.data.scheduleEndTime)
        setSlotDurationMinutes(scheduleRes.data.slotDurationMinutes)
      }

      if (logoRes.success) {
        setLogoUrl(logoRes.data.logoUrl)
      }

      setLoading(false)
      setLogoLoading(false)
    }
    load()
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setLogoError("Veuillez sélectionner une image (PNG, JPEG)")
      return
    }

    if (file.size > 500 * 1024) {
      setLogoError("La taille de l'image ne doit pas dépasser 500 Ko")
      return
    }

    setLogoUploading(true)
    setLogoSuccess(false)
    setLogoError(null)

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      const res = await updateSchoolLogo(base64)
      if (res.success) {
        setLogoUrl(res.data.logoUrl)
        setLogoSuccess(true)
        setTimeout(() => setLogoSuccess(false), 3000)
      } else {
        setLogoError(res.error)
      }
      setLogoUploading(false)
    }
    reader.onerror = () => {
      setLogoError("Erreur lors de la lecture du fichier")
      setLogoUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleLogoDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer le logo de l'école ?")) return

    setLogoUploading(true)
    setLogoSuccess(false)
    setLogoError(null)

    const res = await deleteSchoolLogo()
    if (res.success) {
      setLogoUrl(null)
      setLogoSuccess(true)
      setTimeout(() => setLogoSuccess(false), 3000)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } else {
      setLogoError(res.error)
    }
    setLogoUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    setError(null)

    const result = await updateSchoolScheduleSettings({
      scheduleStartTime,
      morningEndTime,
      afternoonStartTime,
      scheduleEndTime,
      slotDurationMinutes,
    })

    if (result.success) {
      setSettings(result.data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error)
    }

    setSaving(false)
  }

  // Preview helper
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number)
    return h * 60 + m
  }

  const morningSlots = Math.max(0, Math.floor((timeToMinutes(morningEndTime) - timeToMinutes(scheduleStartTime)) / slotDurationMinutes))
  const afternoonSlots = Math.max(0, Math.floor((timeToMinutes(scheduleEndTime) - timeToMinutes(afternoonStartTime)) / slotDurationMinutes))
  const breakDuration = Math.max(0, timeToMinutes(afternoonStartTime) - timeToMinutes(morningEndTime))

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Paramètres de l&apos;école</h1>
        
        {/* School Logo Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            🖼️ Logo de l&apos;établissement
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Ce logo apparaîtra sur tous les bulletins de notes (trimestriels et annuels) générés en PDF.
          </p>

          {logoSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm font-medium">✅ Logo mis à jour avec succès</p>
            </div>
          )}

          {logoError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-medium">❌ {logoError}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo École" className="w-full h-full object-contain p-1" />
              ) : (
                <div className="text-center p-2">
                  <span className="text-3xl block mb-1">🏫</span>
                  <span className="text-xs text-gray-400 font-medium">Aucun logo</span>
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Télécharger un nouveau logo
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleLogoUpload}
                  disabled={logoUploading || logoLoading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50"
                />
                <p className="text-xs text-gray-400 mt-1">Formats acceptés : PNG, JPEG, WebP. Taille max : 500 Ko.</p>
              </div>

              {logoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoDelete}
                  disabled={logoUploading}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                >
                  Supprimer le logo
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Grade weighting section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            Pondération des notes
          </h2>
          <p className="text-blue-800 mb-4">
            La pondération des notes (examen/journalier) est maintenant configurée par période scolaire.
          </p>
          <p className="text-sm text-blue-700 mb-4">
            Chaque trimestre/période peut avoir sa propre pondération, adaptée aux spécificités de cette période.
          </p>
          <Link href="/admin/academics/periods">
            <Button>Gérer les périodes</Button>
          </Link>
        </div>

        {/* Schedule configuration section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            ⏰ Configuration des horaires
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Définissez les horaires d&apos;entrée, de pause et de sortie de l&apos;établissement.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              <span className="ml-2 text-gray-500">Chargement...</span>
            </div>
          ) : (
            <>
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">✅ Paramètres horaires sauvegardés avec succès</p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm font-medium">❌ {error}</p>
                </div>
              )}

              <div className="space-y-5">
                {/* Morning session */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    🌅 Session du matin
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="scheduleStartTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Heure d&apos;entrée
                      </label>
                      <input
                        id="scheduleStartTime"
                        type="time"
                        value={scheduleStartTime}
                        onChange={(e) => setScheduleStartTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="morningEndTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Fin des cours (matin)
                      </label>
                      <input
                        id="morningEndTime"
                        type="time"
                        value={morningEndTime}
                        onChange={(e) => setMorningEndTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Break */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    🍽️ Pause méridienne
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Début pause
                      </label>
                      <input
                        type="time"
                        value={morningEndTime}
                        disabled
                        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">= Fin matin</p>
                    </div>
                    <div>
                      <label htmlFor="afternoonStartTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Fin pause (reprise)
                      </label>
                      <input
                        id="afternoonStartTime"
                        type="time"
                        value={afternoonStartTime}
                        onChange={(e) => setAfternoonStartTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Afternoon session */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
                    🌇 Session de l&apos;après-midi
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Reprise
                      </label>
                      <input
                        type="time"
                        value={afternoonStartTime}
                        disabled
                        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">= Fin pause</p>
                    </div>
                    <div>
                      <label htmlFor="scheduleEndTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Heure de sortie
                      </label>
                      <input
                        id="scheduleEndTime"
                        type="time"
                        value={scheduleEndTime}
                        onChange={(e) => setScheduleEndTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Slot duration */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                    📐 Durée des créneaux
                  </h3>
                  <div className="max-w-xs">
                    <label htmlFor="slotDurationMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                      Durée d&apos;un cours (en minutes)
                    </label>
                    <select
                      id="slotDurationMinutes"
                      value={slotDurationMinutes}
                      onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 heure (60 min)</option>
                      <option value={90}>1h30 (90 min)</option>
                      <option value={120}>2 heures (120 min)</option>
                    </select>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">📋 Aperçu</h3>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p>🌅 <span className="font-medium">Matin :</span> {scheduleStartTime} → {morningEndTime} ({morningSlots} créneau{morningSlots > 1 ? "x" : ""})</p>
                    <p>🍽️ <span className="font-medium">Pause :</span> {morningEndTime} → {afternoonStartTime} ({breakDuration} min)</p>
                    <p>🌇 <span className="font-medium">Après-midi :</span> {afternoonStartTime} → {scheduleEndTime} ({afternoonSlots} créneau{afternoonSlots > 1 ? "x" : ""})</p>
                    <p className="pt-1 border-t border-slate-200 mt-2 font-medium">
                      Total : {morningSlots + afternoonSlots} créneau{(morningSlots + afternoonSlots) > 1 ? "x" : ""} de {slotDurationMinutes} min / jour
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Sauvegarde..." : "Sauvegarder les horaires"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
