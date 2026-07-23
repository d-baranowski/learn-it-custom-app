package service

import (
	corev1 "app/core/gen/core/v1"
	"app/core/gen/core/v1/corev1connect"
	"app/core/model"
	"pkg/api"
	"pkg/tracing"
)

type IssuesAndSuggestionsService struct {
	api.AutocompleteMethod[model.IssuesAndSuggestions]
	api.GetMethod[model.IssuesAndSuggestions, corev1.IssuesAndSuggestions]
	api.ListMethod[model.IssuesAndSuggestions, corev1.ListIssuesAndSuggestionsResponse]
	api.CreateMethod[model.IssuesAndSuggestions, corev1.SaveIssuesAndSuggestionsRequest, corev1.IssuesAndSuggestions]
	api.UpdateMethod[model.IssuesAndSuggestions, corev1.SaveIssuesAndSuggestionsRequest, corev1.IssuesAndSuggestions]
	api.SoftDeleteMethod[model.IssuesAndSuggestions]
	api.DeleteMethod[model.IssuesAndSuggestions]
}

func IssuesAndSuggestionsServiceProvider(props ApiServiceProps) error {
	tracer := tracing.NewTracer("api.issues_and_suggestions")

	s := api.NewService[
		IssuesAndSuggestionsService,
		model.IssuesAndSuggestions,

		corev1.IssuesAndSuggestions,
		corev1.ListIssuesAndSuggestionsResponse,
		corev1.SaveIssuesAndSuggestionsRequest](
		props.DB,
		tracer,
		props.ModelParser,
		props.ViewEngine,
	)

	combined, err := api.CombinedInterceptors()
	if err != nil {
		return err
	}

	path, h := corev1connect.NewIssuesAndSuggestionsServiceHandler(s, combined)
	props.ApiServer.AddHandler(path, h)

	return nil
}
