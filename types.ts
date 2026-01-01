
export enum ReviewStyle {
  EDUCATIONAL = 'educational',
  ENTHUSIASTIC = 'enthusiastic',
  RELAXING = 'relaxing',
  QUICK = 'quick'
}

export interface RawSceneInput {
  id: string;
  imageUrl: string;
  hint: string;
}

export interface PlantAnalysis {
  name: string;
  scientificName: string;
  description: string;
  careTips: string[];
  polishedScripts: string[]; // Polished version of user hints
}

export interface ReviewScene {
  imageUrl: string;
  scriptText: string;
  audioBuffer?: AudioBuffer;
}

export type AspectRatio = '1:1' | '9:16';
