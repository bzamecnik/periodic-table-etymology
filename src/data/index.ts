import raw from '../../data/elements.json'
import type { ChemicalElement, ElementDataset } from './element.ts'

const dataset = raw as unknown as ElementDataset

export const elements: ChemicalElement[] = dataset.elements
export const source = dataset.source
export type { ChemicalElement, DeeperClaim } from './element.ts'
