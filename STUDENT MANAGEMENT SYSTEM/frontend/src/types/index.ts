export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type FeeStatus = 'PAID' | 'UNPAID' | 'PARTIAL' | 'WAIVED';
export type ExamType = 'MIDTERM' | 'FINAL' | 'QUIZ' | 'ASSIGNMENT' | 'PRACTICAL';

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  profile?: Student | Teacher | Admin;
}

export interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
}

export interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  gender: Gender;
  qualification?: string;
  specialization?: string;
  salary?: number;
  joiningDate: string;
  avatar?: string;
  user?: { email: string; isActive: boolean };
  subjects?: Subject[];
  classes?: ClassTeacher[];
}

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  phone?: string;
  gender: Gender;
  dateOfBirth?: string;
  address?: string;
  avatar?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  bloodGroup?: string;
  admissionDate: string;
  classId?: string;
  class?: Class;
  user?: { email: string; isActive: boolean };
  attendance?: Attendance[];
  fees?: Fee[];
  grades?: Grade[];
}

export interface Class {
  id: string;
  name: string;
  section: string;
  academicYear: string;
  capacity: number;
  roomNumber?: string;
  _count?: { students: number };
  teachers?: ClassTeacher[];
  subjects?: ClassSubject[];
}

export interface ClassTeacher {
  id: string;
  classId: string;
  teacherId: string;
  isClassTeacher: boolean;
  class?: Class;
  teacher?: Teacher;
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  subject?: Subject;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  teacherId?: string;
  teacher?: Teacher;
}

export interface Attendance {
  id: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  studentId: string;
  classId: string;
  student?: Student;
  class?: Class;
}

export interface Exam {
  id: string;
  title: string;
  examType: ExamType;
  subjectId: string;
  classId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  totalMarks: number;
  passingMarks: number;
  description?: string;
  subject?: Subject;
  class?: Class;
  results?: ExamResult[];
  _count?: { results: number };
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number;
  grade?: string;
  remarks?: string;
  isAbsent: boolean;
  exam?: Exam;
  student?: Student;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  academicYear: string;
  grade: string;
  gpa?: number;
  subject?: Subject;
}

export interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  academicYear: string;
  dueDate: string;
  description?: string;
}

export interface Fee {
  id: string;
  studentId: string;
  feeStructureId: string;
  amountPaid: number;
  status: FeeStatus;
  paymentDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  remarks?: string;
  feeStructure?: FeeStructure;
  student?: Student;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  targetRole?: Role;
  publishedAt: string;
  expiresAt?: string;
}

export interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalFees: number;
  paidFees: number;
  unpaidFees: number;
  totalRevenue: number;
  attendanceRate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}
