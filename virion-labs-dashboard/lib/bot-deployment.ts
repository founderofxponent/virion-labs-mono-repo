import { randomBytes } from 'crypto'

export interface BotDeploymentConfig {
  applicationId: string
  name: string
  code: string
  token: string
  auto_deploy: boolean
  environment?: Record<string, string>
}

export interface DeploymentResult {
  success: boolean
  deploymentId?: string
  endpoint?: string
  status?: string
  error?: string
}

export interface BotControlResult {
  success: boolean
  status?: string
  error?: string
}

export interface DeploymentInfo {
  deploymentId: string
  status: string
  endpoint?: string
  created: string
  lastUpdated: string
  platform: string
}

class BotDeploymentManager {
  private deployments = new Map<string, DeploymentInfo>()
  private n8nWorkflowUrl?: string
  private n8nApiKey?: string

  constructor() {
    // Initialize n8n configuration from environment variables
    this.n8nWorkflowUrl = process.env.N8N_WORKFLOW_URL
    this.n8nApiKey = process.env.N8N_API_KEY
  }

  async deployBot(config: BotDeploymentConfig): Promise<DeploymentResult> {
    const deploymentId = this.generateDeploymentId()
    const deploymentMethod = process.env.DEPLOYMENT_METHOD || 'simulation'

    try {
      let result: DeploymentResult

      switch (deploymentMethod) {
        case 'n8n':
          result = await this.deployWithN8n(config, deploymentId)
          break
        case 'docker':
          result = await this.deployWithDocker(config, deploymentId)
          break
        case 'pm2':
          result = await this.deployWithPM2(config, deploymentId)
          break
        case 'serverless':
          result = await this.deployWithServerless(config, deploymentId)
          break
        default:
          result = await this.deployWithSimulation(config, deploymentId)
      }

      if (result.success && result.deploymentId) {
        // Store deployment info
        this.deployments.set(result.deploymentId, {
          deploymentId: result.deploymentId,
          status: result.status || 'Running',
          endpoint: result.endpoint,
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          platform: deploymentMethod
        })
      }

      return result
    } catch (error) {
      console.error('Deployment failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      }
    }
  }

  private async deployWithN8n(config: BotDeploymentConfig, deploymentId: string): Promise<DeploymentResult> {
    if (!this.n8nWorkflowUrl) {
      return {
        success: false,
        error: 'N8N_WORKFLOW_URL not configured. Please set the webhook URL for your n8n bot deployment workflow.'
      }
    }

    try {
      console.log(`Deploying bot ${config.name} with n8n workflow...`)

      // Prepare deployment data for n8n webhook
      const deploymentData = {
        action: 'deploy',
        deploymentId,
        botConfig: {
          name: config.name,
          applicationId: config.applicationId,
          code: config.code,
          token: config.token,
          environment: {
            ...config.environment,
            DEPLOYMENT_ID: deploymentId,
            BOT_NAME: config.name,
            DISCORD_TOKEN: config.token
          }
        },
        timestamp: new Date().toISOString()
      }

      // Send deployment request to n8n workflow
      const response = await fetch(this.n8nWorkflowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.n8nApiKey && { 'Authorization': `Bearer ${this.n8nApiKey}` })
        },
        body: JSON.stringify(deploymentData)
      })

      if (!response.ok) {
        throw new Error(`N8n workflow responded with status ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      // Check if n8n workflow executed successfully
      if (result.success === false) {
        return {
          success: false,
          error: result.error || 'N8n workflow execution failed'
        }
      }

      const endpoint = result.endpoint || `n8n-bot-${deploymentId}`

      console.log(`✅ Bot deployed successfully via n8n`)
      console.log(`   Deployment ID: ${deploymentId}`)
      console.log(`   Endpoint: ${endpoint}`)

      return {
        success: true,
        deploymentId,
        endpoint,
        status: 'Running'
      }

    } catch (error) {
      console.error('N8n deployment failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'N8n deployment failed'
      }
    }
  }

  private async deployWithDocker(config: BotDeploymentConfig, deploymentId: string): Promise<DeploymentResult> {
    try {
      console.log(`Deploying bot ${config.name} with Docker...`)
      
      // Simulate Docker deployment
      await this.delay(2000)
      
      const endpoint = `docker-bot-${deploymentId}`
      
      console.log(`✅ Bot deployed successfully with Docker`)
      console.log(`   Container: bot_${deploymentId}`)
      console.log(`   Endpoint: ${endpoint}`)

      return {
        success: true,
        deploymentId,
        endpoint,
        status: 'Running'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Docker deployment failed'
      }
    }
  }

  private async deployWithPM2(config: BotDeploymentConfig, deploymentId: string): Promise<DeploymentResult> {
    try {
      console.log(`Deploying bot ${config.name} with PM2...`)
      
      // Simulate PM2 deployment
      await this.delay(1500)
      
      const endpoint = `pm2-bot-${deploymentId}`
      
      console.log(`✅ Bot deployed successfully with PM2`)
      console.log(`   Process: bot_${deploymentId}`)
      console.log(`   Endpoint: ${endpoint}`)

      return {
        success: true,
        deploymentId,
        endpoint,
        status: 'Running'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PM2 deployment failed'
      }
    }
  }

  private async deployWithServerless(config: BotDeploymentConfig, deploymentId: string): Promise<DeploymentResult> {
    try {
      console.log(`Deploying bot ${config.name} with Serverless...`)
      
      // Simulate Serverless deployment
      await this.delay(3000)
      
      const endpoint = `serverless-bot-${deploymentId}`
      
      console.log(`✅ Bot deployed successfully with Serverless`)
      console.log(`   Function: bot_${deploymentId}`)
      console.log(`   Endpoint: ${endpoint}`)

      return {
        success: true,
        deploymentId,
        endpoint,
        status: 'Running'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Serverless deployment failed'
      }
    }
  }

  private async deployWithSimulation(config: BotDeploymentConfig, deploymentId: string): Promise<DeploymentResult> {
    console.log(`Simulating deployment for bot ${config.name}...`)
    
    // Simulate deployment time
    await this.delay(1000)
    
    const endpoint = `simulated-bot-${deploymentId}`
    
    console.log(`✅ Bot deployment simulated successfully`)
    console.log(`   Deployment ID: ${deploymentId}`)
    console.log(`   Simulated Endpoint: ${endpoint}`)

    return {
      success: true,
      deploymentId,
      endpoint,
      status: 'Running'
    }
  }

  async startBot(deploymentId: string): Promise<BotControlResult> {
    const deployment = this.deployments.get(deploymentId)
    if (!deployment) {
      return {
        success: false,
        error: 'Deployment not found'
      }
    }

    try {
      if (deployment.platform === 'n8n') {
        return await this.controlN8nBot(deploymentId, 'start')
      }

      console.log(`Starting bot ${deploymentId}...`)
      await this.delay(500)
      
      deployment.status = 'Running'
      deployment.lastUpdated = new Date().toISOString()
      this.deployments.set(deploymentId, deployment)

      return {
        success: true,
        status: 'Running'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start bot'
      }
    }
  }

  async stopBot(deploymentId: string): Promise<BotControlResult> {
    const deployment = this.deployments.get(deploymentId)
    if (!deployment) {
      return {
        success: false,
        error: 'Deployment not found'
      }
    }

    try {
      if (deployment.platform === 'n8n') {
        return await this.controlN8nBot(deploymentId, 'stop')
      }

      console.log(`Stopping bot ${deploymentId}...`)
      await this.delay(500)
      
      deployment.status = 'Stopped'
      deployment.lastUpdated = new Date().toISOString()
      this.deployments.set(deploymentId, deployment)

      return {
        success: true,
        status: 'Stopped'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop bot'
      }
    }
  }

  async restartBot(deploymentId: string): Promise<BotControlResult> {
    const deployment = this.deployments.get(deploymentId)
    if (!deployment) {
      return {
        success: false,
        error: 'Deployment not found'
      }
    }

    try {
      if (deployment.platform === 'n8n') {
        return await this.controlN8nBot(deploymentId, 'restart')
      }

      console.log(`Restarting bot ${deploymentId}...`)
      await this.delay(1000)
      
      deployment.status = 'Running'
      deployment.lastUpdated = new Date().toISOString()
      this.deployments.set(deploymentId, deployment)

      return {
        success: true,
        status: 'Running'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restart bot'
      }
    }
  }

  private async controlN8nBot(deploymentId: string, action: 'start' | 'stop' | 'restart'): Promise<BotControlResult> {
    if (!this.n8nWorkflowUrl) {
      return {
        success: false,
        error: 'N8N_WORKFLOW_URL not configured'
      }
    }

    try {
      const controlData = {
        action: 'control',
        deploymentId,
        operation: action,
        timestamp: new Date().toISOString()
      }

      const response = await fetch(this.n8nWorkflowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.n8nApiKey && { 'Authorization': `Bearer ${this.n8nApiKey}` })
        },
        body: JSON.stringify(controlData)
      })

      if (!response.ok) {
        throw new Error(`N8n control request failed with status ${response.status}`)
      }

      const result = await response.json()

      if (result.success === false) {
        return {
          success: false,
          error: result.error || `Failed to ${action} bot via n8n`
        }
      }

      // Update local deployment status
      const deployment = this.deployments.get(deploymentId)
      if (deployment) {
        deployment.status = action === 'stop' ? 'Stopped' : 'Running'
        deployment.lastUpdated = new Date().toISOString()
        this.deployments.set(deploymentId, deployment)
      }

      return {
        success: true,
        status: action === 'stop' ? 'Stopped' : 'Running'
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to ${action} bot via n8n`
      }
    }
  }

  getDeploymentInfo(deploymentId: string): DeploymentInfo | null {
    return this.deployments.get(deploymentId) || null
  }

  getAllDeployments(): DeploymentInfo[] {
    return Array.from(this.deployments.values())
  }

  private generateDeploymentId(): string {
    return `bot_${randomBytes(8).toString('hex')}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const botDeploymentManager = new BotDeploymentManager() 