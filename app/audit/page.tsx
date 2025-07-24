"use client"

import { useState, useEffect } from "react"
import { io as socketIOClient } from "socket.io-client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, Eye, Shield, User, Clock, AlertTriangle } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function AuditPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState("all")
  const [selectedModule, setSelectedModule] = useState("all")
  const [selectedSeverity, setSelectedSeverity] = useState("all")
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [errorLogs, setErrorLogs] = useState("")
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ passwordPolicy: 'Strong', twoFactorAuth: false })
  const [settingsLoading, setSettingsLoading] = useState(false)

  const fetchSettings = async () => {
    setSettingsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/audit-logs/security-settings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setSettingsForm({
          passwordPolicy: data.passwordPolicy || 'Strong',
          twoFactorAuth: !!data.twoFactorAuth,
        })
      }
    } catch {}
    setSettingsLoading(false)
  }

  const handleExportLogs = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/audit-logs/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to export logs')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'audit-logs.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('Error exporting logs: ' + (err.message || err))
    }
  }

  const handleOpenSettings = () => {
    fetchSettings()
    setShowSettingsModal(true)
  }
  const handleSaveSettings = async () => {
    try {
      setSettingsLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/audit-logs/security-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(settingsForm),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setShowSettingsModal(false)
      alert('Security settings updated!')
    } catch (err: any) {
      alert('Error saving settings: ' + (err.message || err))
    }
    setSettingsLoading(false)
  }

  useEffect(() => {
    async function fetchAuditLogs() {
      setLoadingLogs(true)
      setErrorLogs("")
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/audit-logs`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            window.location.href = "/login"
            return
          }
          throw new Error("Failed to fetch audit logs")
        }
        const data = await res.json()
        setAuditLogs(data)
      } catch (err: any) {
        setErrorLogs(err.message || "Error fetching audit logs")
      }
      setLoadingLogs(false)
    }
    fetchAuditLogs()
    const socket = socketIOClient("http://localhost:5000")
    socket.on("auditlog:created", fetchAuditLogs)
    socket.on("auditlog:updated", fetchAuditLogs)
    socket.on("auditlog:deleted", fetchAuditLogs)
    socket.on("securitysettings:updated", fetchSettings)
    return () => {
      socket.disconnect()
    }
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-800"
      case "Warning":
        return "bg-yellow-100 text-yellow-800"
      case "Info":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRiskScoreColor = (score: string) => {
    switch (score) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Success":
        return "bg-green-100 text-green-800"
      case "Warning":
        return "bg-yellow-100 text-yellow-800"
      case "Error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredLogs = auditLogs.filter((log) => {
    const matches =
      (log.user || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.module || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(searchTerm.toLowerCase())

    const userMatches = selectedUser === "all" || log.user === selectedUser
    const moduleMatches = selectedModule === "all" || log.module === selectedModule
    const severityMatches = selectedSeverity === "all" || log.severity === selectedSeverity

    return matches && userMatches && moduleMatches && severityMatches
  })

  const totalLogs = auditLogs.length
  const criticalEvents = auditLogs.filter((log) => log.severity === "Critical").length
  const warningEvents = auditLogs.filter((log) => log.severity === "Warning").length
  const activeUsers = Array.from(new Set(auditLogs.map((log) => log.user))).length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Audit Trail & Security</h1>
            <p className="text-gray-600">Monitor user activities and system events</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
            <Button variant="outline" onClick={handleOpenSettings}>
              <Shield className="h-4 w-4 mr-2" />
              Security Settings
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Audit Logs</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLogs}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalEvents}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warning Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{warningEvents}</div>
              <p className="text-xs text-muted-foreground">Monitor closely</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeUsers}</div>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Log Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin@globalbooks.com">Admin</SelectItem>
                  <SelectItem value="accountant@globalbooks.com">Accountant</SelectItem>
                  <SelectItem value="auditor@globalbooks.com">Auditor</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="Sales Invoice">Sales Invoice</SelectItem>
                  <SelectItem value="Customer Master">Customer Master</SelectItem>
                  <SelectItem value="Product Master">Product Master</SelectItem>
                  <SelectItem value="Financial Reports">Financial Reports</SelectItem>
                  <SelectItem value="Authentication">Authentication</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Warning">Warning</SelectItem>
                  <SelectItem value="Info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Advanced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>Detailed log of all user activities and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLogs ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : errorLogs ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-red-500">
                      {errorLogs}
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No audit logs found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {log.timestamp}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user}</div>
                          <div className="text-sm text-gray-600">{log.userRole}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.module}</TableCell>
                      <TableCell className="font-mono text-sm">{log.recordId || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(log.severity)}>{log.severity}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* User Activity Summary */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Summary</CardTitle>
              <CardDescription>Overview of user activities and risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Today's Actions</TableHead>
                    <TableHead>Risk Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user}</div>
                          <div className="text-sm text-gray-600">{log.userRole}</div>
                        </div>
                      </TableCell>
                      <TableCell>{log.timestamp}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        <Badge className={getRiskScoreColor(log.severity)}>{log.severity}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* System Events */}
          <Card>
            <CardHeader>
              <CardTitle>System Events</CardTitle>
              <CardDescription>Recent system-wide events and status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.id}</TableCell>
                      <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                      <TableCell>{log.event}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">Security Settings</h2>
            <label className="block mb-1">Password Policy</label>
            <select className="w-full border rounded px-3 py-2 mb-2" value={settingsForm.passwordPolicy} onChange={e => setSettingsForm(f => ({ ...f, passwordPolicy: e.target.value }))}>
              <option value="Weak">Weak</option>
              <option value="Medium">Medium</option>
              <option value="Strong">Strong</option>
            </select>
            <label className="block mb-1">Two-Factor Authentication</label>
            <input type="checkbox" checked={settingsForm.twoFactorAuth} onChange={e => setSettingsForm(f => ({ ...f, twoFactorAuth: e.target.checked }))} /> Enable 2FA
            <div className="flex gap-2 justify-end mt-4">
              <Button onClick={handleSaveSettings} disabled={settingsLoading}>{settingsLoading ? 'Saving...' : 'Save'}</Button>
              <Button variant="outline" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
