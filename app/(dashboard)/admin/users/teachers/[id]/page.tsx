"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { listTeachers, deleteTeacher } from "@/lib/actions/teacher"
import { listTeacherSubjects, assignTeacherSubject, removeTeacherSubject, getSubjects, getClassrooms } from "@/lib/actions/teacher-subject"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TeacherDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [teacher, setTeacher] = useState<any>(null)
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([])
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([])
  const [classrooms, setClassrooms] = useState<Array<{ id: string; name: string; schoolYear: string }>>([])
  const [activeTab, setActiveTab] = useState("info")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state for adding teacher subject
  const [subjectId, setSubjectId] = useState("")
  const [classroomId, setClassroomId] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const teachersResult = await listTeachers()
        if (teachersResult.success) {
          const foundTeacher = teachersResult.data.find((t) => t.id === params.id)
          setTeacher(foundTeacher || null)
        }

        const subjectsResult = await listTeacherSubjects(params.id)
        if (subjectsResult.success) {
          setTeacherSubjects(subjectsResult.data)
        }

        const subjectsListResult = await getSubjects()
        if (subjectsListResult.success) {
          setSubjects(subjectsListResult.data)
        }

        const classroomsResult = await getClassrooms()
        if (classroomsResult.success) {
          setClassrooms(classroomsResult.data)
        }
      } catch (err) {
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.id])

  async function handleDelete() {
    if (!confirm("Êtes-vous sûr de vouloir désactiver ce compte enseignant ?")) {
      return
    }

    const result = await deleteTeacher(params.id)
    if (result.success) {
      router.push("/admin/users/teachers")
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  async function handleAddSubject(e: React.FormEvent) {
    e.preventDefault()
    setIsAdding(true)
    setError(null)

    const result = await assignTeacherSubject({
      teacherId: params.id,
      subjectId,
      classroomId,
    })

    if (result.success) {
      setTeacherSubjects([...teacherSubjects, result.data])
      setSubjectId("")
      setClassroomId("")
    } else {
      setError(result.error)
    }

    setIsAdding(false)
  }

  async function handleRemoveSubject(id: string) {
    const result = await removeTeacherSubject(id)
    if (result.success) {
      setTeacherSubjects(teacherSubjects.filter((ts) => ts.id !== id))
    } else {
      setError(result.error)
    }
  }

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  if (!teacher) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Enseignant non trouvé</p>
        <Link href="/admin/users/teachers">
          <Button className="mt-4">Retour</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {teacher.firstName} {teacher.lastName}
        </h1>
        <div className="flex gap-2">
          <Link href="/admin/users/teachers">
            <Button variant="outline">Retour</Button>
          </Link>
          <Button variant="outline">Modifier</Button>
          <Button variant="destructive" onClick={handleDelete}>Désactiver</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("info")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "info"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Informations
          </button>
          <button
            onClick={() => setActiveTab("subjects")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "subjects"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Matières & classes
          </button>
          <button
            onClick={() => setActiveTab("grades")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "grades"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Notes saisies
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "schedule"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Emploi du temps
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tab Content: Informations */}
      {activeTab === "info" && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Prénom</p>
              <p className="text-lg font-medium">{teacher.firstName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Nom</p>
              <p className="text-lg font-medium">{teacher.lastName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg font-medium">{teacher.user.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                teacher.user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {teacher.user.active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Matières/Classes assignées</p>
            <p className="text-lg font-medium">{teacher._count.subjects} assignation(s)</p>
          </div>
        </div>
      )}

      {/* Tab Content: Matières & classes */}
      {activeTab === "subjects" && (
        <div className="space-y-6">
          {/* Add Subject Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ajouter une matière et classe</h2>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subjectId">Matière</Label>
                  <select
                    id="subjectId"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  >
                    <option value="">Sélectionner une matière</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="classroomId">Classe</Label>
                  <select
                    id="classroomId"
                    value={classroomId}
                    onChange={(e) => setClassroomId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  >
                    <option value="">Sélectionner une classe</option>
                    {classrooms.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name} ({classroom.schoolYear})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button type="submit" disabled={isAdding || !subjectId || !classroomId}>
                {isAdding ? "Ajout..." : "Ajouter"}
              </Button>
            </form>
          </div>

          {/* Teacher Subjects List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignations actuelles</h2>
            {teacherSubjects.length === 0 ? (
              <p className="text-gray-500">Aucune assignation</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matière
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Classe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teacherSubjects.map((ts) => (
                    <tr key={ts.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ts.subject.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ts.classroom.schoolGrade.name} {ts.classroom.section} ({ts.classroom.schoolYear})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveSubject(ts.id)}
                        >
                          Retirer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Notes saisies (placeholder) */}
      {activeTab === "grades" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes saisies</h2>
          <p className="text-gray-500">Historique des notes saisies par cet enseignant.</p>
          <p className="text-sm text-gray-400 mt-2">Cette fonctionnalité sera implémentée ultérieurement.</p>
        </div>
      )}

      {/* Tab Content: Emploi du temps (placeholder) */}
      {activeTab === "schedule" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Emploi du temps</h2>
          <p className="text-gray-500">Emploi du temps de l'enseignant.</p>
          <p className="text-sm text-gray-400 mt-2">Cette fonctionnalité sera implémentée ultérieurement.</p>
        </div>
      )}
    </div>
  )
}
