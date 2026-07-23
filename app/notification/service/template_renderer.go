package service

import (
	"context"
	"fmt"

	"app/notification/model"
	"pkg/tracing"

	"github.com/cbroglie/mustache"
	"github.com/uptrace/bun"
	"go.opentelemetry.io/otel/attribute"
	"go.uber.org/zap"
)

type TemplateRenderer struct {
	db     *bun.DB
	log    *zap.Logger
	tracer *tracing.Tracer
}

func NewTemplateRenderer(db *bun.DB, log *zap.Logger) *TemplateRenderer {
	return &TemplateRenderer{
		db:     db,
		log:    log.Named("template-renderer"),
		tracer: tracing.NewTracer("template-renderer"),
	}
}

type RenderedNotification struct {
	Subject    string
	Body       string
	TemplateID string
}

func (r *TemplateRenderer) Render(ctx context.Context, eventTypeKey string, language string, deliveryMechanism int, payload map[string]any) (*RenderedNotification, error) {
	ctx, span, _ := r.tracer.Start(ctx, "template.render")
	defer span.End()

	span.SetAttributes(
		attribute.String("template.event_type_key", eventTypeKey),
		attribute.String("template.language", language),
		attribute.Int("template.delivery_mechanism", deliveryMechanism),
	)

	tmpl, err := r.loadActiveTemplate(ctx, eventTypeKey)
	if err != nil {
		return nil, fmt.Errorf("load template for %q: %w", eventTypeKey, err)
	}

	span.SetAttributes(attribute.String("template.id", tmpl.Id))

	variant := findVariant(tmpl.Variants, language, deliveryMechanism)
	if variant == nil {
		return nil, fmt.Errorf("no template variant for event_type=%q language=%q mechanism=%d", eventTypeKey, language, deliveryMechanism)
	}

	renderedBody, err := mustache.Render(variant.Body, payload)
	if err != nil {
		return nil, fmt.Errorf("render template body: %w", err)
	}

	var renderedSubject string
	if variant.Subject != nil && *variant.Subject != "" {
		renderedSubject, err = mustache.Render(*variant.Subject, payload)
		if err != nil {
			return nil, fmt.Errorf("render template subject: %w", err)
		}
	}

	return &RenderedNotification{
		Subject:    renderedSubject,
		Body:       renderedBody,
		TemplateID: tmpl.Id,
	}, nil
}

func (r *TemplateRenderer) loadActiveTemplate(ctx context.Context, eventTypeKey string) (*model.Template, error) {
	var tmpl model.Template
	err := r.db.NewSelect().
		Model(&tmpl).
		Relation("Variants", func(q *bun.SelectQuery) *bun.SelectQuery {
			return q.Where("template_variant.deleted_at IS NULL")
		}).
		Where("notification_template.event_type_key = ?", eventTypeKey).
		Where("notification_template.active = true").
		Where("notification_template.deleted_at IS NULL").
		Limit(1).
		Scan(ctx)
	if err != nil {
		return nil, err
	}
	return &tmpl, nil
}

func findVariant(variants []*model.TemplateVariant, language string, deliveryMechanism int) *model.TemplateVariant {
	for _, v := range variants {
		if v.Language == language && v.DeliveryMechanism == deliveryMechanism {
			return v
		}
	}
	return nil
}
