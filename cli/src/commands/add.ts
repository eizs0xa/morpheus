import { NotImplementedError } from '../util/errors.js';

export async function add(_moduleName: string): Promise<void> {
  throw new NotImplementedError('agentic add <module>', 'Future');
}
