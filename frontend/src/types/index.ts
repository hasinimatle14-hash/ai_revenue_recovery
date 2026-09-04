export type RevenueEventType = 
  | 'failed_payment' 
  | 'abandoned_checkout' 
  | 'failed_subscription' 
  | 'overdue_invoice';

export interface RevenueEvent {
  event_id: string;
  event_type: RevenueEventType;
  timestamp: string;
  customer_id: string;
  customer_segment: string;
  amount: number;
  currency: string;
  payment_method: string;
  decline_reason_code: string;
  country: string;
  region: string;
  is_cross_border: boolean;
  merchant_id: string;
  merchant_type: string;
  previous_recovery_attempts: number;
}

export interface RootCause {
  cause_id: string;
  event_id: string;
  category: 'technical' | 'insufficient_funds' | 'user_abandonment' | 'expired_credentials' | 'other';
  confidence: number; // 0.0 to 1.0
  description: string;
  detected_at: string;
}

export interface Intervention {
  intervention_id: string;
  event_id: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'payment_link' | 'automated_retry' | 'smart_routing';
  target_recipient: string;
  template_id?: string;
  retry_delay_seconds?: number;
  selected_reason: string;
}

export interface RecoveryAttempt {
  attempt_id: string;
  event_id: string;
  intervention_id: string;
  sequence_number: number;
  sent_at: string;
  delivered_at?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked' | 'paid';
  error_message?: string;
}

export interface AuditEvent {
  audit_id: string;
  timestamp: string;
  actor: 'system' | 'merchant' | 'customer';
  action: string;
  entity_type: 'event' | 'diagnosis' | 'intervention' | 'attempt' | 'configuration';
  entity_id: string;
  details: string;
}

export interface RecoveryOutcome {
  outcome_id: string;
  event_id: string;
  status: 'recovered' | 'unrecoverable' | 'abandoned' | 'in_progress';
  recovered_amount?: number;
  recovered_at?: string;
  total_attempts: number;
  cost_incurred: number;
}
