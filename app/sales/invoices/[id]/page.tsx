"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function InvoiceDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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
        setInvoice(await res.json())
      } catch (err: any) {
        setError(err.message || "Error fetching invoice")
      }
      setLoading(false)
    }
    if (id) fetchInvoice()
  }, [id])

  if (loading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>
  if (error) return <DashboardLayout><div className="p-8 text-red-500">{error}</div></DashboardLayout>
  if (!invoice) return <DashboardLayout><div className="p-8">No invoice found.</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-6 p-8">
        <h1 className="text-2xl font-bold mb-4">Invoice Details</h1>
        <div><strong>Invoice Number:</strong> {invoice.invoiceNumber}</div>
        <div><strong>Customer:</strong> {invoice.customerId?.name || invoice.customerId}</div>
        <div><strong>Date:</strong> {invoice.date ? new Date(invoice.date).toLocaleDateString() : '-'}</div>
        <div><strong>Due Date:</strong> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</div>
        <div><strong>Status:</strong> {invoice.status}</div>
        <div><strong>Total Amount:</strong> ₹{typeof invoice.totalAmount === 'number' ? invoice.totalAmount.toLocaleString() : '-'}</div>
        <div><strong>Notes:</strong> {invoice.notes}</div>
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Line Items</h2>
          <ul className="list-disc pl-6">
            {invoice.items?.map((item: any, idx: number) => (
              <li key={idx}>
                {item.description || item.productId} - Qty: {item.quantity}, Rate: ₹{item.rate}, Amount: ₹{item.amount}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
} 