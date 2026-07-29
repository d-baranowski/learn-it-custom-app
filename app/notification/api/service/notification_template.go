package service

import (
	"context"
	"fmt"

	notificationv1 "app/notification/gen/notification/v1"
	"app/notification/gen/notification/v1/notificationv1connect"
	"app/notification/model"
	"pkg/api"
	"pkg/repository"
	requestv1 "pkg/request/gen/request/v1"
	"pkg/tracing"
	"pkg/unix"

	"connectrpc.com/connect"
	"github.com/uptrace/bun"
	"go.uber.org/zap"
)

type NotificationTemplateService struct {
	api.AutocompleteMethod[model.Template]
	api.GetMethod[model.Template, notificationv1.NotificationTemplate]
	api.ListMethod[model.Template, notificationv1.ListNotificationTemplateResponse]
	api.CreateMethod[model.Template, notificationv1.SaveNotificationTemplateRequest, notificationv1.NotificationTemplate]
	api.UpdateMethod[model.Template, notificationv1.SaveNotificationTemplateRequest, notificationv1.NotificationTemplate]
	api.SoftDeleteMethod[model.Template]
	api.DeleteMethod[model.Template]
}

func NotificationTemplateServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.notification_template")

	s := api.NewService[
		NotificationTemplateService,
		model.Template,
		notificationv1.NotificationTemplate,
		notificationv1.ListNotificationTemplateResponse,
		notificationv1.SaveNotificationTemplateRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	s.GetMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, id string, result *model.Template, extra *repository.ExtraInfoReqResp[requestv1.GetRequest, notificationv1.NotificationTemplate]) error {
		// Uses the OUTER transaction. This previously queried props.DB — the
		// pool — from inside the open read transaction, which is the same
		// deadlock that took core down on 2026-07-29, just in the notification
		// service. See infrastructure/INCIDENT-2026-07-29-db-pool-deadlock.md.
		var variants []*model.TemplateVariant
		if err := tx.NewSelect().
			Model(&variants).
			Where("template_id = ?", result.Id).
			Where("deleted_at IS NULL").
			Scan(ctx); err != nil {
			return err
		}
		protoVariants := make([]*notificationv1.NotificationTemplateVariant, len(variants))
		for i, v := range variants {
			protoVariants[i] = &notificationv1.NotificationTemplateVariant{
				LanguageCode:      v.Language,
				DeliveryMechanism: notificationv1.NotificationDeliveryMechanism(v.DeliveryMechanism),
				Body:              v.Body,
			}
			if v.Subject != nil {
				protoVariants[i].Subject = v.Subject
			}
		}
		extra.Response.Variants = protoVariants
		return nil
	})

	s.CreateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result *model.Template, extra *repository.ExtraInfoReqResp[notificationv1.SaveNotificationTemplateRequest, notificationv1.NotificationTemplate]) error {
		return upsertTemplateVariants(ctx, tx, result.Id, extra.Request.Variants, result.CreatedBy)
	})

	s.UpdateMethod.AddPostHook(func(ctx context.Context, tx bun.Tx, result *model.Template, extra *repository.ExtraInfoReqResp[notificationv1.SaveNotificationTemplateRequest, notificationv1.NotificationTemplate]) error {
		return upsertTemplateVariants(ctx, tx, result.Id, extra.Request.Variants, result.CreatedBy)
	})

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := notificationv1connect.NewNotificationTemplateServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}

func upsertTemplateVariants(ctx context.Context, tx bun.Tx, templateID string, variants []*notificationv1.NotificationTemplateVariant, actor string) error {
	seen := make(map[string]struct{}, len(variants))
	for _, v := range variants {
		key := fmt.Sprintf("%s:%d", v.LanguageCode, v.DeliveryMechanism)
		if _, exists := seen[key]; exists {
			return connect.NewError(connect.CodeInvalidArgument,
				fmt.Errorf("duplicate variant: language=%s mechanism=%d", v.LanguageCode, v.DeliveryMechanism))
		}
		seen[key] = struct{}{}
	}

	_, err := tx.NewDelete().
		Model((*model.TemplateVariant)(nil)).
		Where("template_id = ?", templateID).
		Exec(ctx)
	if err != nil {
		return err
	}

	if len(variants) == 0 {
		return nil
	}

	now := unix.Now()
	rows := make([]*model.TemplateVariant, len(variants))
	for i, v := range variants {
		rows[i] = &model.TemplateVariant{
			TemplateId:        templateID,
			Language:          v.LanguageCode,
			DeliveryMechanism: int(v.DeliveryMechanism),
			Subject:           v.Subject,
			Body:              v.Body,
			CreatedAt:         now,
			CreatedBy:         actor,
		}
	}

	_, err = tx.NewInsert().Model(&rows).Exec(ctx)
	return err
}

func init() {
	_ = (*NotificationTemplateService)(nil)
	_ = zap.Logger{}
}
