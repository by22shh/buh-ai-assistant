/**
 * Mock-хранилище данных для демонстрации
 * В production это будет заменено на реальные API вызовы
 */

import type { User, AccessInfo, DemoStatus } from '../types/user';
import type { Organization } from '../types/organization';
import type { Document } from '../types/document';
import type { TemplateRequisites } from '../types/templateRequisites';

const STORAGE_KEY = 'buh_ai_app_data';

interface AppData {
  currentUser: User | null;
  users: User[];
  organizations: Organization[];
  documents: Document[];
  accessRecords: AccessInfo[];
  templateRequisites: TemplateRequisites[];
}

// Инициализация с дефолтными данными
const defaultData: AppData = {
  currentUser: null,
  users: [],
  organizations: [],
  documents: [],
  accessRecords: [],
  templateRequisites: []
};

// Загрузка данных из localStorage
function loadData(): AppData {
  if (typeof window === 'undefined') return defaultData;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultData;

  try {
    return JSON.parse(stored);
  } catch {
    return defaultData;
  }
}

// Сохранение данных в localStorage
function saveData(data: AppData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Глобальное хранилище
let appData = loadData();

// API для работы с пользователями
export const mockAuth = {
  getCurrentUser(): User | null {
    // Перезагружаем данные из localStorage при каждом вызове
    if (typeof window !== 'undefined') {
      appData = loadData();
    }
    return appData.currentUser;
  },

  login(phone: string, code: string): User {
    // Перезагружаем данные из localStorage
    if (typeof window !== 'undefined') {
      appData = loadData();
    }

    // Нормализуем номер телефона (убираем все символы кроме цифр и +)
    const normalizedPhone = phone.replace(/[\s\-()]/g, '');

    // Извлекаем только цифры для проверки
    const digitsOnly = normalizedPhone.replace(/\D/g, '');

    // Mock-авторизация: создаём или находим пользователя
    let user = appData.users.find(u => u.phone === normalizedPhone);

    if (!user) {
      // Создаём нового пользователя с демо-доступом на 30 дней
      const now = new Date();
      const accessUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Специальный номер для админа (проверяем последние 10 цифр)
      const last10Digits = digitsOnly.slice(-10);
      const isAdmin = last10Digits === '9999999999';

      user = {
        id: `user_${Date.now()}`,
        phone: normalizedPhone,
        role: isAdmin ? 'admin' : 'user',
        access_from: now.toISOString(),
        access_until: accessUntil.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      appData.users.push(user);
    }

    appData.currentUser = user;
    saveData(appData);

    return user;
  },

  logout() {
    appData.currentUser = null;
    saveData(appData);
  },

  updateProfile(updates: Partial<User>) {
    if (!appData.currentUser) return;

    appData.currentUser = {
      ...appData.currentUser,
      ...updates,
      updated_at: new Date().toISOString()
    };

    const userIndex = appData.users.findIndex(u => u.id === appData.currentUser?.id);
    if (userIndex !== -1) {
      appData.users[userIndex] = appData.currentUser;
    }

    saveData(appData);
  }
};

// API для работы с организациями
export const mockOrganizations = {
  getAll(userId: string): Organization[] {
    return appData.organizations.filter(org => org.userId === userId);
  },

  getById(id: string): Organization | undefined {
    return appData.organizations.find(org => org.id === id);
  },

  getDefault(userId: string): Organization | undefined {
    return appData.organizations.find(org => org.userId === userId && org.is_default);
  },

  create(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Organization {
    const now = new Date().toISOString();

    // Если новая организация default, снимаем флаг с остальных
    if (data.is_default) {
      appData.organizations.forEach(org => {
        if (org.userId === userId) {
          org.is_default = false;
        }
      });
    }

    const org: Organization = {
      ...data,
      id: `org_${Date.now()}`,
      userId,
      createdAt: now,
      updatedAt: now
    };

    appData.organizations.push(org);
    saveData(appData);
    return org;
  },

  update(id: string, data: Partial<Organization>): Organization | undefined {
    const index = appData.organizations.findIndex(org => org.id === id);
    if (index === -1) return undefined;

    const org = appData.organizations[index];

    // Если меняем default, снимаем с остальных
    if (data.is_default && org.userId) {
      appData.organizations.forEach(o => {
        if (o.userId === org.userId && o.id !== id) {
          o.is_default = false;
        }
      });
    }

    appData.organizations[index] = {
      ...org,
      ...data,
      updatedAt: new Date().toISOString()
    };

    saveData(appData);
    return appData.organizations[index];
  },

  delete(id: string): boolean {
    const index = appData.organizations.findIndex(org => org.id === id);
    if (index === -1) return false;

    appData.organizations.splice(index, 1);
    saveData(appData);
    return true;
  }
};

// API для работы с документами
export const mockDocuments = {
  getAll(userId: string): Document[] {
    return appData.documents.filter(doc => doc.userId === userId);
  },

  getById(id: string): Document | undefined {
    return appData.documents.find(doc => doc.docId === id);
  },

  create(data: Omit<Document, 'docId' | 'createdAt'>, userId: string): Document {
    const doc: Document = {
      ...data,
      docId: `doc_${Date.now()}`,
      userId,
      createdAt: new Date().toISOString()
    };

    appData.documents.push(doc);
    saveData(appData);
    return doc;
  },

  update(id: string, data: Partial<Document>): Document | undefined {
    const index = appData.documents.findIndex(doc => doc.docId === id);
    if (index === -1) return undefined;

    appData.documents[index] = {
      ...appData.documents[index],
      ...data
    };

    saveData(appData);
    return appData.documents[index];
  },

  count(userId: string): number {
    return appData.documents.filter(doc => doc.userId === userId).length;
  }
};

// API для демо-статуса
export const mockDemo = {
  getStatus(userId: string): DemoStatus {
    const user = appData.users.find(u => u.id === userId);
    if (!user) {
      return {
        isActive: false,
        documentsUsed: 0,
        documentsLimit: 5
      };
    }

    const docsCount = mockDocuments.count(userId);
    const now = new Date();
    const accessUntil = user.access_until ? new Date(user.access_until) : null;

    const isActive = accessUntil ? accessUntil > now && docsCount < 5 : false;
    const daysRemaining = accessUntil
      ? Math.max(0, Math.floor((accessUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : undefined;

    return {
      isActive,
      documentsUsed: docsCount,
      documentsLimit: 5,
      daysRemaining
    };
  }
};

// API для управления доступами (Admin)
export const mockAccess = {
  getAll(): AccessInfo[] {
    return appData.accessRecords;
  },

  getByUserId(userId: string): AccessInfo | undefined {
    return appData.accessRecords.find(rec => rec.userId === userId);
  },

  grant(userId: string, startDate: string, endDate: string, adminId: string, note?: string) {
    const user = appData.users.find(u => u.id === userId);
    if (!user) return;

    user.access_from = startDate;
    user.access_until = endDate;
    user.updated_at = new Date().toISOString();

    let accessInfo = appData.accessRecords.find(rec => rec.userId === userId);

    if (!accessInfo) {
      accessInfo = {
        userId,
        email: user.email,
        phone: user.phone,
        current_access: {
          status: 'active',
          start_date: startDate,
          end_date: endDate,
          updated_at: new Date().toISOString(),
          updated_by: adminId,
          admin_note: note
        },
        history: []
      };
      appData.accessRecords.push(accessInfo);
    } else {
      accessInfo.current_access = {
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        updated_at: new Date().toISOString(),
        updated_by: adminId,
        admin_note: note
      };
    }

    accessInfo.history.unshift({
      at: new Date().toISOString(),
      action: 'grant_or_extend',
      start_date: startDate,
      end_date: endDate,
      by: adminId,
      note
    });

    saveData(appData);
  },

  revoke(userId: string, adminId: string) {
    const user = appData.users.find(u => u.id === userId);
    if (!user) return;

    const now = new Date().toISOString();
    user.access_until = now;
    user.updated_at = now;

    const accessInfo = appData.accessRecords.find(rec => rec.userId === userId);
    if (accessInfo) {
      accessInfo.current_access.status = 'expired';
      accessInfo.current_access.end_date = now;
      accessInfo.current_access.updated_at = now;
      accessInfo.current_access.updated_by = adminId;

      accessInfo.history.unshift({
        at: now,
        action: 'revoke',
        by: adminId
      });
    }

    saveData(appData);
  }
};

// API для работы с реквизитами шаблонов
export const mockTemplateRequisites = {
  getByTemplateCode(templateCode: string): TemplateRequisites | undefined {
    if (typeof window !== 'undefined') {
      appData = loadData();
    }
    return appData.templateRequisites.find(tr => tr.templateCode === templateCode);
  },

  save(data: TemplateRequisites, userId: string): TemplateRequisites {
    if (typeof window !== 'undefined') {
      appData = loadData();
    }

    const now = new Date().toISOString();
    const requisites: TemplateRequisites = {
      ...data,
      updatedAt: now,
      updatedBy: userId
    };

    const index = appData.templateRequisites.findIndex(tr => tr.templateCode === data.templateCode);
    if (index !== -1) {
      appData.templateRequisites[index] = requisites;
    } else {
      appData.templateRequisites.push(requisites);
    }

    saveData(appData);
    return requisites;
  },

  delete(templateCode: string): boolean {
    if (typeof window !== 'undefined') {
      appData = loadData();
    }

    const index = appData.templateRequisites.findIndex(tr => tr.templateCode === templateCode);
    if (index === -1) return false;

    appData.templateRequisites.splice(index, 1);
    saveData(appData);
    return true;
  }
};

// Экспортируем функцию для сброса данных (для тестирования)
export function resetMockData() {
  appData = defaultData;
  saveData(appData);
}
