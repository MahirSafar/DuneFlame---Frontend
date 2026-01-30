// Types for FlavourNote multi-language support
export interface FlavourNoteTranslation {
  flavourNoteId: string;
  languageCode: string;
  name: string;
}

export interface FlavourNoteDto {
  id: string;
  name: string;
  displayOrder: number;
  translations: FlavourNoteTranslation[];
}

// Update ProductResponse to use FlavourNoteDto[]
// (This is a partial type, to be merged with the main ProductResponse)
export type ProductFlavourNotes = {
  flavourNotes?: FlavourNoteDto[];
};
