package api

import (
	"errors"
	apiv1 "pkg/api/gen/api/v1"

	"connectrpc.com/connect"
	"github.com/bufbuild/protovalidate-go"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5/pgconn"
	"google.golang.org/genproto/googleapis/rpc/errdetails"
)

func ValidationErrorHandler(err error) *connect.Error {
	// Type assert to get the underlying protovalidate.ValidationError
	var valErr *protovalidate.ValidationError
	if !errors.As(err, &valErr) {
		// If it's not a validation error, return it as an internal error
		return connect.NewError(connect.CodeInternal, err)
	}

	resultErr := connect.NewError(connect.CodeInvalidArgument, valErr)

	// Create google.rpc.BadRequest detail with field violations
	badRequest := &errdetails.BadRequest{}
	for _, violation := range valErr.Violations {
		badRequest.FieldViolations = append(badRequest.FieldViolations, &errdetails.BadRequest_FieldViolation{
			Field:       violation.GetFieldPath(),
			Description: violation.GetMessage(),
		})
	}

	// Create our custom ValidationError detail
	validationErr := &apiv1.ValidationError{}
	for _, violation := range valErr.Violations {
		validationErr.Violations = append(validationErr.Violations, &apiv1.ValidationError_FieldViolation{
			Field:        violation.GetFieldPath(),
			ConstraintId: violation.GetConstraintId(),
			Message:      violation.GetMessage(),
		})
	}

	// Add both details to the error
	badRequestDetail, _ := connect.NewErrorDetail(badRequest)
	resultErr.AddDetail(badRequestDetail)

	validationDetail, _ := connect.NewErrorDetail(validationErr)
	resultErr.AddDetail(validationDetail)

	return resultErr
}

func CommonApiErrorHandler(err error) *connect.Error {
	// If it's already a ConnectRPC error, return it as-is to preserve the status code
	var cerr *connect.Error
	if errors.As(err, &cerr) {
		return cerr
	}

	var pgErr *pgconn.PgError
	ok := errors.As(err, &pgErr)

	if ok {
		switch pgErr.Code {
		case pgerrcode.UniqueViolation:
			resultErr := connect.NewError(connect.CodeInvalidArgument, err)
			detail, _ := connect.NewErrorDetail(&apiv1.MustBeUniqueError{
				PropertyName: pgErr.ColumnName,
				Message:      "Can't set property because another row already has that value and it must be unique",
			})
			resultErr.AddDetail(detail)
			return resultErr
		case pgerrcode.ForeignKeyViolation:
			resultErr := connect.NewError(connect.CodeInvalidArgument, err)
			detail, _ := connect.NewErrorDetail(&apiv1.InUseByEntityError{
				EntityType: pgErr.TableName,
				Message:    "Can't delete because row(s) are used by other entities",
			})
			resultErr.AddDetail(detail)
			return resultErr
		}
	}

	return connect.NewError(connect.CodeInternal, err)
}
