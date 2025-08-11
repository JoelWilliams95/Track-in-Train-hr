export interface TransportRoute {
  id: string;
  name: string;
  startPoint: import('../lib/leaflet-maps').Location;
  pickupPoints: PickupPoint[];
  endPoint: import('../lib/leaflet-maps').Location;
  totalUsers: number;
  route: import('../lib/leaflet-maps').Location[];
  routeGeometry?: any;
}

export interface PickupPoint {
  id: string;
  name: string;
  location: import('../lib/leaflet-maps').Location;
  currentUsers: number;
  maxCapacity: number;
}

export interface EmployeeProfile {
  id: string;
  fullName: string;
  address: string;
  location?: import('../lib/leaflet-maps').Location;
  // Add other relevant fields as needed
}
import mongoose, { Schema, Document } from 'mongoose';

// Comment Interface and Schema
export interface IComment extends Document {
  author: string;
  text: string;
  date: string;
  profileId?: string;
  mentions?: string[];
}

const CommentSchema = new Schema<IComment>({
  author: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: String, required: true },
  profileId: { type: String },
  mentions: [{ type: String }]
});

// Personnel Record Interface and Schema
export interface IPersonnelRecord extends Document {
  fullName: string;
  cin: string;
  dateAdded: string;
  recruitDate: string;
  trainingStartDate?: string;
  photo?: string;
  poste: string;
  status: 'Recruit' | 'Waiting for Test' | 'Employed' | 'Departed';
  zone: string;
  subZone?: string;
  address?: string;
  trajectoryCode?: string;
  phoneNumber?: string;
  transportNumber?: string;
  formationStatus?: string;
  birthdate?: string;
  comments: IComment[];
  
  // Recruit lifecycle fields
  dateOfIntegration?: string;
  technicalTrainingCompleted?: boolean;
  theoreticalTrainingCompleted?: boolean;
  testDay?: string;
  testResult?: 'Pass' | 'Fail but Promising' | 'Fail';
  validationDate?: string;
  retestScheduled?: string;
  testHistory?: Array<{ date: string; result: string }>;
  retestResult?: 'Pass' | 'Fail but Promising' | 'Fail';
  departureDate?: string;
  departureReason?: string;
}

const PersonnelRecordSchema = new Schema<IPersonnelRecord>({
  fullName: { type: String, required: true, unique: true },
  cin: { type: String, required: true },
  dateAdded: { type: String, required: true },
  recruitDate: { type: String, required: true },
  trainingStartDate: { type: String },
  photo: { type: String, default: '' },
  poste: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Recruit', 'Waiting for Test', 'Employed', 'Departed'],
    required: true 
  },
  zone: { type: String, required: true },
  subZone: { type: String },
  address: { type: String },
  trajectoryCode: { type: String },
  phoneNumber: { type: String },
  transportNumber: { type: String },
  formationStatus: { type: String },
  birthdate: { type: String },
  comments: [CommentSchema],
  
  // Recruit lifecycle fields
  dateOfIntegration: { type: String },
  technicalTrainingCompleted: { type: Boolean, default: false },
  theoreticalTrainingCompleted: { type: Boolean, default: false },
  testDay: { type: String },
  testResult: { 
    type: String, 
    enum: ['Pass', 'Fail but Promising', 'Fail'] 
  },
  validationDate: { type: String },
  retestScheduled: { type: String },
  testHistory: [{
    date: { type: String },
    result: { type: String }
  }],
  retestResult: { 
    type: String, 
    enum: ['Pass', 'Fail but Promising', 'Fail'] 
  },
  departureDate: { type: String },
  departureReason: { type: String }
}, {
  timestamps: true
});

// User Interface and Schema
export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: 'SuperAdmin' | 'User' | 'hr' | 'manager' | 'teamlead';
  zone: string;
  position?: string;
  phoneNumber?: string;
  address?: string;
  isActive: boolean;
  lastLogin?: Date;
}

const UserSchema = new Schema<IUser>({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SuperAdmin', 'User', 'hr', 'manager', 'teamlead'],
    required: true 
  },
  zone: { type: String, required: true },
  position: { type: String },
  phoneNumber: { type: String },
  address: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, {
  timestamps: true
});

// Notification Interface and Schema
export interface INotification extends Document {
  type: 'tag' | 'profile_added' | 'system';
  targetUser: string;
  message: string;
  read: boolean;
  data?: {
    taggerName?: string;
    profileName?: string;
    profileId?: string;
    comment?: string;
    actionType?: string;
    zone?: string;
    adderName?: string;
  };
}

const NotificationSchema = new Schema<INotification>({
  type: { 
    type: String, 
    enum: ['tag', 'profile_added', 'system'],
    required: true 
  },
  targetUser: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  data: {
    taggerName: { type: String },
    profileName: { type: String },
    profileId: { type: String },
    comment: { type: String },
    actionType: { type: String },
    zone: { type: String },
    adderName: { type: String }
  }
}, {
  timestamps: true
});

// Log Interface and Schema
export interface ILog extends Document {
  user: string;
  action: string;
  details: string;
  target?: string;
  category: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'SEARCH' | 'FILTER' | 'EXPORT' | 'OTHER';
  severity: 'INFO' | 'WARNING' | 'ERROR';
}

const LogSchema = new Schema<ILog>({
  user: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  target: { type: String },
  category: { 
    type: String, 
    enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'SEARCH', 'FILTER', 'EXPORT', 'OTHER'],
    default: 'OTHER'
  },
  severity: { 
    type: String, 
    enum: ['INFO', 'WARNING', 'ERROR'],
    default: 'INFO'
  }
}, {
  timestamps: true,
  collection: 'personnelRecords' // Explicitly specify the collection name
});

// Export Models
export const PersonnelRecord = mongoose.models.PersonnelRecord || mongoose.model<IPersonnelRecord>('PersonnelRecord', PersonnelRecordSchema);
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const Log = mongoose.models.Log || mongoose.model<ILog>('Log', LogSchema);
export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
