import { listStudents } from "@/lib/actions/student"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function StudentsPage({ searchParams }: { searchParams?: { search?: string; page?: string } }) {
  const session = await auth()
  const params = await searchParams
  const search = typeof params?.search === 'string' ? params.search : undefined
  const page = parseInt(params?.page || '1', 10) || 1

  if (!session?.user) {
    redirect("/login")
  }

  const result = await listStudents({ search, page, pageSize: 20 })

  if (!result.success) {
    return (
      <div className="p-8">
        <p className="text-red-600">Erreur : {result.error}</p>
      </div>
    )
  }

  const students = result.data

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Élèves</h1>
          <p className="text-gray-600">Liste des élèves de l'établissement</p>
        </div>
        <div className="flex gap-4">
          <form method="get" className="flex items-center" action="/admin/users/students">
            <input name="search" placeholder="Rechercher nom, prénom, email" className="border rounded px-3 py-2 mr-2" />
            <input type="hidden" name="page" value="1" />
            <Button type="submit">Rechercher</Button>
          </form>
          <Link href="/admin/users/students/new">
            <Button>Nouvel élève</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Classe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {student.lastName} {student.firstName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{student.user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {student.classroom
                      ? `${student.classroom.schoolGrade.name} ${student.classroom.section} (${student.classroom.schoolYear})`
                      : "Non assigné"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    student.user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {student.user.active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link href={`/admin/users/students/${student.id}`}>
                    <Button variant="outline" size="sm">Voir</Button>
                  </Link>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Aucun élève
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
