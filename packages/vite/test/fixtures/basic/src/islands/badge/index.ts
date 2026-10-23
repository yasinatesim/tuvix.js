import { baseClass, registerIsland } from '../../shared/base';
import './badge.css';

export function render(): string {
  return `<span class="${baseClass} badge">Badge</span>`;
}

registerIsland('badge', { render });
