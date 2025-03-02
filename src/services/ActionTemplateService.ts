// src/services/ActionTemplateService.ts
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore'
import { ActionTemplateSchema } from '../types/firestore-schema'

export class ActionTemplateService {
  private db = getFirestore()
  private templatesCollection = collection(this.db, 'actionTemplates')

  async createActionTemplate(
    templateData: Omit<ActionTemplateSchema, 'id'>
  ): Promise<ActionTemplateSchema> {
    try {
      const templateRef = doc(this.templatesCollection)
      const newTemplate: ActionTemplateSchema = {
        id: templateRef.id,
        ...templateData,
        order: Date.now(), // Set initial order
      }
      await setDoc(templateRef, newTemplate)
      return newTemplate
    } catch (error) {
      console.error('Error creating action template:', error)
      throw error
    }
  }

  async getActionTemplateById(templateId: string): Promise<ActionTemplateSchema | null> {
    try {
      const templateRef = doc(this.db, 'actionTemplates', templateId)
      const templateSnap = await getDoc(templateRef)

      if (templateSnap.exists()) {
        return {
          id: templateSnap.id,
          ...templateSnap.data()
        } as ActionTemplateSchema
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting action template:', error)
      throw error
    }
  }

  async updateActionTemplate(
    templateId: string,
    updates: Partial<ActionTemplateSchema>
  ): Promise<void> {
    try {
      const templateRef = doc(this.db, 'actionTemplates', templateId)
      await updateDoc(templateRef, updates)
    } catch (error) {
      console.error('Error updating action template:', error)
      throw error
    }
  }

  async deleteActionTemplate(templateId: string): Promise<void> {
    try {
      const templateRef = doc(this.db, 'actionTemplates', templateId)
      await deleteDoc(templateRef)
    } catch (error) {
      console.error('Error deleting action template:', error)
      throw error
    }
  }

    async fetchActionTemplates(): Promise<ActionTemplateSchema[]> {
        try {
            const q = query(this.templatesCollection, orderBy('order', 'asc')); // Order by the 'order' field
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ActionTemplateSchema));
        } catch (error) {
            console.error('Error fetching action templates:', error);
            throw error;
        }
    }

    async updateTemplateOrder(newOrder: ActionTemplateSchema[]): Promise<void> {
        const batch = writeBatch(this.db);

        newOrder.forEach((template, index) => {
            const templateRef = doc(this.db, 'actionTemplates', template.id);
            batch.update(templateRef, { order: index });
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error updating template order:", error);
            throw error;
        }
    }
}

export const actionTemplateService = new ActionTemplateService()
