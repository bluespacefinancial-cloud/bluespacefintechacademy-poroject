import { SUPABASE_URL, supabase } from '../lib/supabase'

const EDGE_FUNCTIONS_BASE = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : ''

export const payments = {
  async createCheckoutSession(amount, currency, description, metadata = {}) {
    try {
      const response = await fetch(`${EDGE_FUNCTIONS_BASE}/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: currency || 'usd',
          description,
          metadata,
        }),
      })

      if (!response.ok) throw new Error('Payment session creation failed')
      const data = await response.json()
      return { success: true, checkoutUrl: data.checkoutUrl, sessionId: data.sessionId }
    } catch (err) {
      console.error('Payment error:', err)
      return { success: false, error: err.message }
    }
  },

  async getPaymentStatus(sessionId) {
    try {
      const response = await fetch(`${EDGE_FUNCTIONS_BASE}/payments/status/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const data = await response.json()
      return { success: true, ...data }
    } catch (err) {
      console.error('Payment status error:', err)
      return { success: false, error: err.message }
    }
  },

  async getPaymentHistory() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (err) {
      console.error('Error fetching payment history:', err)
      return { success: false, error: err.message }
    }
  },
}

export default payments
