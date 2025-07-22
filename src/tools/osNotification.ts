import { execSync } from 'child_process'
import _ from 'lodash'
import { basename } from 'path'
import { z } from 'zod'
import { defineTool } from '../tools.js'
import util from '../util.js'

const schema = z.object({
  message: z.string().min(1).describe('The notification message to display'),
  title: z.string().optional().describe('Optional notification title (defaults to current directory name)'),
})

const osNotification = defineTool({
  id: 'os_notification',
  schema,
  description: 'Send OS notifications using native notification systems.',
  isReadOnly: true,
  fromArgs: ([message = '', title = '']: string[]) => ({
    message,
    title: title || undefined,
  }),
  handler: (args: z.infer<typeof schema>) => {
    const { message, title = basename(util.CWD) } = args
    const strategy = getStrategy()
    const cmd = strategy.cmd(title, message)
    execSync(cmd, { stdio: 'ignore' })
    return `Notification sent via ${strategy.check}`
  },
})

export default osNotification

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

const getStrategy = _.memoize((): NotificationStrategy => {
  for (const strategy of strategies) {
    try {
      execSync(`command -v ${strategy.check}`, { stdio: 'ignore' })
      return strategy
    } catch {
      // Try next strategy
    }
  }
  throw new Error('No notification method available. Install notify-send, osascript, powershell, or wsl-notify-send')
})
