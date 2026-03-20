import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await authApi.register(form)
      login(data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h1 style={styles.title}>Create account</h1>
        {error && <div style={styles.error}>{error}</div>}
        <input style={styles.input} placeholder="Display name" value={form.displayName}
          onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} required />
        <input style={styles.input} type="email" placeholder="Email" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
        <input style={styles.input} type="password" placeholder="Password" value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
        <button style={styles.btn} type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
        <p style={styles.link}>Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f0' },
  card: { background: '#fff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' },
  title: { margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#1a1a1a' },
  error: { background: '#fee', color: '#c33', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.875rem' },
  input: { padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' },
  btn: { padding: '0.75rem', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600 },
  link: { textAlign: 'center', color: '#666', fontSize: '0.875rem', margin: 0 },
}
