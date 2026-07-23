package model

import (
	"context"
	"pkg/ctxHelpers"
	"pkg/repository"
	"pkg/unix"

	"github.com/uptrace/bun"
)

type Therapist struct {
	repository.AutoLabel
	bun.BaseModel `bun:"table:core.therapist,alias:therapist"`

	Id                      string             `bun:"id,pk,nullzero" json:"id" rpg:"get,list,search,filter,required"`
	UserId                  *string            `bun:"user_id" json:"userId" rpg:"all"`
	UserLabel               *string            `bun:",scanonly" json:"userLabel" rpg:"get,list,search,filter"`
	UserAbbreviationLabel   *string            `bun:",scanonly" json:"userAbbreviationLabel" rpg:"get,list,search,filter"`
	DisplayColor            *string            `bun:"display_color" json:"displayColor" rpg:"all"`
	ProfessionalTitle       *TranslatedString  `bun:"professional_title" json:"professionalTitle" rpg:"all"`
	Description             *TranslatedString  `bun:"description" json:"description" rpg:"all"`
	LanguageIds             []string           `bun:"language_ids,array" json:"languageIds" rpg:"all"`
	LanguageLabels          []TranslatedString `bun:",scanonly" json:"languageLabels" rpg:"list"`
	InPersonTherapyFormat   bool               `bun:"in_person_therapy_format" json:"inPersonTherapyFormat" rpg:"all"`
	OnlineTherapyFormat     bool               `bun:"online_therapy_format" json:"onlineTherapyFormat" rpg:"all"`
	ProfileImage            *string            `bun:"profile_image" json:"profileImage" rpg:"all"`
	ContactEmail            string             `bun:"contact_email,notnull" json:"contactEmail" rpg:"all"`
	ContactPhone            *string            `bun:"contact_phone" json:"contactPhone" rpg:"all"`
	IsAcceptingNewClients   bool               `bun:"is_accepting_new_clients" json:"isAcceptingNewClients" rpg:"all"`
	Slug                    string             `bun:"slug,unique" json:"slug" rpg:"all"`
	MetaDescription         *TranslatedString  `bun:"meta_description" json:"metaDescription" rpg:"all"`
	SearchTags              []string           `bun:"search_tags,array" json:"searchTags" rpg:"all"`
	PercentageProfitSharing *float64           `bun:"percentage_profit_sharing" json:"percentageProfitSharing" rpg:"all"`

	User *User `bun:"rel:belongs-to,join:user_id=id" json:"user,omitempty"`

	CreatedAt          unix.Timestamp  `json:"createdAt"`
	CreatedAtDateLabel string          `bun:",scanonly" json:"createdAtDateLabel"`
	CreatedBy          string          `json:"createdBy"`
	CreatedByLabel     string          `bun:",scanonly" json:"createdByLabel"`
	UpdatedAt          *unix.Timestamp `json:"updatedAt"`
	UpdatedAtDateLabel string          `bun:",scanonly" json:"updatedAtDateLabel"`
	UpdatedBy          *string         `json:"updatedBy"`
	UpdatedByLabel     *string         `bun:",scanonly" json:"updatedByLabel"`
	DeletedAt          *unix.Timestamp `json:"deletedAt"`
	DeletedAtDateLabel string          `bun:",scanonly" json:"deletedAtDateLabel"`
	DeletedBy          *string         `json:"deletedBy"`
	DeletedByLabel     *string         `bun:",scanonly" json:"deletedByLabel"`
}

func (m *Therapist) View(ctx context.Context) *bun.SelectQuery {
	return repository.NoopDB.NewSelect().
		ModelTableExpr("core.therapist").
		ColumnExpr("therapist.*").
		ColumnExpr("(SELECT json_agg(lang.name) FROM core.language lang WHERE lang.id = ANY(therapist.language_ids)) as language_labels")
}

func TherapistLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "TherapistLabel", repository.LabelerConfigEntry{
		Column: "",
		ColumnFn: func(ctx context.Context) string {
			lang := ctxHelpers.GetLanguageFromContext(ctx)
			return "COALESCE(therapist_user_label.display_name, '') || ' - ' || COALESCE(therapist_label.professional_title->>'" + lang + "', '') AS \"therapist_label\""
		},
		Join: "LEFT JOIN core.therapist AS therapist_label ON therapist_label.id = %s.therapist_id LEFT JOIN core.user AS therapist_user_label ON therapist_user_label.id = therapist_label.user_id",
	})
}

func TherapistAbbreviationLabel(labeler repository.AutoLabeler) error {
	return labeler.AddLabelConfiguration(nil, "TherapistAbbreviationLabel", repository.LabelerConfigEntry{
		Column: "therapist_user_abbreviation_label.display_abbreviation as therapist_abbreviation_label",
		Join:   "LEFT JOIN core.therapist AS therapist_abbreviation_label ON therapist_abbreviation_label.id = %s.therapist_id LEFT JOIN core.user AS therapist_user_abbreviation_label ON therapist_user_abbreviation_label.id = therapist_abbreviation_label.user_id",
	})
}

func (*Therapist) Autocomplete(ctx context.Context) repository.Autocomplete {
	return repository.Autocomplete{
		Template: "{{.UserLabel}} - {{.ProfessionalTitle}}",
	}
}
