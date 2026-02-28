import { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || ''

function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/expenses`)
      const data = await res.json()
      setExpenses(data)
    } catch (err) {
      console.error('failed to load expenses', err)
    } finally {
      setLoading(false)
    }
  }

  const add = async (payload) => {
    const res = await fetch(`${API_BASE}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Не вдалося додати витрату')
    await load()
  }

  const remove = async (id) => {
    await fetch(`${API_BASE}/api/expenses/${id}`, { method: 'DELETE' })
    await load()
  }

  useEffect(() => {
    load()
  }, [])

  return { expenses, loading, add, remove, reload: load }
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
        date: form.date || null,
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
          <p className="eyebrow">JarBudget</p>
          <h2>Додати витрату</h2>
        </div>
        <span className="pill">нова</span>
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
        {busy ? 'Збереження…' : 'Додати'}
      </button>
      {status && <p className="status">{status}</p>}
    </form>
  )
}

function ExpenseList({ expenses, onDelete }) {
  if (!expenses.length) {
    return <div className="ghost">Ще немає витрат</div>
  }

  return (
    <div className="list">
      {expenses.map((e) => (
        <article key={e.id} className="tile">
          <div>
            <p className="eyebrow">{e.category || 'Без категорії'}</p>
            <h3>{e.title}</h3>
            <p className="muted">{new Intl.DateTimeFormat('uk-UA').format(new Date(e.date))}</p>
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
      const key = e.category?.trim() || 'Без категорії'
      acc[key] = (acc[key] || 0) + Number(e.amount || 0)
      return acc
    }, {})
    return { total, byCategory, count: expenses.length }
  }, [expenses])

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <p className="eyebrow">Підсумок</p>
          <h2>Калькулятор витрат</h2>
        </div>
        <span className="pill pill--blue">оцінка</span>
      </div>
      <p className="lead">Загалом: ₴ {summary.total.toFixed(2)}</p>
      <p className="muted">{summary.count} транзакцій</p>
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

function NavBar() {
  const location = useLocation()
  return (
    <nav className="nav">
      <div className="brand">JarBudget</div>
      <div className="links">
        <Link className={location.pathname === '/' ? 'active' : ''} to="/">
          Витрати
        </Link>
        <Link className={location.pathname === '/calculator' ? 'active' : ''} to="/calculator">
          Калькулятор
        </Link>
      </div>
    </nav>
  )
}

function HomePage({ expenses, add, remove, loading }) {
  return (
    <div className="grid">
      <ExpenseForm onSubmit={add} busy={loading} />
      <div className="stack">
        <h2>Список</h2>
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
        <h2>Останні</h2>
        <ExpenseList expenses={expenses.slice(-5).reverse()} onDelete={() => {}} />
      </div>
    </div>
  )
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { expenses, loading, add, remove } = useExpenses()

  useEffect(() => {
    if (location.pathname === '/') return
    if (!['/','/calculator'].includes(location.pathname)) {
      navigate('/')
    }
  }, [location.pathname, navigate])

  return (
    <div className="page">
      <NavBar />
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
