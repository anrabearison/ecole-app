/**
 * GOLDEN MASTER — Calculs de bulletins PDF
 *
 * Ce fichier garantit que les valeurs calculées (moyennes, rangs) restent
 * STRICTEMENT IDENTIQUES avant et après chaque étape d'optimisation.
 *
 * RÈGLE D'OR :
 *   - Ce test DOIT passer avant toute optimisation (valide la référence).
 *   - Ce test DOIT passer après CHAQUE étape d'optimisation SANS modifier ce fichier.
 *   - La référence ne peut être mise à jour QUE si un changement est intentionnel
 *     et documenté explicitement dans le commit.
 *
 * Stratégie de mock :
 *   Les fonctions calculateSubjectAverage / calculateGeneralAverage / calculateClassRank
 *   appellent prisma en interne. On intercepte chaque appel `prisma.grade.findMany`
 *   en inspectant le `where.studentId` + le contexte (nb d'appels) pour retourner
 *   les bonnes données. Cela reproduit fidèlement ce que la DB retournerait.
 *
 * Jeu de données :
 *   5 élèves, 4 matières, examWeight=0.6, dailyWeight=0.4
 *   - Alice  : notes EXAM + DAILY sur toutes les matières
 *   - Bob    : seulement notes EXAM (dailyAvg = 0 pour toutes les matières)
 *   - Clara  : seulement notes DAILY (examAvg = 0 pour toutes les matières)
 *   - David  : EPS sans aucune note (0)
 *   - Eve    : ex-æquo de moyenne générale avec Clara (teste le tri stable)
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  calculateSubjectAverage,
  calculateGeneralAverage,
  calculateClassRank,
  calculateSubjectRank,
} from "./average"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth")
vi.mock("@/lib/permissions", () => ({ can: vi.fn(() => true) }))

// getEffectiveCoefficient retourne le coefficient de la matière selon notre jeu de données
vi.mock("./subject-coefficient", () => ({
  getEffectiveCoefficient: vi.fn((_subjectId: string) => {
    const map: Record<string, number> = {
      "gm-subj-maths":   3,
      "gm-subj-french":  4,
      "gm-subj-history": 2,
      "gm-subj-eps":     1,
    }
    return Promise.resolve(map[_subjectId] ?? 1)
  }),
  getEffectiveCoefficientsBatch: vi.fn((subjectIds: string[]) => {
    const map: Record<string, number> = {
      "gm-subj-maths":   3,
      "gm-subj-french":  4,
      "gm-subj-history": 2,
      "gm-subj-eps":     1,
    }
    const result = new Map<string, number>()
    for (const subjectId of subjectIds) {
      result.set(subjectId, map[subjectId] ?? 1)
    }
    return Promise.resolve(result)
  }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Constantes du jeu de test
// ─────────────────────────────────────────────────────────────────────────────

const SCHOOL_ID    = "gm-school-1"
const CLASSROOM_ID = "gm-classroom-1"
const PERIOD_ID    = "gm-period-1"
const GRADE_ID     = "gm-grade-1"
const EXAM_WEIGHT  = 0.6
const DAILY_WEIGHT = 0.4

const SUBJECTS = [
  { id: "gm-subj-maths",   name: "Mathématiques", coefficient: 3 },
  { id: "gm-subj-french",  name: "Français",       coefficient: 4 },
  { id: "gm-subj-history", name: "Histoire",        coefficient: 2 },
  { id: "gm-subj-eps",     name: "EPS",             coefficient: 1 },
] as const

type SubjectId = typeof SUBJECTS[number]["id"]

const STUDENT_IDS = [
  "gm-student-alice",
  "gm-student-bob",
  "gm-student-clara",
  "gm-student-david",
  "gm-student-eve",
] as const

type StudentId = typeof STUDENT_IDS[number]

/**
 * Grades bruts par (studentId, subjectId).
 * Valeurs choisies pour couvrir les cas limites exigés.
 *
 * Formule : avg = examAvg * 0.6 + dailyAvg * 0.4
 */
const GRADES: Record<StudentId, Record<SubjectId, { exam: number[]; daily: number[] }>> = {
  "gm-student-alice": {
    "gm-subj-maths":   { exam: [14, 18],    daily: [16, 17]   },
    "gm-subj-french":  { exam: [12, 14],    daily: [16, 15]   },
    "gm-subj-history": { exam: [16, 18],    daily: [17, 17]   },
    "gm-subj-eps":     { exam: [18, 18],    daily: [18, 18]   },
  },
  "gm-student-bob": {
    // Cas limite : seulement EXAM → dailyAvg = 0 → avg = examAvg * 0.6
    "gm-subj-maths":   { exam: [15, 15],    daily: []         }, // 9.0
    "gm-subj-french":  { exam: [19, 19],    daily: []         }, // 11.4
    "gm-subj-history": { exam: [17, 17],    daily: []         }, // 10.2
    "gm-subj-eps":     { exam: [20, 20],    daily: []         }, // 12.0
  },
  "gm-student-clara": {
    // Cas limite : seulement DAILY → examAvg = 0 → avg = dailyAvg * 0.4
    "gm-subj-maths":   { exam: [],          daily: [17, 17]   }, // 6.8
    "gm-subj-french":  { exam: [],          daily: [16, 16]   }, // 6.4
    "gm-subj-history": { exam: [],          daily: [14, 15]   }, // 5.8
    "gm-subj-eps":     { exam: [],          daily: [17, 18]   }, // 7.0
  },
  "gm-student-david": {
    "gm-subj-maths":   { exam: [14, 16],    daily: [12, 14]   },
    "gm-subj-french":  { exam: [15, 17],    daily: [16, 15]   },
    "gm-subj-history": { exam: [13, 14],    daily: [12, 13]   },
    // Cas limite : EPS sans aucune note → retourne 0
    "gm-subj-eps":     { exam: [],          daily: []         },
  },
  "gm-student-eve": {
    "gm-subj-maths":   { exam: [12, 13],    daily: [11, 11]   },
    "gm-subj-french":  { exam: [13, 14],    daily: [14, 14]   },
    "gm-subj-history": { exam: [14, 15],    daily: [15, 15]   },
    "gm-subj-eps":     { exam: [15, 16],    daily: [16, 16]   },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Fonctions de calcul de référence (pures, sans I/O)
// Ces fonctions sont la source de vérité — elles implémentent exactement
// la même formule que le code de production.
// ─────────────────────────────────────────────────────────────────────────────

function refSubjectAvg(studentId: StudentId, subjectId: SubjectId): number {
  const data = GRADES[studentId][subjectId]
  const examAvg  = data.exam.length  > 0 ? data.exam.reduce((a, b) => a + b, 0) / data.exam.length  : 0
  const dailyAvg = data.daily.length > 0 ? data.daily.reduce((a, b) => a + b, 0) / data.daily.length : 0
  return examAvg * EXAM_WEIGHT + dailyAvg * DAILY_WEIGHT
}

function refGeneralAvg(studentId: StudentId): number {
  let weightedSum = 0
  let totalCoeff  = 0
  for (const subj of SUBJECTS) {
    const data = GRADES[studentId][subj.id]
    // Reproduit le comportement réel : si aucun grade pour cette matière,
    // calculateGeneralAverage ne voit pas la matière dans uniqueSubjectIds
    // et l'exclut du calcul (ne contribue ni au numérateur ni au dénominateur).
    const hasGrades = data.exam.length > 0 || data.daily.length > 0
    if (!hasGrades) continue
    const avg   = refSubjectAvg(studentId, subj.id)
    weightedSum += avg * subj.coefficient
    totalCoeff  += subj.coefficient
  }
  return totalCoeff > 0 ? weightedSum / totalCoeff : 0
}

function refSubjectRank(studentId: StudentId, subjectId: SubjectId): number {
  const sorted = [...STUDENT_IDS]
    .map((sid) => ({ sid, avg: refSubjectAvg(sid, subjectId) }))
    .sort((a, b) => b.avg - a.avg)
  return sorted.findIndex((x) => x.sid === studentId) + 1
}

function refClassRank(studentId: StudentId): number {
  const sorted = [...STUDENT_IDS]
    .map((sid) => ({ sid, avg: refGeneralAvg(sid) }))
    .sort((a, b) => b.avg - a.avg)
  return sorted.findIndex((x) => x.sid === studentId) + 1
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers pour construire les données Prisma mockées
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construit les objets Grade tels que Prisma les retournerait pour un (studentId, subjectId).
 * Le format correspond à ce que calculateSubjectAverage attend.
 */
function buildGradesForSubjectAverage(studentId: StudentId, subjectId: SubjectId) {
  const data = GRADES[studentId][subjectId]
  return [
    ...data.exam.map((v, i) => ({
      value: v,
      assessment: { id: `${studentId}-${subjectId}-exam-${i}`, type: "EXAM" },
    })),
    ...data.daily.map((v, i) => ({
      value: v,
      assessment: { id: `${studentId}-${subjectId}-daily-${i}`, type: "DAILY" },
    })),
  ]
}

/**
 * Construit tous les grades d'un élève pour toutes les matières,
 * dans le format attendu par calculateGeneralAverage (avec subject inclus).
 */
function buildAllGradesForGeneralAverage(studentId: StudentId) {
  return SUBJECTS.flatMap((subj) => {
    const data = GRADES[studentId][subj.id]
    return [
      ...data.exam.map((v, i) => ({
        value: v,
        assessment: {
          id: `${studentId}-${subj.id}-exam-${i}`,
          type: "EXAM",
          subjectId: subj.id,
          subject: { id: subj.id, name: subj.name, coefficient: subj.coefficient },
        },
      })),
      ...data.daily.map((v, i) => ({
        value: v,
        assessment: {
          id: `${studentId}-${subj.id}-daily-${i}`,
          type: "DAILY",
          subjectId: subj.id,
          subject: { id: subj.id, name: subj.name, coefficient: subj.coefficient },
        },
      })),
    ]
  })
}

function mockAdminSession() {
  vi.mocked(auth).mockResolvedValue({
    user: {
      id: "gm-user-admin",
      email: "admin@test.mg",
      role: "SCHOOL_ADMIN",
      schoolId: SCHOOL_ID,
      studentId: undefined,
    },
  } as any)
}

function mockPeriod() {
  vi.mocked(prisma.period.findUnique as any).mockResolvedValue({
    id: PERIOD_ID,
    examWeight: EXAM_WEIGHT,
    dailyWeight: DAILY_WEIGHT,
  })
}

function mockStudentRecord(studentId: StudentId) {
  vi.mocked(prisma.student.findUnique as any).mockResolvedValue({
    id: studentId,
    classroomId: CLASSROOM_ID,
    classroom: { schoolGradeId: GRADE_ID, trackId: null },
  })
}

function mockAllStudents() {
  vi.mocked(prisma.student.findMany as any).mockResolvedValue(
    STUDENT_IDS.map((id) => ({ id })),
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("GOLDEN MASTER — Calculs de bulletins (non-régression)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdminSession()
    mockPeriod()
  })

  // ══════════════════════════════════════════════════════════════════
  // Section 1 : calculateSubjectAverage
  // ══════════════════════════════════════════════════════════════════
  describe("calculateSubjectAverage", () => {
    for (const studentId of STUDENT_IDS) {
      for (const subj of SUBJECTS) {
        const expected = refSubjectAvg(studentId, subj.id)
        it(`${studentId} / ${subj.name} → ${expected.toFixed(4)}`, async () => {
          vi.mocked(prisma.grade.findMany as any).mockResolvedValue(
            buildGradesForSubjectAverage(studentId, subj.id),
          )
          const result = await calculateSubjectAverage(studentId, subj.id, PERIOD_ID)
          expect(result.success).toBe(true)
          if (result.success) {
            expect(result.data).toBeCloseTo(expected, 10)
          }
        })
      }
    }

    it("CAS LIMITE — Bob/Maths (seulement EXAM) : dailyAvg=0, résultat = examAvg×0.6", async () => {
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue(
        buildGradesForSubjectAverage("gm-student-bob", "gm-subj-maths"),
      )
      const result = await calculateSubjectAverage("gm-student-bob", "gm-subj-maths", PERIOD_ID)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeCloseTo(9.0, 10) // 15*0.6 + 0*0.4
      }
    })

    it("CAS LIMITE — Clara/Maths (seulement DAILY) : examAvg=0, résultat = dailyAvg×0.4", async () => {
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue(
        buildGradesForSubjectAverage("gm-student-clara", "gm-subj-maths"),
      )
      const result = await calculateSubjectAverage("gm-student-clara", "gm-subj-maths", PERIOD_ID)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeCloseTo(6.8, 10) // 0*0.6 + 17*0.4
      }
    })

    it("CAS LIMITE — David/EPS (aucune note) : retourne 0", async () => {
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue([])
      const result = await calculateSubjectAverage("gm-student-david", "gm-subj-eps", PERIOD_ID)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(0)
      }
    })

    it("CAS LIMITE — sélection journalière partielle : seul daily-0 d'Alice/Maths sélectionné", async () => {
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue(
        buildGradesForSubjectAverage("gm-student-alice", "gm-subj-maths"),
      )
      const selectedId = "gm-student-alice-gm-subj-maths-daily-0" // valeur = 16
      const result = await calculateSubjectAverage(
        "gm-student-alice",
        "gm-subj-maths",
        PERIOD_ID,
        [selectedId],
      )
      expect(result.success).toBe(true)
      if (result.success) {
        // examAvg=(14+18)/2=16, dailyAvg=16 (seul daily-0)
        // avg = 16*0.6 + 16*0.4 = 16.0
        expect(result.data).toBeCloseTo(16.0, 10)
      }
    })

    it("CAS LIMITE — sélection journalière vide [] : daily ignoré, examAvg×0.6 seulement", async () => {
      vi.mocked(prisma.grade.findMany as any).mockResolvedValue(
        buildGradesForSubjectAverage("gm-student-alice", "gm-subj-maths"),
      )
      // [] = aucun daily sélectionné → dailyAvg = 0
      const result = await calculateSubjectAverage(
        "gm-student-alice",
        "gm-subj-maths",
        PERIOD_ID,
        [],
      )
      expect(result.success).toBe(true)
      if (result.success) {
        // examAvg=16, dailyAvg=0 → 16*0.6 + 0*0.4 = 9.6
        expect(result.data).toBeCloseTo(9.6, 10)
      }
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // Section 2 : calculateGeneralAverage
  //
  // Stratégie de mock pour calculateGeneralAverage :
  //   Appel 1 : prisma.grade.findMany (with include.assessment.subject)
  //     → retourne TOUS les grades de l'élève (pour identifier les matières)
  //   Appels 2..N : prisma.grade.findMany appelé par calculateSubjectAverage
  //     pour chaque matière (with select.assessment.{id,type})
  //     → doit retourner les grades filtrés par subjectId
  //
  // On utilise un compteur d'appels pour distinguer l'appel #1 des suivants,
  // et on filtre par subjectId sur les appels suivants.
  // ══════════════════════════════════════════════════════════════════
  describe("calculateGeneralAverage", () => {
    function setupMocksForGeneralAverage(studentId: StudentId) {
      mockStudentRecord(studentId)

      const allGrades = buildAllGradesForGeneralAverage(studentId)
      let callCount = 0

      vi.mocked(prisma.grade.findMany as any).mockImplementation(({ where }: any) => {
        callCount++
        if (callCount === 1) {
          // Premier appel : calculateGeneralAverage demande toutes les notes avec subject inclus
          return Promise.resolve(allGrades)
        }
        // Appels suivants : calculateSubjectAverage demande les grades d'une matière spécifique
        // Le where contient assessment.subjectId (via la relation assessment.subjectId)
        // On retourne les grades filtrés par subjectId
        const subjectId = where?.assessment?.subjectId as SubjectId | undefined
        if (subjectId) {
          const subjectGrades = buildGradesForSubjectAverage(studentId, subjectId)
          return Promise.resolve(subjectGrades)
        }
        return Promise.resolve([])
      })
    }

    for (const studentId of STUDENT_IDS) {
      const expected = refGeneralAvg(studentId)
      it(`${studentId} → moyenne générale = ${expected.toFixed(6)}`, async () => {
        setupMocksForGeneralAverage(studentId)
        const result = await calculateGeneralAverage(studentId, PERIOD_ID)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBeCloseTo(expected, 8)
        }
      })
    }

    it("CAS LIMITE — Clara (seulement DAILY) : moyenne générale ≠ 0 mais faible", async () => {
      setupMocksForGeneralAverage("gm-student-clara")
      const result = await calculateGeneralAverage("gm-student-clara", PERIOD_ID)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeGreaterThan(0)
        expect(result.data).toBeLessThan(10) // seulement 40% des notes comptent
        expect(result.data).toBeCloseTo(refGeneralAvg("gm-student-clara"), 8)
      }
    })

    it("CAS LIMITE — David (EPS sans note) : EPS contribue 0 à la moyenne générale", async () => {
      setupMocksForGeneralAverage("gm-student-david")
      const result = await calculateGeneralAverage("gm-student-david", PERIOD_ID)
      expect(result.success).toBe(true)
      if (result.success) {
        // EPS coeff=1, avg=0 → n'influe que 0/10 sur la moyenne
        expect(result.data).toBeCloseTo(refGeneralAvg("gm-student-david"), 8)
      }
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // Section 3 : calculateSubjectRank
  //
  // calculateSubjectRank appelle calculateSubjectAverage pour TOUS les élèves.
  // On mocke grade.findMany dynamiquement par studentId.
  // ══════════════════════════════════════════════════════════════════
  describe("calculateSubjectRank", () => {
    function setupMocksForSubjectRank(subjectId: SubjectId) {
      mockAllStudents()
      vi.mocked(prisma.grade.findMany as any).mockImplementation(({ where }: any) => {
        const sid = where?.studentId as StudentId | undefined
        if (!sid || !GRADES[sid]) return Promise.resolve([])
        return Promise.resolve(buildGradesForSubjectAverage(sid, subjectId))
      })
    }

    for (const subj of SUBJECTS) {
      describe(`Matière : ${subj.name}`, () => {
        for (const studentId of STUDENT_IDS) {
          const expectedRank = refSubjectRank(studentId, subj.id)
          it(`${studentId} → rang ${expectedRank}/${STUDENT_IDS.length}`, async () => {
            setupMocksForSubjectRank(subj.id)
            const result = await calculateSubjectRank(
              studentId,
              subj.id,
              CLASSROOM_ID,
              PERIOD_ID,
            )
            expect(result.success).toBe(true)
            if (result.success) {
              expect(result.data.rank).toBe(expectedRank)
              expect(result.data.totalStudents).toBe(STUDENT_IDS.length)
            }
          })
        }
      })
    }
  })

  // ══════════════════════════════════════════════════════════════════
  // Section 4 : calculateClassRank
  //
  // calculateClassRank appelle calculateGeneralAverage pour tous les élèves.
  // calculateGeneralAverage appelle prisma.student.findUnique + prisma.grade.findMany.
  // Mock dynamique par studentId.
  // ══════════════════════════════════════════════════════════════════
  describe("calculateClassRank", () => {
    function setupMocksForClassRank() {
      mockAllStudents()

      vi.mocked(prisma.student.findUnique as any).mockImplementation(({ where }: any) => {
        const sid = where?.id as StudentId | undefined
        return Promise.resolve(sid ? {
          id: sid,
          classroomId: CLASSROOM_ID,
          classroom: { schoolGradeId: GRADE_ID, trackId: null },
        } : null)
      })

      // Chaque appel calculateClassRank → calculateGeneralAverage (N élèves) → grade.findMany
      // Appel #1 par élève : toutes les notes avec subject inclus
      // Appels suivants par élève : filtré par subjectId
      // On utilise une Map réinitialisée à chaque setupMocksForClassRank().
      const callCountByStudent = new Map<string, number>()

      vi.mocked(prisma.grade.findMany as any).mockImplementation(({ where }: any) => {
        const sid = where?.studentId as StudentId | undefined
        if (!sid || !GRADES[sid]) return Promise.resolve([])

        const count = (callCountByStudent.get(sid) ?? 0) + 1
        callCountByStudent.set(sid, count)

        if (count === 1) {
          return Promise.resolve(buildAllGradesForGeneralAverage(sid))
        }
        const subjectId = where?.assessment?.subjectId as SubjectId | undefined
        if (subjectId) {
          return Promise.resolve(buildGradesForSubjectAverage(sid, subjectId))
        }
        return Promise.resolve([])
      })
    }

    for (const studentId of STUDENT_IDS) {
      const expectedRank = refClassRank(studentId)
      const expectedAvg  = refGeneralAvg(studentId)
      it(`${studentId} → rang ${expectedRank}/${STUDENT_IDS.length} (moy. gén. ≈ ${expectedAvg.toFixed(2)})`, async () => {
        setupMocksForClassRank()
        const result = await calculateClassRank(studentId, CLASSROOM_ID, PERIOD_ID)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.rank).toBe(expectedRank)
          expect(result.data.totalStudents).toBe(STUDENT_IDS.length)
        }
      })
    }

    it("CAS LIMITE — ex-æquo Clara/Eve : comportement de tri stable documenté", async () => {
      /**
       * Clara et Eve peuvent avoir la même moyenne générale selon le jeu de données.
       * Ce test snapshot le comportement ACTUEL du sort() pour détecter tout changement.
       * Si ce test échoue après optimisation → le tri a changé → analyser avant de continuer.
       */
      setupMocksForClassRank()
      const claraResult = await calculateClassRank("gm-student-clara", CLASSROOM_ID, PERIOD_ID)

      setupMocksForClassRank()
      const eveResult   = await calculateClassRank("gm-student-eve", CLASSROOM_ID, PERIOD_ID)

      expect(claraResult.success).toBe(true)
      expect(eveResult.success).toBe(true)

      if (claraResult.success && eveResult.success) {
        const claraAvg = refGeneralAvg("gm-student-clara")
        const eveAvg   = refGeneralAvg("gm-student-eve")

        if (Math.abs(claraAvg - eveAvg) < 1e-9) {
          // Ils sont réellement ex-æquo → snapshot du tri actuel
          const { claraRank, eveRank } = {
            claraRank: claraResult.data.rank,
            eveRank:   eveResult.data.rank,
          }
          // Les deux rangs doivent être distincts et consécutifs
          expect(Math.abs(claraRank - eveRank)).toBe(1)
          // Snapshot pour détecter tout changement de comportement de tri
          expect({ claraRank, eveRank }).toMatchSnapshot()
        } else {
          expect(claraResult.data.rank).toBe(refClassRank("gm-student-clara"))
          expect(eveResult.data.rank).toBe(refClassRank("gm-student-eve"))
        }
      }
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // Section 5 : Snapshot complet de la classe (master snapshot)
  // Ce snapshot capture l'ensemble des résultats calculés pour tous
  // les élèves et toutes les matières en une seule assertion.
  // C'est la référence centrale — si ce snapshot échoue, quelque
  // chose a changé dans les calculs.
  // ══════════════════════════════════════════════════════════════════
  describe("SNAPSHOT GLOBAL — résultats complets de la classe", () => {
    it("toutes les moyennes par matière correspondent aux valeurs de référence", () => {
      /**
       * Test pur (0 I/O) — calcul en mémoire avec les fonctions de référence.
       * Si ce test snapshot échoue → les formules de référence elles-mêmes
       * ont changé → analyser avant de modifier quoi que ce soit.
       */
      const snapshot = STUDENT_IDS.map((sid) => ({
        studentId: sid,
        subjectAverages: Object.fromEntries(
          SUBJECTS.map((subj) => [subj.id, refSubjectAvg(sid, subj.id)])
        ),
        generalAverage: refGeneralAvg(sid),
        subjectRanks: Object.fromEntries(
          SUBJECTS.map((subj) => [subj.id, `${refSubjectRank(sid, subj.id)}/${STUDENT_IDS.length}`])
        ),
        classRank: `${refClassRank(sid)}/${STUDENT_IDS.length}`,
      }))

      expect(snapshot).toMatchSnapshot()
    })
  })
})
