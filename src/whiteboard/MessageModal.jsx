import React from 'react';

export default function MessageModal({ open, onClose, onSubmit, status, reviewMode }) {
  const [name, setName] = React.useState('');
  const [text, setText] = React.useState('');
  const [color, setColor] = React.useState('#F4D758');
  const [website, setWebsite] = React.useState('');
  const [formStartedAt, setFormStartedAt] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const colors = ['#F4D758', '#2B7FD8', '#FFF9EC', '#756F64', '#211E1A'];

  React.useEffect(() => {
    if (open) {
      setName('');
      setText('');
      setColor(colors[0]);
      setWebsite('');
      setFormStartedAt(Date.now());
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    const t = text.trim();
    if (!t || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit(name.trim().slice(0, 12), t, color, {
      website,
      formStartedAt,
    });
    setSubmitting(false);
    if (!ok && reviewMode) setFormStartedAt(Date.now());
  };

  return (
    <div className="wb-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wb-modal">
        <div className="wb-modal-title">✍️ {reviewMode ? '提交一张访客留言' : '贴一张留言到白板'}</div>
        {reviewMode && (
          <div className="wb-review-note">留言会先进入审核区，通过后才会显示在公开白板。</div>
        )}
        <input
          id="wbMsgName"
          className="wb-modal-input"
          maxLength={12}
          placeholder="你的昵称（选填，默认「匿名」）"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          id="wbMsgText"
          className="wb-modal-input wb-modal-textarea"
          maxLength={140}
          placeholder="想对 Hresh赫什 和大家说什么？"
          value={text}
          autoFocus
          onChange={(e) => setText(e.target.value)}
        />
        {reviewMode && (
          <div className="wb-honeypot" aria-hidden="true">
            <label htmlFor="wbMsgWebsite">请勿填写此字段</label>
            <input
              id="wbMsgWebsite"
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
        )}
        <div className="wb-modal-colors">
          {colors.map((c) => (
            <button
              key={c}
              className={`wb-color${color === c ? ' active' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label="选择卡片颜色"
            />
          ))}
        </div>
        <div className="wb-modal-actions">
          <button className="wb-modal-cancel" onClick={onClose}>
            取消
          </button>
          <button
            className="wb-modal-send"
            onClick={submit}
            disabled={!text.trim() || submitting}
          >
            {submitting ? '提交中…' : reviewMode ? '提交审核' : '贴上去 ✨'}
          </button>
        </div>
        {status && <div className="wb-modal-status">{status}</div>}
      </div>
    </div>
  );
}
