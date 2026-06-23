import { ImageIcon, Plus } from 'lucide-react';

export const PhotoDrop = ({
  files,
  onFilesChange,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
}) => (
  <label className="file-drop">
    <span className="file-drop-icon">
      <ImageIcon />
    </span>
    <span>
      {files.length === 0
        ? 'Add the proof'
        : `${files.length} photo${files.length > 1 ? 's' : ''}`}
    </span>
    <Plus />
    <input
      accept="image/*"
      multiple
      onChange={(event) =>
        onFilesChange(Array.from(event.currentTarget.files ?? []))
      }
      type="file"
    />
  </label>
);
