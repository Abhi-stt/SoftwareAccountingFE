"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function PurchaseOrderEditPage() {
  const router = useRouter()
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error("Failed to fetch order")
        const data = await res.json()
        setOrder(data)
        setStatus(data.status || "")
        setNotes(data.notes || "")
      } catch (err: any) {
        setError(err.message || "Error fetching order")
      }
      setLoading(false)
    }
    if (id) fetchOrder()
  }, [id])

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status, notes }),
      })
      if (!res.ok) throw new Error("Failed to update order")
      alert("Order updated!")
      router.push(`/purchase`)
    } catch (err: any) {
      alert("Error updating order: " + (err.message || err))
    }
  }

  if (loading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>
  if (error) return <DashboardLayout><div className="p-8 text-red-500">{error}</div></DashboardLayout>
  if (!order) return <DashboardLayout><div className="p-8">No order found.</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="space-y-6 p-8">
        <h1 className="text-2xl font-bold mb-4">Edit Purchase Order</h1>
        <div><strong>Order Number:</strong> {order.orderNumber}</div>
        <div><strong>Vendor:</strong> {order.vendorId?.name || order.vendorId}</div>
        <div><strong>Date:</strong> {order.date ? new Date(order.date).toLocaleDateString() : '-'}</div>
        <div className="mb-4">
          <label>Status: </label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Cancelled">Cancelled</option>
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