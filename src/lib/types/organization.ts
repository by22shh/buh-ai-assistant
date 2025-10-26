export type SubjectType = "legal_entity" | "sole_proprietor";
export type AuthorityBase = "Устава" | "Доверенности";

export interface Organization {
  id?: string;
  userId?: string;
  is_default?: boolean;
  subject_type: SubjectType;
  name_full: string;
  name_short?: string;
  inn: string;
  kpp?: string;
  ogrn?: string;
  ogrnip?: string;
  okpo?: string;
  okved?: string;
  address_legal: string;
  address_postal?: string;
  phone?: string;
  email: string;
  website?: string;
  head_title: string;
  head_fio: string;
  authority_base: AuthorityBase;
  poa_number?: string;
  poa_date?: string;
  bank_bik: string;
  bank_name: string;
  bank_ks: string;
  bank_rs: string;
  seal_note?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationFormData extends Omit<Organization, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {}
