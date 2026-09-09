import React from 'react';

export default function MessageModal({ open, onClose, onSubmit, status }) {
  const [name, setName] = React.useState('');
  const [text, setText] = React.useState('');
  const [color, setColor] = React.useState('#F4D758');
  const colors = ['#F4D758', '#2B7FD8', '#FFF9EC', '#756F64', '#211E1A'];

  React.useEffect(() => {
    if (open) {
      setName('');
      setText('');
      setColor(colors[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSubmit(name.trim().slice(0, 12), t, color);
  };

  return (
    <div className="wb-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wb-modal">
        <div className="wb-modal-title">✍️ 贴一张留言到白板</div>
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
          <button className="wb-modal-send" onClick={submit} disabled={!text.trim()}>
            贴上去 ✨
          </button>
        </div>
        {status && <div className="wb-modal-status">{status}</div>}
      </div>
    </div>
  );
}
