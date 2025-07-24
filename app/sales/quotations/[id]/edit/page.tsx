"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function QuotationEditPage() {
  const router = useRouter()
  const { id } = useParams()
  const [quotation, setQuotation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [notes, setNotes] = useState("")

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
        const data = await res.json()
        setQuotation(data)
        setStatus(data.status || "")
        setNotes(data.notes || "")
      } catch (err: any) {
        setError(err.message || "Error fetching quotation")
      }
      setLoading(false)
    }
    if (id) fetchQuotation()
  }, [id])

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/quotations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status, notes }),
      })
      if (!res.ok) throw new Error("Failed to update quotation")
      alert("Quotation updated!")
      router.push(`/sales`)
    } catch (err: any) {
      alert("Error updating quotation: " + (err.message || err))
    }
  }

  if (loading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>
  if (error) return <DashboardLayout><div className="p-8 text-red-500">{error}</div></DashboardLayout>
  if (!quotation) return <DashboardLayout><div className="p-8">No quotation found.</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-6 p-8">
        <h1 className="text-2xl font-bold mb-4">Edit Quotation</h1>
        <div><strong>Quotation Number:</strong> {quotation.quotationNumber}</div>
        <div><strong>Customer:</strong> {quotation.customerId?.name || quotation.customerId}</div>
        <div><strong>Date:</strong> {quotation.date ? new Date(quotation.date).toLocaleDateString() : '-'}</div>
        <div><strong>Valid Until:</strong> {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : '-'}</div>
        <div className="mb-4">
          <label>Status: </label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
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