"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function PurchaseBillEditPage() {
  const router = useRouter()
  const { id } = useParams()
  const [bill, setBill] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function fetchBill() {
      setLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/purchase-bills/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error("Failed to fetch bill")
        const data = await res.json()
        setBill(data)
        setStatus(data.status || "")
        setNotes(data.notes || "")
      } catch (err: any) {
        setError(err.message || "Error fetching bill")
      }
      setLoading(false)
    }
    if (id) fetchBill()
  }, [id])

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/purchase-bills/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status, notes }),
      })
      if (!res.ok) throw new Error("Failed to update bill")
      alert("Bill updated!")
      router.push(`/purchase`)
    } catch (err: any) {
      alert("Error updating bill: " + (err.message || err))
    }
  }

  if (loading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>
  if (error) return <DashboardLayout><div className="p-8 text-red-500">{error}</div></DashboardLayout>
  if (!bill) return <DashboardLayout><div className="p-8">No bill found.</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-6 p-8">
        <h1 className="text-2xl font-bold mb-4">Edit Purchase Bill</h1>
        <div><strong>Bill Number:</strong> {bill.billNumber}</div>
        <div><strong>Vendor:</strong> {bill.vendorId?.name || bill.vendorId}</div>
        <div><strong>Date:</strong> {bill.date ? new Date(bill.date).toLocaleDateString() : '-'}</div>
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