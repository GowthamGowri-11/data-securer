export interface SensorData {
  id: string;
  userId: string;
  dataType: string;
  dataValue: string;
  timestamp: Date;
  hash: string;
  encryptedData: string;
  blockchainTxHash?: string;
  createdAt: Date;
}

export interface BlockchainRecord {
  hash: string;
  encryptedData: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

export interface VerificationResult {
  isValid: boolean;
  dataId: string;
  databaseHash: string;
  blockchainHash: string;
  timestamp: Date;
  message: string;
}

export interface RecoveryResult {
  success: boolean;
  dataId: string;
  recoveredData: SensorData | null;
  message: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  eventType: 'TAMPER_DETECTED' | 'RECOVERY_SUCCESS' | 'RECOVERY_FAILED' | 'VERIFICATION_PASSED' | 'VERIFICATION_FAILED' | 'DATA_SUBMITTED' | 'DATA_TAMPERED' | 'BLOCKCHAIN_STORED' | 'DELETED_DATA_RECOVERED' | 'DELETED_DATA_RECOVERY_FAILED';
  dataId: string;
  details: string;
  timestamp: Date;
}

export interface DashboardStats {
  totalRecords: number;
  integrityStatus: 'SECURE' | 'COMPROMISED';
  lastVerification: Date | null;
  tamperedRecords: number;
}
