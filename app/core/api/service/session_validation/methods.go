package session_validation

import (
	corev1 "app/core/gen/core/v1"
	"app/core/model"
	"context"
	"fmt"
	"time"

	"github.com/uptrace/bun"
	"pkg/ctxHelpers"

	"connectrpc.com/connect"
	"go.uber.org/zap"
)

func (s *Service) GetSessionIssues(ctx context.Context, req *connect.Request[corev1.GetSessionIssuesRequest]) (*connect.Response[corev1.GetSessionIssuesResponse], error) {
	s.log.Debug("GetSessionIssues", zap.Any("request", req.Msg))

	if err := s.validator.Validate(req.Msg); err != nil {
		return nil, err
	}

	startDate := req.Msg.StartDate // YYYY-MM-DD
	endDate := req.Msg.EndDate     // YYYY-MM-DD

	// Fetch all relevant data for the given date range
	sessions, err := s.fetchSessions(ctx, startDate, endDate)
	if err != nil {
		s.log.Error("Failed to fetch sessions", zap.Error(err))
		return nil, err
	}

	absences, err := s.fetchAbsences(ctx, startDate, endDate)
	if err != nil {
		s.log.Error("Failed to fetch absences", zap.Error(err))
		return nil, err
	}

	workingHours, err := s.fetchWorkingHours(ctx)
	if err != nil {
		s.log.Error("Failed to fetch working hours", zap.Error(err))
		return nil, err
	}

	// Calculate all issues in memory
	var issues []*corev1.SessionIssue

	// 1. Find sessions with no room assigned
	issues = append(issues, s.findSessionsWithNoRoom(sessions)...)

	// 2. Find room overlaps
	issues = append(issues, s.findRoomOverlaps(sessions)...)

	// 3. Find therapist overlaps
	issues = append(issues, s.findTherapistOverlaps(sessions)...)

	// 4. Find therapist absence overlaps
	issues = append(issues, s.findTherapistAbsenceOverlaps(sessions, absences)...)

	// 5. Find sessions outside therapist working hours
	issues = append(issues, s.findSessionsOutsideWorkingHours(sessions, workingHours)...)

	return connect.NewResponse(&corev1.GetSessionIssuesResponse{
		Issues: issues,
	}), nil
}

// fetchSessions retrieves all sessions for the given date range with labels
func (s *Service) fetchSessions(ctx context.Context, startDate, endDate string) ([]*model.Session, error) {
	var sessions []*model.Session

	lang := ctxHelpers.GetLanguageFromContext(ctx)

	err := s.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		return tx.NewSelect().
			Model(&sessions).
			Relation("Therapy").
			Relation("Therapist").
			Relation("Therapist.User").
			Relation("Room").
			// Add label columns from the view
			Column("session.*").
			ColumnExpr("COALESCE(therapy.display_name, '') AS \"therapy_label\"").
			ColumnExpr("COALESCE(therapist__user.display_name, '') || CASE WHEN therapist.professional_title IS NOT NULL THEN ' - ' || COALESCE(therapist.professional_title->>'"+lang+"', '') ELSE '' END AS \"therapist_label\"").
			ColumnExpr("room.display_name->>'"+lang+"' AS \"room_label\"").
			Where("session.date >= ?", startDate).
			Where("session.date <= ?", endDate).
			Where("session.cancelled_at IS NULL").
			Where("session.deleted_at IS NULL").
			Scan(ctx)
	})

	if err != nil {
		return nil, err
	}

	for _, session := range sessions {
		if session.Therapist != nil && session.Therapist.Id != "" {
			session.TherapistId = session.Therapist.Id
		}

		if session.Therapy != nil && session.Therapy.Id != "" {
			session.TherapyId = &session.Therapy.Id
		}

		if session.Room != nil && session.Room.Id != "" {
			session.RoomId = &session.Room.Id
		}
	}

	return sessions, nil
}

// fetchAbsences retrieves all absences that might overlap with the date range.
// Absences use unix.Timestamp (int64 ms), so we convert date strings to timestamps for comparison.
func (s *Service) fetchAbsences(ctx context.Context, startDate, endDate string) ([]*model.Absence, error) {
	var absences []*model.Absence

	// Convert date strings to unix ms for absence comparison.
	// Use start of startDate and end of endDate in UTC as approximation.
	startT, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return nil, fmt.Errorf("invalid startDate %q: %w", startDate, err)
	}
	endT, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		return nil, fmt.Errorf("invalid endDate %q: %w", endDate, err)
	}
	// End of endDate: add 1 day
	endT = endT.AddDate(0, 0, 1)
	startMs := startT.UnixMilli()
	endMs := endT.UnixMilli()

	err = s.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		return tx.NewSelect().
			Model(&absences).
			Where("absence.from_time < ?", endMs).
			Where("absence.till_time > ?", startMs).
			Where("absence.deleted_at IS NULL").
			Scan(ctx)
	})

	if err != nil {
		return nil, err
	}

	return absences, nil
}

// fetchWorkingHours retrieves all therapist availabilities
func (s *Service) fetchWorkingHours(ctx context.Context) ([]*model.WorkingHours, error) {
	var workingHours []*model.WorkingHours

	err := s.repository.Run(ctx, func(ctx context.Context, tx bun.Tx) error {
		return tx.NewSelect().
			Model(&workingHours).
			Where("working_hours.deleted_at IS NULL").
			Scan(ctx)
	})

	if err != nil {
		return nil, err
	}

	return workingHours, nil
}

// sessionTimesOverlap checks if two sessions overlap based on their date and time strings.
// Sessions on different dates never overlap.
// On the same date, they overlap if one starts before the other ends and vice versa.
func sessionTimesOverlap(date1, start1, end1, date2, start2, end2 string) bool {
	if date1 != date2 {
		return false
	}
	// Same date: check time overlap using string comparison (HH:MM is lexicographically ordered)
	return start1 < end2 && start2 < end1
}

// sessionAbsenceOverlap checks if a session (date + start/end time + timezone) overlaps
// with an absence (unix.Timestamp range). The session is converted to unix ms for comparison.
func sessionAbsenceOverlap(session *model.Session, absenceFrom, absenceTill int64) bool {
	startMs, err := session.StartUnixMs()
	if err != nil {
		return false
	}
	endMs, err := session.EndUnixMs()
	if err != nil {
		return false
	}
	return startMs < absenceTill && endMs > absenceFrom
}

// sessionToIssue creates a SessionIssue with the shared fields populated from the session.
func sessionToIssue(session *model.Session) *corev1.SessionIssue {
	var therapistId *string
	if session.Therapist != nil && session.Therapist.Id != "" {
		therapistId = &session.TherapistId
	}

	var therapistLabel *string
	if session.TherapistLabel != "" {
		therapistLabel = &session.TherapistLabel
	}

	var therapyLabel *string
	if session.TherapyLabel != "" {
		therapyLabel = &session.TherapyLabel
	}

	var roomLabel *string
	if session.RoomLabel != nil {
		roomLabel = session.RoomLabel
	}

	var roomId *string
	if session.Room != nil && session.Room.Id != "" {
		roomId = &session.Room.Id
	}

	return &corev1.SessionIssue{
		SessionId:      session.Id,
		Date:           model.NormalizeDateString(session.Date),
		StartTime:      session.StartTime,
		EndTime:        session.EndTime,
		TherapistId:    therapistId,
		TherapistLabel: therapistLabel,
		TherapyLabel:   therapyLabel,
		RoomId:         roomId,
		RoomLabel:      roomLabel,
	}
}

// findSessionsWithNoRoom finds all sessions without a room assignment
func (s *Service) findSessionsWithNoRoom(sessions []*model.Session) []*corev1.SessionIssue {
	issues := make([]*corev1.SessionIssue, 0)

	for _, session := range sessions {
		if session.RoomId == nil || *session.RoomId == "" {
			issue := sessionToIssue(session)
			issue.IssueType = "no_room"
			issue.Description = "This session does not have a room assigned"
			issues = append(issues, issue)
		}
	}

	return issues
}

// findRoomOverlaps finds sessions that overlap in the same room
func (s *Service) findRoomOverlaps(sessions []*model.Session) []*corev1.SessionIssue {
	issues := make([]*corev1.SessionIssue, 0)

	// Group sessions by room
	sessionsByRoom := make(map[string][]*model.Session)
	for _, session := range sessions {
		if session.RoomId != nil && *session.RoomId != "" {
			roomId := *session.RoomId
			sessionsByRoom[roomId] = append(sessionsByRoom[roomId], session)
		}
	}

	// Check for overlaps within each room
	for _, roomSessions := range sessionsByRoom {
		for i := 0; i < len(roomSessions); i++ {
			for j := i + 1; j < len(roomSessions); j++ {
				s1 := roomSessions[i]
				s2 := roomSessions[j]

				if sessionTimesOverlap(s1.Date, s1.StartTime, s1.EndTime, s2.Date, s2.StartTime, s2.EndTime) {
					conflictLabel := fmt.Sprintf("%s - %s %s", s2.TherapyLabel, s2.Date, s2.StartTime)

					issue := sessionToIssue(s1)
					issue.IssueType = "room_overlap"
					issue.Description = fmt.Sprintf("This session overlaps with '%s' in the same room", conflictLabel)
					issue.ConflictingSessionId = &s2.Id
					issue.ConflictingSessionLabel = &conflictLabel

					issues = append(issues, issue)
				}
			}
		}
	}

	return issues
}

// findTherapistOverlaps finds sessions where a therapist is double-booked
func (s *Service) findTherapistOverlaps(sessions []*model.Session) []*corev1.SessionIssue {
	issues := make([]*corev1.SessionIssue, 0)

	// Group sessions by therapist
	sessionsByTherapist := make(map[string][]*model.Session)
	for _, session := range sessions {
		sessionsByTherapist[session.TherapistId] = append(sessionsByTherapist[session.TherapistId], session)
	}

	// Check for overlaps within each therapist's schedule
	for _, therapistSessions := range sessionsByTherapist {
		for i := 0; i < len(therapistSessions); i++ {
			for j := i + 1; j < len(therapistSessions); j++ {
				s1 := therapistSessions[i]
				s2 := therapistSessions[j]

				if sessionTimesOverlap(s1.Date, s1.StartTime, s1.EndTime, s2.Date, s2.StartTime, s2.EndTime) {
					conflictLabel := fmt.Sprintf("%s - %s %s", s2.TherapyLabel, s2.Date, s2.StartTime)

					issue := sessionToIssue(s1)
					issue.IssueType = "therapist_overlap"
					issue.Description = fmt.Sprintf("This session overlaps with '%s' for the same therapist", conflictLabel)
					issue.ConflictingSessionId = &s2.Id
					issue.ConflictingSessionLabel = &conflictLabel

					issues = append(issues, issue)
				}
			}
		}
	}

	return issues
}

// findTherapistAbsenceOverlaps finds sessions scheduled during therapist absences
func (s *Service) findTherapistAbsenceOverlaps(sessions []*model.Session, absences []*model.Absence) []*corev1.SessionIssue {
	issues := make([]*corev1.SessionIssue, 0)

	// Group absences by therapist for efficient lookup
	absencesByTherapist := make(map[string][]*model.Absence)
	for _, absence := range absences {
		if absence.TherapistId != nil {
			absencesByTherapist[*absence.TherapistId] = append(absencesByTherapist[*absence.TherapistId], absence)
		}
	}

	// Check each session against absences for the same therapist
	for _, session := range sessions {
		therapistAbsences := absencesByTherapist[session.TherapistId]

		for _, absence := range therapistAbsences {
			if sessionAbsenceOverlap(session, absence.FromTime.Int64(), absence.TillTime.Int64()) {
				description := "This session is scheduled during a therapist absence"
				if absence.Reason != nil && *absence.Reason != "" {
					description = fmt.Sprintf("This session is scheduled during a therapist absence: %s", *absence.Reason)
				}

				issue := sessionToIssue(session)
				issue.IssueType = "therapist_absence_overlap"
				issue.Description = description
				issue.AbsenceId = &absence.Id
				issue.AbsenceReason = absence.Reason

				issues = append(issues, issue)
			}
		}
	}

	return issues
}

// findSessionsOutsideWorkingHours finds sessions scheduled outside therapist working hours
func (s *Service) findSessionsOutsideWorkingHours(sessions []*model.Session, workingHours []*model.WorkingHours) []*corev1.SessionIssue {
	issues := make([]*corev1.SessionIssue, 0)

	// Group working hours by therapist for efficient lookup
	workingHoursByTherapist := make(map[string][]*model.WorkingHours)
	for _, workingHour := range workingHours {
		workingHoursByTherapist[workingHour.TherapistId] = append(workingHoursByTherapist[workingHour.TherapistId], workingHour)
	}

	// Check each session against working hours for the same therapist
	for _, session := range sessions {
		therapistWorkingHours := workingHoursByTherapist[session.TherapistId]

		// Parse session date to get day of week
		sessionDate, err := time.Parse("2006-01-02", model.NormalizeDateString(session.Date))
		if err != nil {
			s.log.Warn("failed to parse session date", zap.String("date", session.Date), zap.Error(err))
			continue
		}
		sessionDayOfWeek := int(sessionDate.Weekday())
		if sessionDayOfWeek == 0 {
			sessionDayOfWeek = 7 // Convert Sunday from 0 to 7 for ISO day of week
		}

		// Session times are already in HH:MM format. WorkingHours fromTime/tillTime are HH:MM:SS.
		// Append ":00" to session times for consistent comparison.
		sessionStartTime := session.StartTime + ":00"
		sessionEndTime := session.EndTime + ":00"

		// Check if the session falls within any working hours slot
		isWithinWorkingHours := false
		for _, workingHour := range therapistWorkingHours {
			if workingHour.DayOfWeek == sessionDayOfWeek &&
				sessionStartTime >= workingHour.FromTime &&
				sessionEndTime <= workingHour.TillTime {
				isWithinWorkingHours = true
				break
			}
		}

		if !isWithinWorkingHours {
			dayName := sessionDate.Weekday().String()
			description := fmt.Sprintf("This session is scheduled outside the therapist's working hours on %s", dayName)

			issue := sessionToIssue(session)
			issue.IssueType = "outside_working_hours"
			issue.Description = description

			issues = append(issues, issue)
		}
	}

	return issues
}
