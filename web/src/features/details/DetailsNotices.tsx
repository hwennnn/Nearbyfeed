export const DetailsNotices = ({
  blockNotice,
  reportNotice,
}: {
  blockNotice: string | null;
  reportNotice: string | null;
}) => (
  <>
    {reportNotice !== null && (
      <div className="success-note report-inline-notice" role="status">
        {reportNotice}
      </div>
    )}
    {blockNotice !== null && (
      <div className="success-note report-inline-notice" role="status">
        {blockNotice}
      </div>
    )}
  </>
);
