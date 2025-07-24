"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function QuotationDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [quotation, setQuotation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchQuotation() {
      setLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/quotations/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error("Failed to fetch quotation")
        setQuotation(await res.json())
      } catch (err: any) {
        setError(err.message || "Error fetching quotation")
      }
      setLoading(false)
    }
    if (id) fetchQuotation()
  }, [id])

  if (loading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>
  if (error) return <DashboardLayout><div className="p-8 text-red-500">{error}</div></DashboardLayout>
  if (!quotation) return <DashboardLayout><div className="p-8">No quotation found.</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-6 p-8">
        <h1 className="text-2xl font-bold mb-4">Quotation Details</h1>
        <div><strong>Quotation Number:</strong> {quotation.quotationNumber}</div>
        <div><strong>Customer:</strong> {quotation.customerId?.name || quotation.customerId}</div>
        <div><strong>Date:</strong> {quotation.date ? new Date(quotation.date).toLocaleDateString() : '-'}</div>
        <div><strong>Valid Until:</strong> {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : '-'}</div>
        <div><strong>Status:</strong> {quotation.status}</div>
        <div><strong>Total Amount:</strong> ₹{typeof quotation.totalAmount === 'number' ? quotation.totalAmount.toLocaleString() : '-'}</div>
        <div><strong>Notes:</strong> {quotation.notes}</div>
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Line Items</h2>
          <ul className="list-disc pl-6">
            {quotation.items?.map((item: any, idx: number) => (
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