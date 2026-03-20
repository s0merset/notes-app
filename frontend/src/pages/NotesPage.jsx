import { useState, useEffect } from 'react'
import { notesApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

const COLORS = ['#ffffff', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#ede9fe', '#ffedd5']

export default function NotesPage() {
  const { user, logout } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | note object
  const [form, setForm] = useState({ title: '', content: '', color: '#ffffff', tags: '', isPinned: false })
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchNotes() }, [])

  const fetchNotes = async () => {
    try {
      const { data } = await notesApi.getAll()
      setNotes(data)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ title: '', content: '', color: '#ffffff', tags: '', isPinned: false })
    setModal('create')
  }

  const openEdit = (note) => {
    setForm({ title: note.title, content: note.content, color: note.color, tags: note.tags.join(', '), isPinned: note.isPinned })
    setModal(note)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      title: form.title,
      content: form.content,
      color: form.color,
      isPinned: form.isPinned,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    try {
      if (modal === 'create') {
        const { data } = await notesApi.create(payload)
        setNotes(n => [data, ...n])
      } else {
        const { data } = await notesApi.update(modal.id, payload)
        setNotes(n => n.map(x => x.id === data.id ? data : x))
      }
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return
    await notesApi.delete(id)
    setNotes(n => n.filter(x => x.id !== id))
    setModal(null)
  }

  const togglePin = async (note, e) => {
    e.stopPropagation()
    const { data } = await notesApi.update(note.id, { isPinned: !note.isPinned })
    setNotes(n => n.map(x => x.id === data.id ? data : x))
  }

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  const pinned = filtered.filter(n => n.isPinned)
  const unpinned = filtered.filter(n => !n.isPinned)

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <span style={s.logo}>📝 Notes</span>
        <input style={s.search} placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} />
        <div style={s.headerRight}>
          <span style={s.userName}>{user.displayName}</span>
          <button style={s.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      <main style={s.main}>
        {/* FAB */}
        <button style={s.fab} onClick={openCreate} title="New note">+</button>

        {loading ? (
          <div style={s.empty}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            {search ? 'No notes match your search.' : 'No notes yet. Click + to create one.'}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <section>
                <p style={s.sectionLabel}>PINNED</p>
                <div style={s.grid}>
                  {pinned.map(note => <NoteCard key={note.id} note={note} onOpen={openEdit} onPin={togglePin} />)}
                </div>
              </section>
            )}
            {unpinned.length > 0 && (
              <section>
                {pinned.length > 0 && <p style={s.sectionLabel}>OTHERS</p>}
                <div style={s.grid}>
                  {unpinned.map(note => <NoteCard key={note.id} note={note} onOpen={openEdit} onPin={togglePin} />)}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Modal */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={{ ...s.modal, background: form.color }} onClick={e => e.stopPropagation()}>
            <input
              style={s.modalTitle}
              placeholder="Title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
            />
            <textarea
              style={s.modalContent}
              placeholder="Take a note…"
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={6}
            />
            <input
              style={s.modalTags}
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            />

            {/* Color picker */}
            <div style={s.colorRow}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ ...s.colorDot, background: c, outline: form.color === c ? '2px solid #333' : '1px solid #ccc' }} />
              ))}
              <label style={s.pinLabel}>
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} />
                {' '}Pin
              </label>
            </div>

            <div style={s.modalFooter}>
              {modal !== 'create' && (
                <button style={s.deleteBtn} onClick={() => handleDelete(modal.id)}>Delete</button>
              )}
              <div style={s.modalFooterRight}>
                <button style={s.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
                <button style={s.saveBtn} onClick={handleSave} disabled={saving || !form.title.trim()}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, onOpen, onPin }) {
  return (
    <div style={{ ...s.card, background: note.color }} onClick={() => onOpen(note)}>
      <div style={s.cardHeader}>
        <span style={s.cardTitle}>{note.title}</span>
        <button style={s.pinBtn} onClick={e => onPin(note, e)} title={note.isPinned ? 'Unpin' : 'Pin'}>
          {note.isPinned ? '📌' : '📍'}
        </button>
      </div>
      {note.content && <p style={s.cardContent}>{note.content}</p>}
      {note.tags.length > 0 && (
        <div style={s.tagRow}>
          {note.tags.map(t => <span key={t} style={s.tag}>#{t}</span>)}
        </div>
      )}
      <p style={s.cardDate}>{new Date(note.updatedAt).toLocaleDateString()}</p>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#f5f5f0', fontFamily: 'system-ui, sans-serif' },
  header: { position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #eee', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' },
  logo: { fontWeight: 700, fontSize: '1.2rem', whiteSpace: 'nowrap' },
  search: { flex: 1, maxWidth: '480px', padding: '0.5rem 0.9rem', borderRadius: '999px', border: '1px solid #ddd', fontSize: '0.9rem', background: '#f5f5f0', outline: 'none' },
  headerRight: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' },
  userName: { fontSize: '0.875rem', color: '#555' },
  logoutBtn: { padding: '0.35rem 0.85rem', borderRadius: '6px', border: '1px solid #ddd', background: 'transparent', cursor: 'pointer', fontSize: '0.875rem' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative' },
  fab: { position: 'fixed', bottom: '2rem', right: '2rem', width: '56px', height: '56px', borderRadius: '50%', background: '#1a1a1a', color: '#fff', fontSize: '2rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', lineHeight: 1, zIndex: 100 },
  sectionLabel: { fontSize: '0.75rem', fontWeight: 600, color: '#888', letterSpacing: '0.08em', margin: '0 0 0.75rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: '5rem', fontSize: '1rem' },
  card: { borderRadius: '10px', padding: '1rem', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.08)', transition: 'box-shadow 0.15s', minHeight: '100px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' },
  cardTitle: { fontWeight: 600, fontSize: '0.95rem', color: '#1a1a1a', wordBreak: 'break-word' },
  pinBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '0', lineHeight: 1, opacity: 0.6 },
  cardContent: { fontSize: '0.875rem', color: '#444', margin: '0 0 0.5rem', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' },
  tag: { fontSize: '0.75rem', color: '#666', background: 'rgba(0,0,0,0.06)', padding: '0.1rem 0.5rem', borderRadius: '999px' },
  cardDate: { fontSize: '0.7rem', color: '#aaa', margin: '0.5rem 0 0' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' },
  modal: { borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
  modalTitle: { fontSize: '1.1rem', fontWeight: 600, border: 'none', background: 'transparent', outline: 'none', width: '100%', color: '#1a1a1a' },
  modalContent: { fontSize: '0.95rem', border: 'none', background: 'transparent', outline: 'none', resize: 'vertical', width: '100%', fontFamily: 'inherit', color: '#333', lineHeight: 1.6 },
  modalTags: { fontSize: '0.85rem', border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', background: 'transparent', outline: 'none', padding: '0.5rem 0', width: '100%', color: '#666' },
  colorRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  colorDot: { width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer', border: 'none', padding: 0 },
  pinLabel: { fontSize: '0.85rem', color: '#555', marginLeft: '0.5rem', cursor: 'pointer', userSelect: 'none' },
  modalFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '0.75rem' },
  modalFooterRight: { display: 'flex', gap: '0.5rem' },
  deleteBtn: { padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid #fca5a5', color: '#dc2626', background: 'transparent', cursor: 'pointer', fontSize: '0.875rem' },
  cancelBtn: { padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid #ddd', background: 'transparent', cursor: 'pointer', fontSize: '0.875rem' },
  saveBtn: { padding: '0.4rem 0.9rem', borderRadius: '6px', border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 },
}
