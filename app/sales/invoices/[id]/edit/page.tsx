"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function InvoiceEditPage() {
  const router = useRouter()
  const { id } = useParams()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function fetchInvoice() {
      setLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/sales-invoices/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error("Failed to fetch invoice")
        const data = await res.json()
        setInvoice(data)
        setStatus(data.status || "")
        setNotes(data.notes || "")
      } catch (err: any) {
        setError(err.message || "Error fetching invoice")
      }
      setLoading(false)
    }
    if (id) fetchInvoice()
  }, [id])

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/sales-invoices/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status, notes }),
      })
      if (!res.ok) throw new Error("Failed to update invoice")
      alert("Invoice updated!")
      router.push(`/sales`)
    } catch (err: any) {
      alert("Error updating invoice: " + (err.message || err))
    }
  }

  if (loading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>
  if (error) return <DashboardLayout><div className="p-8 text-red-500">{error}</div></DashboardLayout>
  if (!invoice) return <DashboardLayout><div className="p-8">No invoice found.</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-6 p-8">
        <h1 className="text-2xl font-bold mb-4">Edit Invoice</h1>
        <div><strong>Invoice Number:</strong> {invoice.invoiceNumber}</div>
        <div><strong>Customer:</strong> {invoice.customerId?.name || invoice.customerId}</div>
        <div><strong>Date:</strong> {invoice.date ? new Date(invoice.date).toLocaleDateString() : '-'}</div>
        <div><strong>Due Date:</strong> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</div>
        <div className="mb-4">
          <label>Status: </label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>
        </div>
        <div className="mb-4">
          <label>Notes: </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>Save</button>
      </div>
    </DashboardLayout>
  )
} 