export const CreateStatusNote = ({
  apiError,
  validationError,
}: {
  apiError: boolean;
  validationError: string | null;
}) => {
  if (apiError) {
    return (
      <div className="form-error">Could not post. Check the API and try again.</div>
    );
  }

  if (validationError === null) return null;

  return <div className="compose-hint">{validationError}</div>;
};
