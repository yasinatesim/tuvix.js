import { lib } from './lib';
import { loadLib, loadOther } from './adapter';
import './page.css';

export const pageClass = 'merged-page';
export const page = () => lib() + 1;
export { loadLib, loadOther };
