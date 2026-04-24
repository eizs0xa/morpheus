import { NotImplementedError } from '../util/errors.js';

export async function remove(_moduleName: string): Promise<void> {
  throw new NotImplementedError('agentic remove <module>', 'Future');
}
