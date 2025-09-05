export interface Budget {
  id: number
  year: number
  month: number
  amount: number
  threshold: number
}

export interface BudgetRequest {
  year: number
  month: number
  amount: number
}

import { getApiBase } from './http'

const API_URL = getApiBase()

// Get current month's budget
export async function getCurrentBudget(): Promise<Budget | null> {
  const token = localStorage.getItem('auth_token')
  if (!token) throw new Error('No auth token')
  
  const response = await fetch(`${API_URL}/budgets/current`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (response.status === 404) {
    return null // No budget set for current month
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch current budget')
  }
  
  return response.json()
}

// Get budget for specific month and year
export async function getBudgetByMonthYear(year: number, month: number): Promise<Budget | null> {
  const token = localStorage.getItem('auth_token')
  if (!token) throw new Error('No auth token')
  
  const response = await fetch(`${API_URL}/budgets?year=${year}&month=${month}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (response.status === 404) {
    return null // No budget set for this month/year
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch budget')
  }
  
  return response.json()
}

// Create or update budget for a specific month
export async function upsertBudget(request: BudgetRequest): Promise<Budget> {
  const token = localStorage.getItem('auth_token')
  if (!token) throw new Error('No auth token')
  
  const response = await fetch(`${API_URL}/budgets`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  
  if (!response.ok) {
    throw new Error('Failed to save budget')
  }
  
  return response.json()
}
