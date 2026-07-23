package service

import (
	"context"
	"fmt"
	"pkg/repository"

	"github.com/uptrace/bun"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type CommonService interface {
	GetIDMapByName(ctx context.Context, tx bun.Tx, tableModel interface{}, nameColumn string, names []string) (map[string]string, error)
}

type commonService struct {
	log      *zap.Logger
	timezone string
}

type CommonServiceProps struct {
	fx.In
	Log    *zap.Logger
	Config *repository.Config
}

func CommonServiceProvider(props CommonServiceProps) (CommonService, error) {
	result := &commonService{
		log:      props.Log,
		timezone: props.Config.Timezone,
	}

	return result, nil
}

// GetIDMapByName retrieves a map of entity names to IDs based on the given table model and column name.
func (c commonService) GetIDMapByName(ctx context.Context, tx bun.Tx, tableModel interface{}, nameColumn string, names []string) (map[string]string, error) {
	// Query to fetch IDs based on names
	var records []struct {
		ID   string `bun:"id"`   // Updated ID type to string
		Name string `bun:"name"` // Assumes `name` column exists for entity name
	}

	err := tx.NewSelect().
		Model(tableModel).
		Column("id", nameColumn).
		Where(fmt.Sprintf("%s IN (?)", nameColumn), bun.In(names)).
		Scan(ctx, &records)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch IDs for %s: %w", nameColumn, err)
	}

	// Map names to IDs
	idMap := make(map[string]string)
	for _, record := range records {
		idMap[record.Name] = record.ID
	}

	return idMap, nil
}
