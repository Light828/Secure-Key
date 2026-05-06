"use client"

import { BarChart3, LineChart } from "lucide-react"
import { Bar, BarChart, Line, LineChart as RechartsLineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ChartProps {
  data: Array<{
    name: string
    revenue: number
    orders: number
  }>
}

export function RevenueChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue (R)" />
        <Line type="monotone" dataKey="orders" stroke="#3b82f6" name="Orders" strokeDasharray="5 5" />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

