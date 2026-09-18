export interface Laboratorio {
  id: string
  nombre: string
  email: string | null
  telefono: string | null
  direcccion: string | null
  ciudad: string | null
  logo_url: string | null
  plan: 'starter' | 'professional' | 'enterprise'
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  name: string
  email: string
  role: 'admin' | 'technician' | 'assistant' | 'manager'
  department: string
  phone: string
  active: boolean
  avatar?: string
}

export interface Odontologist {
  id: string
  name: string
  email: string
  clinic: string
  specialty: string
  phone: string
  totalRequests: number
  pendingRequests: number
  avatar?: string
}

export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'

export interface Request {
  id: string
  odontologistId: string
  odontologistName: string
  type: string
  status: RequestStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  progress: number
  assignedTo?: string
  createdAt: string
  updatedAt: string
  notes?: string
}
