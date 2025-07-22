import { basename } from 'path'
import { z } from 'zod'
import { ToolConfig } from '../types.js'
import util from '../util.js'

const schema = z.object({
  message: z.string().min(1).describe('Notification message to display'),
  title: z.string().optional().describe('Notification title (defaults to current directory name)'),
})

const osNotificationTool: ToolConfig = {
  name: 'os_notification',
  schema,
  description: 'Send cross-platform OS notifications',
  isReadOnly: true,
  handler: (args: z.infer<typeof schema>) => {
    const { message, title = basename(util.CWD) } = args
    const strategy = detectAvailableStrategy()

    if (!strategy) {
      throw new Error('No notification method available. Install notify-send, osascript, powershell, or wsl-notify-send')
    }

    const cmd = strategy.cmd(title, message)
    util.execSync(cmd, { stdio: 'ignore' })
    return `Notification sent via ${strategy.check}`
  },
}

export default osNotificationTool

interface NotificationStrategy {
  check: string
  cmd: (title: string, message: string) => string
}

const strategies: NotificationStrategy[] = [
  {
    check: 'notify-send',
    cmd: (title, message) => `notify-send "${title}" "${message}"`,
  },
  {
    check: 'osascript',
    cmd: (title, message) => `osascript -e 'display notification "${message}" with title "${title}"'`,
  },
  {
    check: 'powershell',
    cmd: (title, message) => `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; \\$notify = New-Object System.Windows.Forms.NotifyIcon; \\$notify.Icon = [System.Drawing.SystemIcons]::Information; \\$notify.BalloonTipTitle = '${title}'; \\$notify.BalloonTipText = '${message}'; \\$notify.Visible = \\$true; \\$notify.ShowBalloonTip(5000); Start-Sleep -Seconds 2; \\$notify.Dispose()"`,
  },
  {
    check: 'powershell.exe',
    cmd: (title, message) => `powershell.exe -Command "Add-Type -AssemblyName System.Windows.Forms; \\$notify = New-Object System.Windows.Forms.NotifyIcon; \\$notify.Icon = [System.Drawing.SystemIcons]::Information; \\$notify.BalloonTipTitle = '${title}'; \\$notify.BalloonTipText = '${message}'; \\$notify.Visible = \\$true; \\$notify.ShowBalloonTip(5000); Start-Sleep -Seconds 2; \\$notify.Dispose()"`,
  },
  {
    check: 'wsl-notify-send.exe',
    cmd: (title, message) => `wsl-notify-send.exe --category "${title}" "${message}"`,
  },
]

let availableStrategy: NotificationStrategy | null = null
let detectionAttempted = false

function detectAvailableStrategy(): NotificationStrategy | null {
  if (detectionAttempted) return availableStrategy

  detectionAttempted = true
  for (const strategy of strategies) {
    try {
      util.execSync(`command -v ${strategy.check}`, { stdio: 'ignore' })
      availableStrategy = strategy
      return strategy
    } catch {
      // Try next strategy
    }
  }
  availableStrategy = null
  return null
}
