package model

import (
	"context"
	"pkg/ctxHelpers"
	"pkg/repository"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/schema"
)

func Test_TherapistService_DifferentLanguages_PLView(t *testing.T) {
	tables := schema.NewTables(pgdialect.New())
	tables.Register(
		(*TherapistService)(nil),
		(*Therapist)(nil),
		(*Service)(nil),
		(*User)(nil),
	)
	mp := repository.ModelParserProvider(tables)
	autoLabeller, err := repository.NewAutoLabeler("Asia/Ho_Chi_Minh")
	require.NoError(t, err)
	modelPl := &TherapistService{}
	ctxPl := ctxHelpers.SetLanguageInContext(context.Background(), "pl")
	parsedPl, err := mp.ParseModel(ctxPl, modelPl)
	err = TherapistLabel(autoLabeller)
	require.NoError(t, err)
	err = ServiceLabel(autoLabeller)
	require.NoError(t, err)
	err = autoLabeller.AutoLabel(ctxPl, parsedPl, TherapistService{})
	require.NoError(t, err)

	sqlPl := parsedPl.View.Query.String()

	expected := `
SELECT therapist_service.*,
       COALESCE(therapist_user_label.display_name, '') || ' - ' ||
       COALESCE(therapist_label.professional_title->>'pl', '')                                    AS "therapist_label",
       service_label.name->>'pl'                                                                  AS "service_label",
       DATE(TO_TIMESTAMP(core.therapist_service.created_at / 1000) AT TIME ZONE
            'Asia/Ho_Chi_Minh')                                                                     as created_at_date_label,
       created_by_label.display_name                                                                as created_by_label,
       DATE(TO_TIMESTAMP(core.therapist_service.updated_at / 1000) AT TIME ZONE
            'Asia/Ho_Chi_Minh')                                                                     as updated_at_date_label,
       updated_by_label.display_name                                                                as updated_by_label,
       DATE(TO_TIMESTAMP(core.therapist_service.deleted_at / 1000) AT TIME ZONE
            'Asia/Ho_Chi_Minh')                                                                     as deleted_at_date_label,
       deleted_by_label.display_name                                                                as deleted_by_label
FROM core.therapist_service
         LEFT JOIN core.therapist as therapist_label on therapist_label.id = core.therapist_service.therapist_id
         LEFT JOIN core.user as therapist_user_label on therapist_user_label.id = therapist_label.user_id
         LEFT JOIN core.service as service_label on service_label.id = core.therapist_service.service_id
         LEFT JOIN core.user as created_by_label on created_by_label.id = core.therapist_service.created_by
         LEFT JOIN core.user as updated_by_label on updated_by_label.id = core.therapist_service.updated_by
         LEFT JOIN core.user as deleted_by_label on deleted_by_label.id = core.therapist_service.deleted_by
`

	// Different languages should produce different SQL
	assert.Equal(t, normalizeWhitespace(expected), normalizeWhitespace(sqlPl))
}

func normalizeWhitespace(s string) string {
	// Replace all whitespace characters (including newlines) with single spaces
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.ReplaceAll(s, "\r", " ")
	s = strings.ReplaceAll(s, "\t", " ")

	// Replace multiple spaces with single space
	for strings.Contains(s, "  ") {
		s = strings.Replace(s, "  ", " ", -1)
	}

	return strings.TrimSpace(s)
}
