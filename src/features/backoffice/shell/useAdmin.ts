import { useCatalogAdmin, type CatalogAdminActions } from '../useCatalogAdmin';
import { useNotify } from './NotifyContext';

/** Catalog actions of the backoffice, reporting through the shared messages. */
export function useAdmin(): CatalogAdminActions {
  return useCatalogAdmin(useNotify());
}
