import { query } from '../db.ts';

export interface StudentSubjectResult {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  maxScore: number;
  passScore: number;
  assessments: {
    assessmentId: number;
    assessmentName: string;
    maxScore: number;
    weight: number;
    score: number | null;
    status: string;
    source: string;
  }[];
  subjectTotal: number;
  grade: string;
  gradePoint: number;
  passed: boolean;
  remarks: string;
  hasIncomplete: boolean;
}

export interface StudentTermSummary {
  studentId: number;
  admissionNo: string;
  studentName: string;
  gender: string;
  className: string;
  sectionName: string;
  subjects: StudentSubjectResult[];
  overallTotal: number;
  overallMax: number;
  overallAverage: number;
  overallGrade: string;
  overallGpa: number;
  passed: boolean;
  rank?: number;
  teacherComment?: string;
  hasSpecialStatus?: boolean;
}

export async function calculateSectionResults(termId: number, sectionId: number): Promise<StudentTermSummary[]> {
  // 1. Fetch grading scales
  const scalesRes = await query('SELECT * FROM grading_scales ORDER BY min_score DESC');
  const gradingScales = scalesRes.rows;

  // 2. Fetch all enrolled students in this section
  const studentsRes = await query(`
    SELECT s.id, s.admission_no, s.first_name, s.last_name, s.gender,
           c.name as class_name, sec.section_name
    FROM students s
    JOIN sections sec ON s.section_id = sec.id
    JOIN classes c ON sec.class_id = c.id
    WHERE s.section_id = $1 AND s.status = 'active'
    ORDER BY s.admission_no ASC
  `, [sectionId]);

  const students = studentsRes.rows;

  // 3. Fetch all class subjects (offerings) for this section
  const csRes = await query(`
    SELECT cs.id as class_subject_id, sub.id as subject_id, sub.subject_code, sub.subject_name,
           sub.max_score, sub.pass_score
    FROM class_subjects cs
    JOIN subjects sub ON cs.subject_id = sub.id
    WHERE cs.section_id = $1
    ORDER BY sub.subject_name ASC
  `, [sectionId]);

  const classSubjects = csRes.rows;

  // 4. Fetch all assessments for this term and these class_subjects
  const assmtsRes = await query(`
    SELECT a.id, a.class_subject_id, a.name, a.max_score, a.weight, a.source_type, a.exam_id
    FROM assessments a
    JOIN class_subjects cs ON a.class_subject_id = cs.id
    WHERE cs.section_id = $1 AND a.term_id = $2
    ORDER BY a.id ASC
  `, [sectionId, termId]);

  const assessments = assmtsRes.rows;

  // 5. Fetch all marks recorded
  const marksRes = await query(`
    SELECT m.assessment_id, m.student_id, m.score, m.mark_status, m.source
    FROM marks m
    JOIN assessments a ON m.assessment_id = a.id
    JOIN class_subjects cs ON a.class_subject_id = cs.id
    WHERE cs.section_id = $1 AND a.term_id = $2
  `, [sectionId, termId]);

  const marksMap = new Map<string, any>();
  for (const row of marksRes.rows) {
    marksMap.set(`${row.assessment_id}_${row.student_id}`, row);
  }

  // 6. Fetch comments
  const commentsRes = await query(`
    SELECT student_id, comment FROM teacher_comments WHERE term_id = $1
  `, [termId]);
  const commentsMap = new Map<number, string>();
  for (const c of commentsRes.rows) {
    commentsMap.set(c.student_id, c.comment);
  }

  function getGrade(score: number) {
    for (const scale of gradingScales) {
      if (score >= parseFloat(scale.min_score)) {
        return {
          grade: scale.grade,
          gradePoint: parseFloat(scale.grade_point),
          isPass: scale.is_pass,
          remarks: scale.remarks
        };
      }
    }
    return { grade: 'F', gradePoint: 0.0, isPass: false, remarks: 'Fail' };
  }

  const summaries: StudentTermSummary[] = [];

  for (const student of students) {
    const studentSubjects: StudentSubjectResult[] = [];
    let grandTotalWeighted = 0;
    let grandMax = 0;
    let hasFailedAnySubject = false;
    let anyIncomplete = false;

    for (const cs of classSubjects) {
      const subjectAssmts = assessments.filter(a => a.class_subject_id === cs.class_subject_id);
      let subjectWeightedScore = 0;
      let totalWeight = 0;
      let hasSpecialStatus = false;

      const assmtDetails = subjectAssmts.map(a => {
        const key = `${a.id}_${student.id}`;
        const mark = marksMap.get(key);
        const score = mark && mark.score !== null ? parseFloat(mark.score) : null;
        const status = mark ? mark.mark_status : 'incomplete';
        const weight = parseFloat(a.weight);
        const maxScore = parseFloat(a.max_score);

        if (status === 'scored' && score !== null) {
          // Weighted component: (score / maxScore) * weight
          subjectWeightedScore += (score / maxScore) * weight;
          totalWeight += weight;
        } else if (status === 'exempt' || status === 'excused') {
          // Excused doesn't penalize total denominator if calibrated, or counts toward excused
          hasSpecialStatus = true;
        } else {
          anyIncomplete = true;
        }

        return {
          assessmentId: a.id,
          assessmentName: a.name,
          maxScore,
          weight,
          score,
          status,
          source: mark ? mark.source : a.source_type
        };
      });

      // Subject final percentage/total (usually out of 100)
      const finalSubjectScore = Math.round(subjectWeightedScore * 100) / 100;
      const gradeInfo = getGrade(finalSubjectScore);
      const passed = finalSubjectScore >= parseFloat(cs.pass_score);
      if (!passed) hasFailedAnySubject = true;

      studentSubjects.push({
        subjectId: cs.subject_id,
        subjectCode: cs.subject_code,
        subjectName: cs.subject_name,
        maxScore: parseFloat(cs.max_score),
        passScore: parseFloat(cs.pass_score),
        assessments: assmtDetails,
        subjectTotal: finalSubjectScore,
        grade: gradeInfo.grade,
        gradePoint: gradeInfo.gradePoint,
        passed,
        remarks: gradeInfo.remarks,
        hasIncomplete: anyIncomplete
      });

      grandTotalWeighted += finalSubjectScore;
      grandMax += parseFloat(cs.max_score);
    }

    const subjectCount = studentSubjects.length || 1;
    const overallAverage = Math.round((grandTotalWeighted / subjectCount) * 100) / 100;
    const overallGradeInfo = getGrade(overallAverage);
    const overallGpa = Math.round((studentSubjects.reduce((acc, s) => acc + s.gradePoint, 0) / subjectCount) * 100) / 100;

    summaries.push({
      studentId: student.id,
      admissionNo: student.admission_no,
      studentName: `${student.first_name} ${student.last_name}`,
      gender: student.gender,
      className: student.class_name,
      sectionName: student.section_name,
      subjects: studentSubjects,
      overallTotal: Math.round(grandTotalWeighted * 100) / 100,
      overallMax: grandMax,
      overallAverage,
      overallGrade: overallGradeInfo.grade,
      overallGpa,
      passed: !hasFailedAnySubject && overallAverage >= 50.0,
      teacherComment: commentsMap.get(student.id) || '',
      hasSpecialStatus: anyIncomplete
    });
  }

  // Calculate competition/dense ranks based on overallAverage descending
  summaries.sort((a, b) => b.overallAverage - a.overallAverage);
  let currentRank = 1;
  for (let i = 0; i < summaries.length; i++) {
    if (i > 0 && summaries[i].overallAverage === summaries[i - 1].overallAverage) {
      summaries[i].rank = summaries[i - 1].rank;
    } else {
      summaries[i].rank = currentRank;
    }
    currentRank++;
  }

  return summaries;
}
