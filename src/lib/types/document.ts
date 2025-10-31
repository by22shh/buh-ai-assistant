export interface Document {
  id: string; // Prisma ID
  title?: string;
  templateCode: string;
  templateVersion: string;
  organizationId?: string;
  hasBodyChat: boolean;
  bodyText?: string;
  requisites?: Record<string, any>;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  userId: string;
  organization?: any; // Может быть заполнено из Prisma include
}

export interface DocumentFormData {
  templateCode: string;
  templateVersion: string;
  hasBodyChat: boolean;
  bodyText?: string;
  organizationId?: string;
  requisites: Record<string, any>;
}
