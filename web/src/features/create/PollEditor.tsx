export const PollEditor = ({
  onOptionsChange,
  options,
}: {
  onOptionsChange: (options: string[]) => void;
  options: string[];
}) => (
  <div className="poll-editor">
    {options.map((option, index) => (
      <input
        key={index}
        onChange={(event) => {
          const next = [...options];
          next[index] = event.target.value;
          onOptionsChange(next);
        }}
        placeholder={`Option ${index + 1}`}
        value={option}
      />
    ))}
    <button
      className="text-command"
      onClick={() => onOptionsChange([...options, ''])}
      type="button"
    >
      Add another option
    </button>
  </div>
);
