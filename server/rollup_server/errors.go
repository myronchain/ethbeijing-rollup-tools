package rollup_server

import "fmt"

const (
	// UnknownError is the error code for errors that occur during the lifecycle of a rollup
	UnknownError        = 1000
	NonRecoverableError = 1001
)

type LifecycleError struct {
	// meaningful error message string, possibly displayed to the user
	message string

	// underlying error, if any
	error error

	code int
}

func (e *LifecycleError) Error() string {
	return fmt.Sprintf("RollupLifecycleError: %s", e.message)
}

func (e *LifecycleError) Unwrap() error {
	return e.error
}

func NewNonRecoverableError(message string, err error) *LifecycleError {
	return &LifecycleError{
		message: message,
		error:   err,
		code:    NonRecoverableError,
	}
}
