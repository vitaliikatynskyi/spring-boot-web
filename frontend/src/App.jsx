import { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const APP_STATUS = import.meta.env.VITE_APP_STATUS || 'Unknown Mode'

function useExpenses(user) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)

  const storageKey = `expenses_${user}`

  const load = async () => {
    setLoading(true)
    try {
      // Пріоритет - LocalStorage для демонстрації на Vercel
      const localData = localStorage.getItem(storageKey)
      if (localData) {
        setExpenses(JSON.parse(localData))
      } else {
        // Якщо немає в локалі, пробуємо бекенд
        const res = await fetch(`${API_BASE}/api/expenses`)
        if (res.ok) {
          const data = await res.json()
          setExpenses(data)
        }
      }
    } catch (err) {
      console.error('failed to load expenses', err)
    } finally {
      setLoading(false)
    }
  }

  const saveToLocal = (data) => {
    localStorage.setItem(storageKey, JSON.stringify(data))
    setExpenses(data)
  }

  const add = async (payload) => {
    const newExpense = { ...payload, id: Date.now() }
    const updated = [...expenses, newExpense]
    saveToLocal(updated)
    
    // Спроба відправити на бекенд (якщо він є)
    try {
      fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch { /* ignore */ }
  }

  const remove = async (id) => {
    const updated = expenses.filter(expense => expense.id !== id)
    saveToLocal(updated)

    // Спроба відправити на бекенд
    try {
      fetch(`${API_BASE}/api/expenses/${id}`, { method: 'DELETE' })
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (user) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return { expenses, loading, add, remove, reload: load }
}

function LoginForm({ onLogin }) {
  const [name, setName] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (name.trim()) onLogin(name.trim())
  }

  return (
    <div className="login-screen">
      <form className="card login-card" onSubmit={submit}>
        <p className="eyebrow">UniDone App</p>
        <h1>Вітаємо!</h1>
        <p className="muted">Введіть своє ім'я, щоб почати</p>
        <label className="field">
          <span>Ваше ім'я</span>
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Олександр, Марія..." 
            required 
            autoFocus
          />
        </label>
        <button className="primary" type="submit">Увійти</button>
      </form>
    </div>
  )
}

function ExpenseForm({ onSubmit, busy }) {
  const [form, setForm] = useState({ title: '', category: '', amount: '', date: '' })
  const [status, setStatus] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setStatus('')
    try {
      if (!form.title || !form.amount) {
        setStatus('Додайте назву та суму')
        return
      }
      await onSubmit({
        title: form.title,
        category: form.category,
        amount: Number(form.amount),
        date: form.date || new Date().toISOString().split('T')[0],
      })
      setForm({ title: '', category: '', amount: '', date: '' })
      setStatus('Збережено')
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="card__header">
        <div>
          <p className="eyebrow">Додати витрату</p>
          <h2>Новий запис</h2>
        </div>
        <span className="pill">витрати</span>
      </div>
      <label className="field">
        <span>Назва</span>
        <input name="title" value={form.title} onChange={handleChange} placeholder="кава, проїзд, тощо" required />
      </label>
      <label className="field">
        <span>Категорія</span>
        <input name="category" value={form.category} onChange={handleChange} placeholder="харчі, транспорт" />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Сума, ₴</span>
          <input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            required
          />
        </label>
        <label className="field">
          <span>Дата</span>
          <input name="date" type="date" value={form.date} onChange={handleChange} />
        </label>
      </div>
      <button className="primary" type="submit" disabled={busy}>
        {busy ? 'Збереження…' : 'Зберегти'}
      </button>
      {status && <p className="status">{status}</p>}
    </form>
  )
}

function ExpenseList({ expenses, onDelete }) {
  if (!expenses.length) {
    return <div className="ghost">Тут поки порожньо</div>
  }

  return (
    <div className="list">
      {[...expenses].reverse().map((e) => (
        <article key={e.id} className="tile">
          <div>
            <p className="eyebrow">{e.category || 'Загальне'}</p>
            <h3>{e.title}</h3>
            <p className="muted">{e.date ? new Intl.DateTimeFormat('uk-UA').format(new Date(e.date)) : 'Не вказано'}</p>
          </div>
          <div className="tile__side">
            <span className="amount">₴ {Number(e.amount).toFixed(2)}</span>
            <button className="ghost-btn" onClick={() => onDelete(e.id)} aria-label="Видалити">
              ×
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function Calculator({ expenses }) {
  const summary = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const byCategory = expenses.reduce((acc, e) => {
      const key = e.category?.trim() || 'Інше'
      acc[key] = (acc[key] || 0) + Number(e.amount || 0)
      return acc
    }, {})
    return { total, byCategory, count: expenses.length }
  }, [expenses])

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <p className="eyebrow">Аналітика</p>
          <h2>Підсумок витрат</h2>
        </div>
        <span className="pill pill--blue">авто</span>
      </div>
      <div className="summary-main">
        <p className="lead">Всього: ₴ {summary.total.toFixed(2)}</p>
        <p className="muted">{summary.count} записів</p>
      </div>
      <div className="chips">
        {Object.entries(summary.byCategory).map(([cat, amt]) => (
          <span key={cat} className="chip">
            {cat}: ₴ {amt.toFixed(2)}
          </span>
        ))}
      </div>
    </div>
  )
}

function NavBar({ user, onLogout }) {
  const location = useLocation()
  return (
    <nav className="nav">
      <div className="brand">UniDone</div>
      <div className="links">
        <Link className={location.pathname === '/' ? 'active' : ''} to="/">
          Головна
        </Link>
        <Link className={location.pathname === '/calculator' ? 'active' : ''} to="/calculator">
          Статистика
        </Link>
      </div>
      <div className="user-info">
        <span>👤 {user}</span>
        <button onClick={onLogout} className="logout-link">Вийти</button>
      </div>
    </nav>
  )
}

function HomePage({ expenses, add, remove, loading }) {
  return (
    <div className="grid">
      <ExpenseForm onSubmit={add} busy={loading} />
      <div className="stack">
        <h2>Мої витрати</h2>
        <ExpenseList expenses={expenses} onDelete={remove} />
      </div>
    </div>
  )
}

function CalculatorPage({ expenses }) {
  return (
    <div className="grid">
      <Calculator expenses={expenses} />
      <div className="stack">
        <h2>Останні операції</h2>
        <ExpenseList expenses={expenses.slice(-5)} onDelete={() => {}} />
      </div>
    </div>
  )
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(() => localStorage.getItem('app_user'))
  const { expenses, loading, add, remove } = useExpenses(user)

  const handleLogin = (name) => {
    localStorage.setItem('app_user', name)
    setUser(name)
  }

  const handleLogout = () => {
    localStorage.removeItem('app_user')
    setUser(null)
    navigate('/')
  }

  useEffect(() => {
    if (!user) return
    if (!['/','/calculator'].includes(location.pathname)) {
      navigate('/')
    }
  }, [location.pathname, navigate, user])

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <div className="page">
      <NavBar user={user} onLogout={handleLogout} />
      <div className="env-status" role="status" aria-live="polite">
        Привіт, {user}! Режим: {APP_STATUS}
      </div>
      <main>
        <Routes>
          <Route path="/" element={<HomePage expenses={expenses} add={add} remove={remove} loading={loading} />} />
          <Route path="/calculator" element={<CalculatorPage expenses={expenses} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
