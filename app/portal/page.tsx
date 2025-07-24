"use client"

import { useState, useEffect } from "react"
import { io as socketIOClient } from "socket.io-client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, Download, Eye, Edit, Users, Building, Link, Mail, Key } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function PortalPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [clientUsers, setClientUsers] = useState<any[]>([])
  const [vendorUsers, setVendorUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [errorUsers, setErrorUsers] = useState("")
  const [activity, setActivity] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [errorActivity, setErrorActivity] = useState("")
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'Client', company: '', accessLevel: 'read' })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ companyName: '', logoUrl: '', portalBranding: '' })
  const [settingsLoading, setSettingsLoading] = useState(false)

  useEffect(() => {
    async function fetchPortalUsers() {
      setLoadingUsers(true)
      setErrorUsers("")
      try {
        const token = localStorage.getItem("token")
        const res: Response = await fetch(`${API_BASE_URL}/portal-users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            window.location.href = "/login"
            return
          }
          throw new Error("Failed to fetch portal users")
        }
        const data = await res.json()
        setClientUsers(data.filter((u: any) => u.role === "Client"))
        setVendorUsers(data.filter((u: any) => u.role === "Vendor"))
      } catch (err: any) {
        setErrorUsers(err.message || "Error fetching portal users")
      }
      setLoadingUsers(false)
    }
    async function fetchPortalActivity() {
      setLoadingActivity(true)
      setErrorActivity("")
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/audit-logs?module=Portal`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            window.location.href = "/login"
            return
          }
          throw new Error("Failed to fetch portal activity")
        }
        const data = await res.json()
        setActivity(data)
      } catch (err: any) {
        setErrorActivity(err.message || "Error fetching portal activity")
      }
      setLoadingActivity(false)
    }
    fetchPortalUsers()
    fetchPortalActivity()
    const socket = socketIOClient("http://localhost:5000")
    socket.on("portaluser:created", fetchPortalUsers)
    socket.on("portaluser:updated", fetchPortalUsers)
    socket.on("portaluser:deleted", fetchPortalUsers)
    socket.on("auditlog:created", fetchPortalActivity)
    socket.on("auditlog:updated", fetchPortalActivity)
    socket.on("auditlog:deleted", fetchPortalActivity)
    return () => {
      socket.disconnect()
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Inactive":
        return "bg-red-100 text-red-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "Client":
        return "bg-blue-100 text-blue-800"
      case "Vendor":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredClientUsers = clientUsers.filter(
    (user) =>
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredVendorUsers = vendorUsers.filter(
    (user) =>
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredActivity = activity.filter(
    (activity) =>
      activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.details.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalClientUsers = clientUsers.length
  const totalVendorUsers = vendorUsers.length
  const activeClientUsers = clientUsers.filter((u) => u.status === "Active").length
  const activeVendorUsers = vendorUsers.filter((u) => u.status === "Active").length

  const handleInviteUser = async () => {
    if (!inviteForm.email || !inviteForm.company) {
      alert('Please fill all fields')
      return
    }
    try {
      setInviteLoading(true)
      const token = localStorage.getItem('token')
      let linkedId = null
      if (inviteForm.role === 'Client') {
        // Look up customer by company name
        let res = await fetch(`${API_BASE_URL}/customers?search=${encodeURIComponent(inviteForm.company)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        let data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          linkedId = data[0]._id
        } else {
          // Create customer if not found (provide all fields)
          res = await fetch(`${API_BASE_URL}/customers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              name: inviteForm.company,
              email: inviteForm.email,
              phone: '',
              address: '',
              gstNumber: '',
              currency: 'INR',
            }),
          })
          if (!res.ok) throw new Error('Failed to create customer')
          data = await res.json()
          linkedId = data._id
        }
      } else if (inviteForm.role === 'Vendor') {
        // Look up vendor by company name
        let res = await fetch(`${API_BASE_URL}/vendors?search=${encodeURIComponent(inviteForm.company)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        let data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          linkedId = data[0]._id
        } else {
          // Create vendor if not found (provide all fields)
          res = await fetch(`${API_BASE_URL}/vendors`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              name: inviteForm.company,
              email: inviteForm.email,
              phone: '',
              address: '',
              gstNumber: '',
              currency: 'INR',
            }),
          })
          if (!res.ok) throw new Error('Failed to create vendor')
          data = await res.json()
          linkedId = data._id
        }
      }
      const res = await fetch(`${API_BASE_URL}/portal-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...inviteForm, linkedCustomerOrVendorId: linkedId }),
      })
      if (!res.ok) throw new Error('Failed to invite user')
      setShowInviteModal(false)
      setInviteForm({ email: '', role: 'Client', company: '', accessLevel: 'read' })
      alert('User invitation sent successfully!')
    } catch (err: any) {
      alert('Error inviting user: ' + (err.message || err))
    }
    setInviteLoading(false)
  }

  const fetchSettings = async () => {
    setSettingsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/settings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setSettingsForm({
            companyName: data[0].companyName || '',
            logoUrl: data[0].logoUrl || '',
            portalBranding: data[0].portalBranding || '',
          })
        }
      }
    } catch {}
    setSettingsLoading(false)
  }
  const handleOpenSettings = () => {
    fetchSettings()
    setShowSettingsModal(true)
  }
  const handleSaveSettings = async () => {
    try {
      setSettingsLoading(true)
      const token = localStorage.getItem('token')
      // Assume only one settings doc, update the first
      const resGet = await fetch(`${API_BASE_URL}/settings`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const data = await resGet.json()
      const id = Array.isArray(data) && data.length > 0 ? data[0]._id : null
      if (!id) throw new Error('No settings found')
      const res = await fetch(`${API_BASE_URL}/settings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(settingsForm),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setShowSettingsModal(false)
      alert('Portal settings updated!')
    } catch (err: any) {
      alert('Error saving settings: ' + (err.message || err))
    }
    setSettingsLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Client & Vendor Portal</h1>
            <p className="text-gray-600">Manage external user access and portal activities</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowInviteModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
            <Button variant="outline" onClick={handleOpenSettings}>
              <Link className="h-4 w-4 mr-2" />
              Portal Settings
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClientUsers}</div>
              <p className="text-xs text-muted-foreground">{activeClientUsers} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendor Users</CardTitle>
              <Building className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVendorUsers}</div>
              <p className="text-xs text-muted-foreground">{activeVendorUsers} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portal Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Document Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clients" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="clients">Client Portal Users</TabsTrigger>
              <TabsTrigger value="vendors">Vendor Portal Users</TabsTrigger>
              <TabsTrigger value="activity">Portal Activity</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Client Portal Users</CardTitle>
                <CardDescription>Manage customer access to invoices and reports</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <p>Loading client users...</p>
                ) : errorUsers ? (
                  <p className="text-red-500">{errorUsers}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Invoices</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClientUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.company}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{user.lastLogin}</TableCell>
                          <TableCell>{user.totalInvoices}</TableCell>
                          <TableCell className={user.outstandingAmount > 0 ? "text-red-600" : "text-green-600"}>
                            ₹{typeof user.outstandingAmount === 'number' ? user.outstandingAmount.toLocaleString() : '0'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Key className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Portal Users</CardTitle>
                <CardDescription>Manage supplier access to purchase orders and bills</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <p>Loading vendor users...</p>
                ) : errorUsers ? (
                  <p className="text-red-500">{errorUsers}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Bills</TableHead>
                        <TableHead>Pending</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVendorUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.company}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{user.lastLogin}</TableCell>
                          <TableCell>{user.totalBills}</TableCell>
                          <TableCell className={user.pendingAmount > 0 ? "text-yellow-600" : "text-green-600"}>
                            ₹{typeof user.pendingAmount === 'number' ? user.pendingAmount.toLocaleString() : '0'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Key className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Portal Activity Log</CardTitle>
                <CardDescription>Track user activities across client and vendor portals</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActivity ? (
                  <p>Loading activity logs...</p>
                ) : errorActivity ? (
                  <p className="text-red-500">{errorActivity}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>User Type</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActivity.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="font-mono text-sm">{activity.timestamp}</TableCell>
                          <TableCell className="font-medium">{activity.user}</TableCell>
                          <TableCell>
                            <Badge className={getUserTypeColor(activity.userType)}>{activity.userType}</Badge>
                          </TableCell>
                          <TableCell>{activity.action}</TableCell>
                          <TableCell>{activity.details}</TableCell>
                          <TableCell className="font-mono text-sm">{activity.ipAddress}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Portal Access Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Portal Access Information</CardTitle>
            <CardDescription>Instructions for clients and vendors to access their portals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Client Portal</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>URL:</strong> https://portal.globalbooks.com/client
                  </p>
                  <p>
                    <strong>Features:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>View and download invoices</li>
                    <li>Track payment status</li>
                    <li>Access financial reports</li>
                    <li>Make online payments</li>
                    <li>Update contact information</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Vendor Portal</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>URL:</strong> https://portal.globalbooks.com/vendor
                  </p>
                  <p>
                    <strong>Features:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Upload bills and invoices</li>
                    <li>View purchase orders</li>
                    <li>Track payment status</li>
                    <li>Submit quotations</li>
                    <li>Update company information</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">Invite Portal User</h2>
            <label className="block mb-1">Email</label>
            <input className="w-full border rounded px-3 py-2 mb-2" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} placeholder="user@email.com" />
            <label className="block mb-1">Role</label>
            <select className="w-full border rounded px-3 py-2 mb-2" value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}>
              <option value="Client">Client</option>
              <option value="Vendor">Vendor</option>
            </select>
            <label className="block mb-1">Company</label>
            <input className="w-full border rounded px-3 py-2 mb-2" value={inviteForm.company} onChange={e => setInviteForm(f => ({ ...f, company: e.target.value }))} placeholder="Company Name" />
            <label className="block mb-1">Access Level</label>
            <select className="w-full border rounded px-3 py-2 mb-4" value={inviteForm.accessLevel} onChange={e => setInviteForm(f => ({ ...f, accessLevel: e.target.value }))}>
              <option value="read">Read</option>
              <option value="write">Write</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2 justify-end">
              <Button onClick={handleInviteUser} disabled={inviteLoading}>{inviteLoading ? 'Inviting...' : 'Invite'}</Button>
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">Portal Settings</h2>
            <label className="block mb-1">Company Name</label>
            <input className="w-full border rounded px-3 py-2 mb-2" value={settingsForm.companyName} onChange={e => setSettingsForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Company Name" />
            <label className="block mb-1">Logo URL</label>
            <input className="w-full border rounded px-3 py-2 mb-2" value={settingsForm.logoUrl} onChange={e => setSettingsForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." />
            <label className="block mb-1">Portal Branding</label>
            <input className="w-full border rounded px-3 py-2 mb-4" value={settingsForm.portalBranding} onChange={e => setSettingsForm(f => ({ ...f, portalBranding: e.target.value }))} placeholder="Branding Info" />
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSaveSettings} disabled={settingsLoading}>{settingsLoading ? 'Saving...' : 'Save'}</Button>
              <Button variant="outline" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
