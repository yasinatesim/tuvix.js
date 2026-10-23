import { baseClass, registerIsland } from '../../shared/base';
import './details.css';

export const detailsClass = `${baseClass} card-details`;

export function loadDeeper() {
  return import('./deeper');
}

registerIsland('card-details', { detailsClass, loadDeeper });
