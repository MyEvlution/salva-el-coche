import type { DefinicionNivel } from '../motor/tipos';
import { NIVEL_01 } from './nivel-01';
import { NIVEL_02 } from './nivel-02';

/**
 * Registro de niveles, en orden de juego.
 * Anadir un nivel = crear su archivo de datos y meterlo en esta lista.
 */
export const NIVELES: readonly DefinicionNivel[] = [NIVEL_01, NIVEL_02];

export function nivelPorId(id: string): DefinicionNivel | undefined {
  return NIVELES.find((n) => n.id === id);
}

export const PRIMER_NIVEL: DefinicionNivel = NIVELES[0] as DefinicionNivel;
