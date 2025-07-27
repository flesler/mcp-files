import _ from 'lodash'
import { basename } from 'path'
import { z } from 'zod'
import { defineTool } from '../tools.js'
import util from '../util.js'

const osNotification = defineTool({
  id: 'os_notification',
  schema: z.object({
    message: z.string().min(1).describe('The notification message to display'),
    title: z.string().optional().describe('Defaults to current project, generally omit'),
  }),
  description: 'Send OS notifications using native notification systems.',
  isReadOnly: true,
  fromArgs: ([message, title]) => ({ message, title: title || undefined }),
  handler: (args) => {
    const { message, title = basename(util.CWD) } = args
    const strategy = getStrategy()
    const cmd = strategy.cmd(title, message)
    util.execSync(cmd, { stdio: 'ignore' })
    return `Notification would have been sent via ${strategy.check} with title "${title}" and message "${message}"`
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
      util.execSync(`command -v ${strategy.check}`, { stdio: 'ignore' })
      return strategy
    } catch {
      // Try next strategy
    }
  }
  throw new Error('No notification method available. Install notify-send, osascript, powershell, or wsl-notify-send')
})
