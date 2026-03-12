import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

const buildFetchStub = (initial = []) => {
  let data = initial.map((item, idx) => ({ id: idx + 1, ...item }))

  return vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET'

    if (method === 'GET') {
      return { ok: true, json: async () => data }
    }

    if (method === 'POST') {
      const body = JSON.parse(options.body)
      const created = { id: data.length + 1, ...body }
      data = [...data, created]
      return { ok: true, json: async () => created }
    }

    if (method === 'DELETE') {
      const id = Number(url.toString().split('/').pop())
      data = data.filter((item) => item.id !== id)
      return { ok: true, json: async () => ({}) }
    }

    return { ok: true, json: async () => ({}) }
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App', () => {
  it('loads and shows expenses from API', async () => {
    const fetchStub = buildFetchStub([
      { title: 'Coffee', category: 'Food', amount: 3.5, date: '2024-02-01' },
      { title: 'Bus', category: 'Transport', amount: 2.4, date: '2024-02-02' },
    ])
    vi.stubGlobal('fetch', fetchStub)

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    expect(await screen.findByText('Coffee')).toBeInTheDocument()
    expect(screen.getByText('Bus')).toBeInTheDocument()
    expect(fetchStub).toHaveBeenCalledTimes(1)
  })

  it('submits a new expense and reloads the list', async () => {
    const fetchStub = buildFetchStub([{ title: 'Tea', category: 'Food', amount: 2, date: '2024-02-03' }])
    vi.stubGlobal('fetch', fetchStub)
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    await screen.findByText('Tea')

    await user.type(screen.getByLabelText('Назва'), 'Book')
    await user.type(screen.getByLabelText('Категорія'), 'Study')
    await user.type(screen.getByLabelText('Сума, ₴'), '15')
    await user.click(screen.getByRole('button', { name: 'Додати' }))

    await waitFor(() => expect(fetchStub.mock.calls.length).toBeGreaterThan(1))
    const postCall = fetchStub.mock.calls.find(([, options]) => options?.method === 'POST')
    expect(postCall).toBeDefined()
    expect(postCall[0]).toBe('/api/expenses')
    expect(await screen.findByText('Book')).toBeInTheDocument()
  })

  it('calculates totals on the calculator page', async () => {
    const fetchStub = buildFetchStub([
      { title: 'Groceries', category: 'Home', amount: 30, date: '2024-02-01' },
      { title: 'Bike', category: 'Transport', amount: 20, date: '2024-02-02' },
    ])
    vi.stubGlobal('fetch', fetchStub)

    render(
      <MemoryRouter initialEntries={[{ pathname: '/calculator' }]}>
        <App />
      </MemoryRouter>
    )

    expect(await screen.findByText(/Загалом:/)).toHaveTextContent('₴ 50.00')
    expect(screen.getByText(/Home: ₴ 30.00/)).toBeInTheDocument()
    expect(screen.getByText(/Transport: ₴ 20.00/)).toBeInTheDocument()
  })
})
