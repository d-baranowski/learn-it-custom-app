package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"pkg/api"
	"pkg/tracing"
)

type TeamService struct {
	api.AutocompleteMethod[model.Team]
	api.GetMethod[model.Team, corev1.Team]
	api.ListMethod[model.Team, corev1.ListTeamResponse]
	api.CreateMethod[model.Team, corev1.SaveTeamRequest, corev1.Team]
	api.UpdateMethod[model.Team, corev1.SaveTeamRequest, corev1.Team]
	api.SoftDeleteMethod[model.Team]
	api.DeleteMethod[model.Team]
}

func TeamServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.team")

	s := api.NewService[
		TeamService,
		model.Team,

		corev1.Team,
		corev1.ListTeamResponse,
		corev1.SaveTeamRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewTeamServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
