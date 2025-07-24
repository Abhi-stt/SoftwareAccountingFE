"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  { name: "Jan", total: 45000 },
  { name: "Feb", total: 52000 },
  { name: "Mar", total: 48000 },
  { name: "Apr", total: 61000 },
  { name: "May", total: 55000 },
  { name: "Jun", total: 67000 },
  { name: "Jul", total: 72000 },
  { name: "Aug", total: 69000 },
  { name: "Sep", total: 75000 },
  { name: "Oct", total: 78000 },
  { name: "Nov", total: 82000 },
  { name: "Dec", total: 85000 },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
