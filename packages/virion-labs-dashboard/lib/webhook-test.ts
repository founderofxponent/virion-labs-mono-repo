export interface WebhookTestResult {
  success: boolean
  status?: number
  responseTime?: number
  error?: string
  headers?: Record<string, string>
}

export interface WebhookPayload {
  event: string
  timestamp: string
  data: any
}

export class WebhookTester {
  static async testWebhook(url: string, events: string[] = ['test']): Promise<WebhookTestResult> {
    if (!url || !this.isValidUrl(url)) {
      return {
        success: false,
        error: 'Invalid webhook URL provided'
      }
    }

    const startTime = Date.now()
    
    try {
      const testPayload: WebhookPayload = {
        event: 'webhook_test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook from Virion Labs',
          events_configured: events,
          test_id: this.generateTestId()
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VirionLabs-Webhook/1.0',
          'X-Webhook-Source': 'virion-labs'
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      const responseTime = Date.now() - startTime
      const responseHeaders = this.extractHeaders(response)

      if (response.ok) {
        return {
          success: true,
          status: response.status,
          responseTime,
          headers: responseHeaders
        }
      } else {
        return {
          success: false,
          status: response.status,
          responseTime,
          headers: responseHeaders,
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          responseTime,
          error: 'Request timeout (10 seconds)'
        }
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          responseTime,
          error: 'Network error - Unable to reach webhook URL'
        }
      }

      return {
        success: false,
        responseTime,
        error: error.message || 'Unknown error occurred'
      }
    }
  }

  static async sendWebhook(
    url: string, 
    eventType: string, 
    data: any,
    userAgent: string = 'VirionLabs-Webhook/1.0'
  ): Promise<boolean> {
    if (!url || !this.isValidUrl(url)) {
      console.error('Invalid webhook URL:', url)
      return false
    }

    try {
      const payload: WebhookPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          'X-Webhook-Source': 'virion-labs',
          'X-Event-Type': eventType
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000) // 5 second timeout for production webhooks
      })

      return response.ok
    } catch (error) {
      console.error('Webhook delivery failed:', error)
      return false
    }
  }

  private static isValidUrl(string: string): boolean {
    try {
      const url = new URL(string)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  private static extractHeaders(response: Response): Record<string, string> {
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      // Only include relevant headers
      if (['content-type', 'server', 'x-powered-by', 'x-webhook-response'].includes(key.toLowerCase())) {
        headers[key] = value
      }
    })
    return headers
  }

  private static generateTestId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  static createSamplePayloads(): Record<string, WebhookPayload> {
    const timestamp = new Date().toISOString()
    
    return {
      signup: {
        event: 'user_signup',
        timestamp,
        data: {
          user_id: 'user_123',
          email: 'newuser@example.com',
          referral_code: 'REF001',
          influencer_id: 'inf_456',
          signup_timestamp: timestamp,
          metadata: {
            source: 'referral_link',
            platform: 'YouTube'
          }
        }
      },
      click: {
        event: 'link_click',
        timestamp,
        data: {
          link_id: 'link_789',
          referral_code: 'REF001',
          influencer_id: 'inf_456',
          click_timestamp: timestamp,
          user_agent: 'Mozilla/5.0...',
          ip_address: '192.168.1.1',
          location: {
            country: 'United States',
            city: 'New York'
          },
          device: {
            type: 'mobile',
            browser: 'Chrome'
          }
        }
      },
      conversion: {
        event: 'referral_conversion',
        timestamp,
        data: {
          conversion_id: 'conv_321',
          user_id: 'user_123',
          referral_code: 'REF001',
          influencer_id: 'inf_456',
          conversion_value: 25.00,
          commission_earned: 5.00,
          conversion_timestamp: timestamp,
          product_details: {
            name: 'Premium Subscription',
            price: 25.00,
            currency: 'USD'
          }
        }
      }
    }
  }
} 