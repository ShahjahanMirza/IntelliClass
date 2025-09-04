CREATE OR REPLACE FUNCTION get_class_grades_comprehensive(class_id_param UUID)
RETURNS TABLE(
    id TEXT,
    "studentName" TEXT,
    "studentId" UUID,
    assignment TEXT,
    "assignmentId" UUID,
    marks INTEGER,
    "maxMarks" INTEGER,
    submitted BOOLEAN,
    "submittedAt" TIMESTAMPTZ,
    "gradedAt" TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH class_students AS (
        SELECT
            u.id AS student_id,
            u.name AS student_name
        FROM
            class_members cm
        JOIN
            users u ON cm.user_id = u.id
        WHERE
            cm.class_id = class_id_param AND cm.role = 'student'
    ),
    class_assignments AS (
        SELECT
            a.id AS assignment_id,
            a.title AS assignment_title,
            a.max_marks
        FROM
            assignments a
        WHERE
            a.class_id = class_id_param
    )
    SELECT
        COALESCE(s.id::text, (cs.student_id || '-' || ca.assignment_id)::text) AS id,
        cs.student_name AS "studentName",
        cs.student_id AS "studentId",
        ca.assignment_title AS assignment,
        ca.assignment_id AS "assignmentId",
        s.grade AS marks,
        ca.max_marks AS "maxMarks",
        (s.id IS NOT NULL) AS submitted,
        s.submitted_at AS "submittedAt",
        s.graded_at AS "gradedAt"
    FROM
        class_students cs
    CROSS JOIN
        class_assignments ca
    LEFT JOIN
        submissions s ON s.student_id = cs.student_id AND s.assignment_id = ca.assignment_id;
END;
$$;
