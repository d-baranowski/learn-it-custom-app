package repository

import (
	"context"
	"errors"
	"fmt"
	"pkg/ctxHelpers"
	"pkg/util"
	"reflect"
	"strings"

	"go.uber.org/zap"
)

// AutoLabel will populate any known label fields and panic on an unknown label context or label
type AutoLabel struct {
	log *zap.Logger
}

type LabelerConfigEntry struct {
	Column   string
	ColumnFn func(ctx context.Context) string
	Join     string
	JoinFn   func(ctx context.Context) string
}

type AutoLabeler interface {
	AutoLabel(context.Context, *Model, interface{}) error
	AddLabelConfiguration(context *string, fieldName string, labeler LabelerConfigEntry) error
	// HasLabelConfig reports whether a labeler entry exists for the given
	// field name under the given context (nil = "default"). Intended for
	// startup/static checks that catch missing registrations before they
	// panic at request time.
	HasLabelConfig(context *string, fieldName string) bool
}

type autoLabeler struct {
	log           *zap.Logger
	labelledTypes map[string]struct{}
	labelConfigs  map[string]map[string]LabelerConfigEntry // context -> fieldName -> LabelerConfigEntry
}

func NewAutoLabeler(timezone string) (AutoLabeler, error) {
	result := &autoLabeler{
		labelledTypes: make(map[string]struct{}),
		labelConfigs:  make(map[string]map[string]LabelerConfigEntry),
		log:           zap.L().Named("AutoLabeler"),
	}

	err := result.AddLabelConfiguration(util.PStr("test"), "TestLabel", LabelerConfigEntry{
		Column: "test_label_alias.label as test_label",
		Join:   "left join test_label as test_label_alias on test_label_alias.id = %s.test_id",
	})

	if err != nil {
		return nil, err
	}

	err = result.AddLabelConfiguration(nil, "CreatedByLabel", LabelerConfigEntry{
		Column: "created_by_label.display_name as created_by_label",
		Join:   "left join core.user as created_by_label on created_by_label.id = %s.created_by",
	})

	if err != nil {
		return nil, err
	}

	err = result.AddLabelConfiguration(nil, "CreatedAtDateLabel", LabelerConfigEntry{
		Column: "DATE(TO_TIMESTAMP(%s.created_at / 1000) AT TIME ZONE '" + timezone + "') as created_at_date_label",
	})

	if err != nil {
		return nil, err
	}

	err = result.AddLabelConfiguration(nil, "UpdatedByLabel", LabelerConfigEntry{
		Column: "updated_by_label.display_name as updated_by_label",
		Join:   "left join core.user as updated_by_label on updated_by_label.id = %s.updated_by",
	})

	if err != nil {
		return nil, err
	}

	err = result.AddLabelConfiguration(nil, "UpdatedAtDateLabel", LabelerConfigEntry{
		Column: "DATE(TO_TIMESTAMP(%s.updated_at / 1000) AT TIME ZONE '" + timezone + "') as updated_at_date_label",
	})

	if err != nil {
		return nil, err
	}

	err = result.AddLabelConfiguration(nil, "DeletedByLabel", LabelerConfigEntry{
		Column: "deleted_by_label.display_name as deleted_by_label",
		Join:   "left join core.user as deleted_by_label on deleted_by_label.id = %s.deleted_by",
	})

	if err != nil {
		return nil, err
	}

	err = result.AddLabelConfiguration(nil, "DeletedAtDateLabel", LabelerConfigEntry{
		Column: "DATE(TO_TIMESTAMP(%s.deleted_at / 1000) AT TIME ZONE '" + timezone + "') as deleted_at_date_label",
	})

	if err != nil {
		return nil, err
	}

	return result, nil
}

func AutoLabelerProvider(config *Config) (AutoLabeler, error) {
	return NewAutoLabeler(config.Timezone)
}

func (a *autoLabeler) AddLabelConfiguration(context *string, fieldName string, labeler LabelerConfigEntry) error {
	c := "default"
	if context != nil {
		c = *context
	}

	if a.labelConfigs[c] == nil {
		a.labelConfigs[c] = make(map[string]LabelerConfigEntry)
	}

	a.labelConfigs[c][fieldName] = labeler
	return nil
}

func (a *autoLabeler) HasLabelConfig(context *string, fieldName string) bool {
	c := "default"
	if context != nil {
		c = *context
	}
	configs, ok := a.labelConfigs[c]
	if !ok {
		return false
	}
	_, ok = configs[fieldName]
	return ok
}

func (a *autoLabeler) AutoLabel(ctx context.Context, mod *Model, row interface{}) error {
	lng := ctxHelpers.GetLanguageFromContext(ctx)
	a.log.Info(fmt.Sprintf("AutoLabeling row for model: %s and lng: %s \n", mod.View.TableName, lng))
	rowType := reflect.TypeOf(row)
	mapKey := rowType.Name() + "_" + lng

	if _, ok := a.labelledTypes[mapKey]; ok {
		return nil
	}

	if rowType.Kind() != reflect.Struct {
		if rowType.Kind() == reflect.Ptr {
			rowType = rowType.Elem()
			if rowType.Kind() != reflect.Struct {
				return errors.New("autoLabel row input must be a struct")
			}
		}
	}

	for i := 0; i < rowType.NumField(); i++ {
		field := rowType.Field(i)

		if field.Name == "AutoLabel" {
			continue
		}

		var labelers map[string]LabelerConfigEntry

		labelTag := field.Tag.Get("label")
		if labelTag == "" {
			labelers = a.labelConfigs["default"]
		} else {
			parts := strings.Split(labelTag, ",")
			// zero should be the label context
			labelContext := parts[0]
			if labelContext == "" {
				panic(fmt.Errorf("label tag requires a context"))
			}

			if labelContext == "-" {
				continue
			}

			var ok = false
			labelers, ok = a.labelConfigs[labelContext]
			if !ok {
				panic(fmt.Errorf("unknown label context %s", labelContext))
			}
		}

		if labeler, ok := labelers[field.Name]; ok {
			a.log.Debug("Applying label for field: " + field.Name)
			column := labeler.Column
			a.log.Debug("Using column: " + column)
			if labeler.ColumnFn != nil {
				lang := ctxHelpers.GetLanguageFromContext(ctx)
				a.log.Debug("Using ColumnFn for field:" + field.Name + " lang: " + lang)
				column = labeler.ColumnFn(ctx)
			}

			join := labeler.Join
			if labeler.JoinFn != nil {
				join = labeler.JoinFn(ctx)
			}

			// check if the column needs sprintf
			if strings.Contains(column, "%s") {
				var args []any
				// check how many %s are in the column string
				for i := 0; i < strings.Count(column, "%s"); i++ {
					args = append(args, mod.BunTable.Name)
				}

				exists := false
				expr := fmt.Sprintf(column, args...)
				for _, expression := range mod.ViewColumnExpressions {
					if expression == expr {
						exists = true
						break
					}
				}

				if !exists {
					mod.ViewColumnExpressions = append(mod.ViewColumnExpressions, expr)
					mod.View.Query.ColumnExpr(expr)
				} else {
					a.log.Debug("Skipping duplicate column expression:" + expr)
				}
			} else {
				expr := column
				exists := false
				for _, expression := range mod.ViewColumnExpressions {
					if expression == expr {
						exists = true
						break
					}
				}

				if !exists {
					mod.ViewColumnExpressions = append(mod.ViewColumnExpressions, expr)
					mod.View.Query.ColumnExpr(column)
				} else {
					a.log.Debug("Skipping duplicate column expression:" + expr)
				}
			}

			mjoin := strings.Split(strings.ToLower(join), "left join")
			for _, part := range mjoin {
				part = strings.TrimSpace(part)
				if part == "" {
					continue
				}
				join = "LEFT JOIN " + part
				if join != "" {
					exists := false
					for _, j := range mod.JoinExpressions {
						if j == join {
							exists = true
							break
						}
					}

					if !exists {
						mod.JoinExpressions = append(mod.JoinExpressions, join)
						// use pgErr
						var args []any
						// check how many %s are in the join string
						for i := 0; i < strings.Count(join, "%s"); i++ {
							args = append(args, mod.BunTable.Name)
						}

						printed := fmt.Sprintf(join, args...)
						a.log.Debug("Adding join expression: " + printed)
						mod.View.Query.Join(printed)
					}
				}
			}

		} else {
			// check if field name ends with Label
			if strings.HasSuffix(field.Name, "Label") {
				panic(fmt.Errorf("unknown label field %s", field.Name))
			}
		}
	}

	a.labelledTypes[mapKey] = struct{}{}

	return nil
}
