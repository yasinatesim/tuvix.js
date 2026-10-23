import { baseClass, registerIsland } from '../../shared/base';
import styles from './card.module.css';
import './card-plain.css';

export function render(): string {
  return `<article class="${baseClass} ${styles.card}"><h2 class="${styles.title}">Card</h2></article>`;
}

export function loadDetails() {
  return import('./details');
}

registerIsland('card', { render, loadDetails });
