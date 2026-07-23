package main

// effectiveFieldPath resolves the field path the UI form binds an error to.
//
// protovalidate reports message-level CEL rule violations with an empty field
// path (they validate the whole message, so no single field owns them). By
// convention such a rule's id is the UI field path it targets — e.g.
// "displayName.en" for a nested TranslatedString language — so the form can
// highlight the exact input. Field-level rules already carry their real path
// and are returned unchanged.
func effectiveFieldPath(fieldPath, constraintID string) string {
	if fieldPath == "" {
		return constraintID
	}
	return fieldPath
}
