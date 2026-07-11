import { listGradesForAdmin } from "@/lib/actions/grade"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminGradesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const result = await listGradesForAdmin()

  if (!result.success) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erreur : {result.error}</p>
      </div>
    )
  }

  const grades = result.data

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
        <p className="text-gray-600 mt-2">Vue globale de toutes les notes de l'école</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-4">
          <select className="border rounded px-3 py-2">
            <option value="">Toutes les classes</option>
            {/* TODO: Populate with actual classrooms */}
          </select>
          <select className="border rounded px-3 py-2">
            <option value="">Toutes les matières</option>
            {/* TODO: Populate with actual subjects */}
          </select>
          <select className="border rounded px-3 py-2">
            <option value="">Tous les enseignants</option>
            {/* TODO: Populate with actual teachers */}
          </select>
          <select className="border rounded px-3 py-2">
            <option value="">Tous les types</option>
            <option value="EXAM">Examen</option>
            <option value="DAILY">Journalière</option>
          </select>
          <input
            type="date"
            className="border rounded px-3 py-2"
            placeholder="Date début"
          />
          <input
            type="date"
            className="border rounded px-3 py-2"
            placeholder="Date fin"
          />
        </div>
      </div>

      {/* Grades List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Élève
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Matière
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Classe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enseignant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Note
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {grades.map((grade) => (
              <tr key={grade.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {grade.student.lastName} {grade.student.firstName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{grade.subject.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {grade.classroom.schoolGrade.name} {grade.classroom.section} ({grade.classroom.schoolYear})
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {grade.teacher.lastName} {grade.teacher.firstName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    grade.type === 'EXAM' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {grade.type === 'EXAM' ? 'Examen' : 'Journalière'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{grade.value}/20</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(grade.date).toLocaleDateString('fr-FR')}
                  </div>
                </td>
              </tr>
            ))}
            {grades.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Aucune note
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
