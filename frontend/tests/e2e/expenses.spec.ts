import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  let data = [
    { id: 1, title: 'Coffee', category: 'Food', amount: 3.5, date: '2024-02-01' },
    { id: 2, title: 'Bus', category: 'Transport', amount: 2.4, date: '2024-02-02' },
  ]

  await page.route('**/api/expenses**', async (route) => {
    const request = route.request()
    if (request.method() === 'GET') {
      return route.fulfill({ json: data })
    }
    if (request.method() === 'POST') {
      const body = request.postDataJSON()
      const created = { id: data.length + 1, ...body }
      data = [...data, created]
      return route.fulfill({ status: 201, json: created })
    }
    if (request.method() === 'DELETE') {
      const id = Number(request.url().split('/').pop())
      data = data.filter((item) => item.id !== id)
      return route.fulfill({ status: 204, body: '' })
    }

    return route.fulfill({ json: {} })
  })
})

test('user sees expenses and can switch to calculator', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('Coffee')).toBeVisible()
  await expect(page.getByText('Bus')).toBeVisible()

  await page.getByRole('link', { name: 'Калькулятор' }).click()
  await expect(page.getByText('Калькулятор витрат')).toBeVisible()
  await expect(page.getByText(/Загалом: ₴ 5.90/)).toBeVisible()
})

test('user adds an expense and sees it in the list', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('Coffee')).toBeVisible()

  await page.getByLabel('Назва').fill('Book')
  await page.getByLabel('Категорія').fill('Study')
  await page.getByLabel('Сума, ₴').fill('15')
  await page.getByRole('button', { name: 'Додати' }).click()

  await expect(page.getByText('Book')).toBeVisible()
  await expect(page.getByText(/₴ 15.00/)).toBeVisible()
})
