import { listClassrooms } from "@/lib/actions/classroom"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ClassroomsPage({ searchParams }: { searchParams?: { search?: string; page?: string } }) {
  const params = await searchParams
  const search = typeof params?.search === 'string' ? params.search : undefined
  const page = parseInt(params?.page || '1', 10) || 1
  const result = await listClassrooms({ search, page, pageSize: 20 })

  if (!result.success) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erreur : {result.error}</p>
      </div>
    )
  }

  const classrooms = result.data

  // Group by cycle, then schoolGrade, then track
  const groupedByCycle = classrooms.reduce((acc, classroom) => {
    const cycle = classroom.schoolGrade.cycle
    if (!acc[cycle]) {
      acc[cycle] = {}
    }
    const schoolGrade = classroom.schoolGrade.name
    if (!acc[cycle][schoolGrade]) {
      acc[cycle][schoolGrade] = []
    }
    acc[cycle][schoolGrade].push(classroom)
    return acc
  }, {} as Record<string, Record<string, typeof classrooms>>)

  const cycleNames: Record<string, string> = {
    PRIMARY: "Primaire",
    MIDDLE_SCHOOL: "Collège",
    HIGH_SCHOOL: "Lycée",
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600">Vue arborescente des classes</p>
        </div>
        <div className="flex gap-4">
          <form method="get" className="flex items-center" action="/admin/academics/classrooms">
            <input name="search" placeholder="Rechercher une classe" className="border rounded px-3 py-2 mr-2" />
            <input type="hidden" name="page" value="1" />
            <Button type="submit">Rechercher</Button>
          </form>
          <Link href="/admin/academics/classrooms/new">
            <Button>Nouvelle classe</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedByCycle).map(([cycle, grades]) => (
          <div key={cycle}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {cycleNames[cycle] || cycle}
            </h2>
            <div className="space-y-4 ml-4">
              {Object.entries(grades).map(([gradeName, classroomsInGrade]) => (
                <div key={gradeName}>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    {gradeName}
                  </h3>
                  <div className="space-y-2 ml-4">
                    {classroomsInGrade.map((classroom) => (
                      <div
                        key={classroom.id}
                        className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border"
                      >
                        <div>
                          <Link
                            href={`/admin/academics/classrooms/${classroom.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {classroom.schoolGrade.name}
                            {classroom.track ? ` ${classroom.track.name}` : ""} {classroom.section}
                          </Link>
                          <span className="ml-2 text-gray-500 text-sm">
                            ({classroom._count.students} élèves)
                          </span>
                          <span className="ml-2 text-gray-400 text-sm">
                            - {classroom.schoolYear}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {classrooms.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune classe créée pour le moment.
        </div>
      )}
    </div>
  )
}
