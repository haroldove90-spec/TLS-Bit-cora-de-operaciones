
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export type Section = 'dashboard' | 'trips' | 'activities' | 'expenses' | 'profile' | 'operators' | 'media' | 'bitacora' | 'logbook_evidence';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  licenseNumber?: string;
  licenseType?: string;
  licenseExpiry?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bloodType?: string;
  position?: string;
  hireDate?: string;
  status?: 'active' | 'paused' | 'offline';
}

export interface OtherExpense {
  description: string;
  amount: number;
}

export interface InspectionChecklist {
  tires: boolean;
  lights: boolean;
  fluids: boolean;
  brakes: boolean;
  documents: boolean;
  cleaned: boolean;
}

export interface LogBookEntry {
  id: string;
  // Grupo 1: Logística
  trip_num: string;
  departure_num: string;
  doc_delivery_date: string;
  log_delivery_date: string;

  // Grupo 2: Pago Electrónico
  fuel_card_liters: number;
  fuel_card_amount: number;
  tolls_tag_amount: number;
  subtotal_electronic: number;

  // Grupo 3: Unidad y Operación
  unit_eco: string;
  operator_id: string;
  operator_name: string;
  odo_initial: number;
  odo_final: number;
  total_distance: number;
  client: string;
  destinations: string;
  
  // Grupo 4: Gastos Efectivo
  fuel_cash_amount: number;
  tolls_cash_amount: number;
  food_amount: number;
  repairs_amount: number;
  maneuvers_amount: number;
  other_expenses: OtherExpense[];
  subtotal_cash: number;

  // Grupo 5: Evaluación y Seguridad
  inspection?: InspectionChecklist;
  eval_fuel_compliance: boolean;
  eval_docs_compliance: boolean;
  presented_at_load: boolean;
  on_time_route: boolean; 
  discipline_evidence: boolean;
  final_compliance: boolean;
  
  signature?: string; // Base64 image data
  total_expenses: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

export interface AppMedia {
  id: string;
  url: string;
  name: string;
  category: 'evidencia' | 'unidad' | 'documento' | 'otros';
  uploader_id: string;
  uploader_name: string;
  timestamp: string;
  size?: string;
}

export interface AppNotification {
  id: string;
  fromId: string;
  fromName: string;
  toId: string; 
  message: string;
  type: 'info' | 'alert' | 'success' | 'request' | 'expense_update';
  timestamp: string;
  tripId?: string;
  read: boolean;
}

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  operatorId: string;
  operatorName: string;
  vehicleId: string;
  startDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  aiInsights?: string;
  client: string;
  project: string;
  appointmentTime: string;
  arrivalTime: string;
  street: string;
  number: string;
  neighborhood: string;
  zip: string;
  loadSheetUrl?: string;
  billOfLadingUrl?: string;
  startMileage?: number;
  endMileage?: number;
}

export interface Activity {
  id: string;
  tripId: string;
  timestamp: string;
  type: 'status_update' | 'check_in' | 'incident' | 'maintenance' | 'notification';
  description: string;
  operatorName: string;
  operatorId?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface Expense {
  id: string;
  tripId: string;
  operatorId: string;
  operatorName: string;
  category: 'fuel' | 'food' | 'tolls' | 'maintenance' | 'others' | 'maniobras' | 'claves';
  amount: number;
  date: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  unitPrice?: number;
  dieselLiters?: number;
  odometer?: number;
  performance?: number;
  receiptUrl?: string;
}
