import { listSchoolGrades } from "@/lib/actions/school-grade"
import Link from "next/link"

export default async function SchoolGradesPage() {
  const result = await listSchoolGrades()

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Niveaux scolaires</h1>
        <div className="text-red-600">{result.error}</div>
      </div>
    )
  }

  const grades = result.data

  // Group by cycle
  const byCycle = grades.reduce((acc, grade) => {
    if (!acc[grade.cycle]) {
      acc[grade.cycle] = []
    }
    acc[grade.cycle].push(grade)
    return acc
  }, {} as Record<string, typeof grades>)

  const cycleLabels: Record<string, string> = {
    PRIMARY: "Primaire",
    MIDDLE_SCHOOL: "Collège",
    HIGH_SCHOOL: "Lycée",
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Niveaux scolaires</h1>
        <Link
          href="/admin/academics/grades/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Créer un niveau
        </Link>
      </div>

      {Object.entries(byCycle).map(([cycle, cycleGrades]) => (
        <div key={cycle} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{cycleLabels[cycle] || cycle}</h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ordre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Séries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cycleGrades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {grade.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {grade.order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {grade.tracks.length > 0 ? grade.tracks.map(t => t.name).join(", ") : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {grade.classrooms.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {grades.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucun niveau scolaire créé. Créez le premier niveau pour commencer.
        </div>
      )}
    </div>
  )
}
