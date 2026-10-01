import * as service from '../../services/consultantService.js';
import { isValidWhatsAppNumber } from '../../services/whatsappService.js';
export interface Contact {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  specialty: string | null;
  notes: string | null;
  active: boolean;
  deleted_at: string | null;
}
export interface Fields {
  name: string;
  company: string;
  phone: string;
  whatsapp: string;
  email: string;
  specialty: string;
  notes: string;
}
export const list = async (archived: boolean) =>
  (await service.listConsultants({ archived })) as unknown as Contact[];
export const get = async (id: string) =>
  (await service.getConsultantById(id)) as unknown as Contact | null;
export function validate(f: Fields) {
  if (f.name.trim().length < 2 || f.name.trim().length > 120)
    return 'Informe um nome entre 2 e 120 caracteres.';
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
    return 'Informe um e-mail válido.';
  if (f.whatsapp && !isValidWhatsAppNumber(f.whatsapp))
    return 'Informe um WhatsApp válido com DDD.';
  if (f.notes.length > 1800) return 'Use até 1800 caracteres nas observações.';
  return '';
}
export async function save(id: string | undefined, f: Fields) {
  const error = validate(f);
  if (error) throw Error(error);
  if (id) {
    const c = await get(id);
    if (!c || c.deleted_at) throw Error('Reative o contato antes de editar.');
  }
  const row = id ? await service.updateConsultant(id, f) : await service.createConsultant(f);
  if (!row?.id) throw Error('Não foi possível confirmar o contato salvo.');
  return String(row.id);
}
export async function change(c: Contact, action: 'archive' | 'restore' | 'active') {
  const row =
    action === 'archive'
      ? await service.archiveConsultant(c.id)
      : action === 'restore'
        ? await service.restoreConsultant(c.id)
        : await service.setConsultantActive(c.id, !c.active);
  if (row?.id !== c.id) throw Error('Não foi possível confirmar a alteração.');
  return row as Contact;
}
