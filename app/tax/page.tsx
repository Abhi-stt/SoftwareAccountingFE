"use client"

import { useState, useEffect } from "react"
import { io as socketIOClient } from "socket.io-client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function TaxPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [taxes, setTaxes] = useState<any[]>([])
  const [loadingTaxes, setLoadingTaxes] = useState(true)
  const [errorTaxes, setErrorTaxes] = useState("")
  const [taxReturns, setTaxReturns] = useState<any[]>([])
  const [loadingReturns, setLoadingReturns] = useState(true)
  const [errorReturns, setErrorReturns] = useState("")
  const [showFileModal, setShowFileModal] = useState(false)
  const [selectedReturnId, setSelectedReturnId] = useState<string | undefined>(undefined)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newReturn, setNewReturn] = useState({ type: '', period: '', dueDate: '', totalSales: '', totalTax: '' })

  const fetchTaxes = async () => {
    setLoadingTaxes(true)
    setErrorTaxes("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/taxes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Failed to fetch taxes")
      const data = await res.json()
      setTaxes(data)
    } catch (err: any) {
      setErrorTaxes(err.message || "Error fetching taxes")
    }
    setLoadingTaxes(false)
  }
  useEffect(() => {
    fetchTaxes()
    // Socket.IO real-time updates
    const socket = socketIOClient("http://localhost:5000")
    socket.on("tax:created", fetchTaxes)
    socket.on("tax:updated", fetchTaxes)
    socket.on("tax:deleted", fetchTaxes)
    return () => {
      socket.disconnect()
    }
  }, [])

  const fetchTaxReturns = async () => {
    setLoadingReturns(true)
    setErrorReturns("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/tax-returns`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Failed to fetch tax returns")
      const data = await res.json()
      setTaxReturns(data)
    } catch (err: any) {
      setErrorReturns(err.message || "Error fetching tax returns")
    }
    setLoadingReturns(false)
  }
  useEffect(() => {
    fetchTaxReturns()
    // Socket.IO real-time updates
    const socket = socketIOClient("http://localhost:5000")
    socket.on("taxreturn:created", fetchTaxReturns)
    socket.on("taxreturn:updated", fetchTaxReturns)
    return () => {
      socket.disconnect()
    }
  }, [])

  const handleFileReturn = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/tax-returns/${id}/file`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Failed to file return")
      await fetchTaxReturns()
      alert("Return filed successfully!")
    } catch (err: any) {
      alert("Error filing return: " + (err.message || err))
    }
  }
  const handleDownloadReport = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/tax-returns/download-report`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Failed to download report")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tax-returns-report.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert("Error downloading report: " + (err.message || err))
    }
  }

  const handleCreateReturn = async () => {
    if (!newReturn.type || !newReturn.period || !newReturn.dueDate || !newReturn.totalSales || !newReturn.totalTax) {
      alert('Please fill all fields.')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/tax-returns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: newReturn.type,
          period: newReturn.period,
          dueDate: new Date(newReturn.dueDate),
          status: 'Pending',
          totalSales: Number(newReturn.totalSales),
          totalTax: Number(newReturn.totalTax),
        }),
      })
      if (!res.ok) throw new Error('Failed to create GST return')
      setShowCreateModal(false)
      setNewReturn({ type: '', period: '', dueDate: '', totalSales: '', totalTax: '' })
      await fetchTaxReturns()
      alert('GST return created!')
    } catch (err: any) {
      alert('Error: ' + (err.message || err))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Filed":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Filed":
        return <CheckCircle className="h-4 w-4" />
      case "Pending":
        return <Clock className="h-4 w-4" />
      case "Overdue":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const totalTaxLiability = taxes.reduce((sum, tax) => sum + Math.max(tax.balance || 0, 0), 0)
  const totalTaxCredit = Math.abs(taxes.reduce((sum, tax) => sum + Math.min(tax.balance || 0, 0), 0))
  const pendingReturns = taxes.filter((r) => r.status === "Pending").length
  const pendingReturnsList = taxReturns.filter(r => r.status === 'Pending')

  const handleOpenFileModal = () => {
    if (pendingReturnsList.length === 0) {
      alert("No pending GST return to file.")
      return
    }
    setSelectedReturnId(pendingReturnsList[0]._id)
    setShowFileModal(true)
  }
  const handleConfirmFileReturn = async () => {
    if (!selectedReturnId) {
      alert("Please select a GST return to file.")
      return
    }
    await handleFileReturn(selectedReturnId)
    setShowFileModal(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">GST & Tax Compliance</h1>
            <p className="text-gray-600">Manage tax returns, compliance, and reporting</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleOpenFileModal} disabled={pendingReturnsList.length === 0}>
              <FileText className="h-4 w-4 mr-2" />
              File Return
            </Button>
            <Button variant="outline" onClick={() => setShowCreateModal(true)}>
              New GST Return
            </Button>
            <Button variant="outline" onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Reports
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tax Liability</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalTaxLiability.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Outstanding amount</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tax Credit</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalTaxCredit.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Available credit</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Returns</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReturns}</div>
              <p className="text-xs text-muted-foreground">Need to be filed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">95%</div>
              <p className="text-xs text-muted-foreground">Excellent compliance</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="returns" className="space-y-4">
          <TabsList>
            <TabsTrigger value="returns">GST Returns</TabsTrigger>
            <TabsTrigger value="summary">Tax Summary</TabsTrigger>
            <TabsTrigger value="hsn">HSN Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="returns">
            <Card>
              <CardHeader>
                <CardTitle>GST Returns Status</CardTitle>
                <CardDescription>Track your GST return filing status and due dates</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingReturns ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : errorReturns ? (
                  <div className="text-red-500 text-center p-4">{errorReturns}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Return Type</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Filed Date</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                        <TableHead className="text-right">Total Tax</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxReturns.map((returnItem) => (
                        <TableRow key={returnItem._id}>
                          <TableCell className="font-medium">{returnItem.type || '-'}</TableCell>
                          <TableCell>{returnItem.period || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {returnItem.dueDate ? new Date(returnItem.dueDate).toLocaleDateString() : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(returnItem.status || 'Pending')}
                              <Badge className={getStatusColor(returnItem.status || 'Pending')}>
                                {returnItem.status || 'Pending'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{returnItem.filedDate ? new Date(returnItem.filedDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="text-right">₹{(returnItem.totalSales || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">₹{(returnItem.totalTax || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {returnItem.status === "Pending" ? (
                                <Button size="sm" onClick={() => handleFileReturn(returnItem._id)}>File Now</Button>
                              ) : (
                                <Button variant="outline" size="sm">
                                  View
                                </Button>
                              )}
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

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Tax Summary</CardTitle>
                <CardDescription>Overview of tax collected, paid, and outstanding</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTaxes ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : errorTaxes ? (
                  <div className="text-red-500 text-center p-4">{errorTaxes}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tax Type</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead className="text-right">Collected</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxes.map((tax, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{tax.taxType || '-'}</TableCell>
                          <TableCell>{tax.rate || '-'}</TableCell>
                          <TableCell className="text-right">₹{(tax.collected || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">₹{(tax.paid || 0).toLocaleString()}</TableCell>
                          <TableCell
                            className={`text-right ${
                              (tax.balance || 0) > 0 ? "text-red-600" : (tax.balance || 0) < 0 ? "text-green-600" : ""
                            }`}
                          >
                            ₹{Math.abs(tax.balance || 0).toLocaleString()}
                            {(tax.balance || 0) < 0 && " (Credit)"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hsn">
            <Card>
              <CardHeader>
                <CardTitle>HSN-wise Tax Summary</CardTitle>
                <CardDescription>Tax breakdown by HSN/SAC codes</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTaxes ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : errorTaxes ? (
                  <div className="text-red-500 text-center p-4">{errorTaxes}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>HSN Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Taxable Value</TableHead>
                        <TableHead className="text-right">CGST</TableHead>
                        <TableHead className="text-right">SGST</TableHead>
                        <TableHead className="text-right">IGST</TableHead>
                        <TableHead className="text-right">Total Tax</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxes.map((hsn, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{hsn.hsn || '-'}</TableCell>
                          <TableCell>{hsn.description || '-'}</TableCell>
                          <TableCell className="text-right">₹{(hsn.taxableValue || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">₹{(hsn.cgst || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">₹{(hsn.sgst || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">₹{(hsn.igst || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">₹{(hsn.totalTax || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {showFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">File GST Return</h2>
            <label className="block mb-2">Select Pending Return:</label>
            <select
              className="w-full border rounded px-3 py-2 mb-4"
              value={selectedReturnId}
              onChange={e => setSelectedReturnId(e.target.value)}
            >
              {pendingReturnsList.map(r => (
                <option key={r._id} value={r._id}>
                  {r.type} - {r.period} (Due: {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-'})
                </option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <Button onClick={handleConfirmFileReturn}>File</Button>
              <Button variant="outline" onClick={() => setShowFileModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">Create GST Return</h2>
            <label className="block mb-1">Return Type</label>
            <input className="w-full border rounded px-3 py-2 mb-2" value={newReturn.type} onChange={e => setNewReturn(r => ({ ...r, type: e.target.value }))} placeholder="e.g. GSTR-3B" />
            <label className="block mb-1">Period</label>
            <input className="w-full border rounded px-3 py-2 mb-2" value={newReturn.period} onChange={e => setNewReturn(r => ({ ...r, period: e.target.value }))} placeholder="e.g. Jan 2024" />
            <label className="block mb-1">Due Date</label>
            <input type="date" className="w-full border rounded px-3 py-2 mb-2" value={newReturn.dueDate} onChange={e => setNewReturn(r => ({ ...r, dueDate: e.target.value }))} />
            <label className="block mb-1">Total Sales</label>
            <input type="number" className="w-full border rounded px-3 py-2 mb-2" value={newReturn.totalSales} onChange={e => setNewReturn(r => ({ ...r, totalSales: e.target.value }))} />
            <label className="block mb-1">Total Tax</label>
            <input type="number" className="w-full border rounded px-3 py-2 mb-4" value={newReturn.totalTax} onChange={e => setNewReturn(r => ({ ...r, totalTax: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <Button onClick={handleCreateReturn}>Create</Button>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}