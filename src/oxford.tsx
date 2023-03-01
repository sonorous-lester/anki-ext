export interface Oxford {
    metadata: Metadata;
    query:    string;
    results:  Result[];
}

export interface Metadata {
    operation: string;
    provider:  string;
    schema:    string;
}

export interface Result {
    id:             string;
    language:       string;
    lexicalEntries: LexicalEntry[];
    type:           string;
    word:           string;
}

export interface LexicalEntry {
    entries:         Entry[];
    language:        string;
    lexicalCategory: LexicalCategory;
    text:            string;
}

export interface Entry {
    pronunciations: Pronunciation[];
    senses:         Sense[];
}

export interface Pronunciation {
    audioFile:        string;
    dialects:         string[];
    phoneticNotation: string;
    phoneticSpelling: string;
}

export interface Sense {
    definitions: string[];
    examples?:    Example[];
    id:          string;
    subsenses?:  Sense[];
}

export interface Example {
    text: string;
}

export interface LexicalCategory {
    id:   string;
    text: string;
}