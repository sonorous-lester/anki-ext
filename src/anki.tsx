import { Form, LaunchProps, getPreferenceValues } from "@raycast/api"
import { appendFileSync, write, writeFile, writeFileSync, } from "fs";
import { join } from "path";
import fetch from "node-fetch";
import { Oxford } from "./oxford";
import { json } from "stream/consumers";

interface Query {
    word: string; 
}

interface Preferences {
    oxfordAppID: string;
    oxfordAppKey: string;
    ankiFile: string;
    ankiMedia: string;
}

interface Card {
    text: string;
    partOfSpeech: string;
    ipa: string;
    sound: string;
    soundAddr: string;
    soundName: string;
    definition: string;
    example: string;
}

export default async function Command(props: LaunchProps<{ arguments: Query }>) {
    const argus = props.arguments;
    const prefers = getPreferenceValues<Preferences>();

    const ox = await queryWordToOxford(prefers.oxfordAppID, prefers.oxfordAppKey, argus.word)
    const cards = mappingToCards(ox)

    if (cards.length === 0) {
        writeToFile(prefers.ankiFile, 'FailureAddedWords.txt', argus.word)
        return
    }

    cards.forEach(function (card: Card) {
        downloadAudio(card.soundAddr, prefers.ankiMedia, card.soundName)
        writeToFile(prefers.ankiFile, generateTodayDateFileName(), ankiString(card))
    })

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
    await sleep(2000)
    console.log(`Create a new word: ${argus.word} info into file.`)
}

function writeToFile(filePath: string, fileName: string, text: string) {
    const fullPath = join(filePath, fileName);
    appendFileSync(fullPath, text + '\n');
}

function generateTodayDateFileName(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fileName = `${year}-${month}-${day}.txt`;
    return fileName 
}

async function queryWordToOxford(id: string, key: string, word: string): Promise<Oxford> {
    const params = new URLSearchParams();
    params.append('q', word);
    params.append('fields', 'definitions,examples,pronunciations')
    const resp = await fetch('https://od-api.oxforddictionaries.com/api/v2/words/en-gb' + '?' + params, {
        method: 'get',
        headers: {
            'Accept': 'application/json',
            'app_id': id,
            'app_key': key
        },
    })

    const data = await resp.text();
    const oxford: Oxford = JSON.parse(data)
    return oxford
}

function mappingToCards(ox: Oxford): Array<Card> {
    const out: Card[] = [];
    if (!ox.results[0].lexicalEntries) {
        return out;
    }

    for (const v of ox.results[0].lexicalEntries) {
        if (v.entries == undefined) {
            return out;
        }
        if (!v.entries[0]) {
            continue;
        }
        const entry = v.entries[0];

        let ipa = 'N/A';
        let soundAddr = '';
        if (entry.pronunciations.length) {
        const pronuc = entry.pronunciations[0];
        ipa = pronuc.phoneticSpelling;
        soundAddr = pronuc.audioFile;
        }

        let definition = 'N/A';
        let example = 'N/A';

        if (entry.senses.length) {
        const sense = entry.senses[0];

        if (sense.definitions.length) {
            definition = sense.definitions[0];
        }

        if (sense.examples !== undefined && sense.examples.length != 0) {
            example = sense.examples[0].text;
        }
        }

        const c: Card = {
        text: v.text,
        partOfSpeech: v.lexicalCategory.id,
        ipa: ipa,
        sound: `[sound:${v.text}_${v.lexicalCategory.id}.mp3]`,
        soundName: `${v.text}_${v.lexicalCategory.id}`,
        soundAddr: soundAddr,
        definition: definition,
        example: example,
        };
        out.push(c);
  }
  return out;
}

 async function downloadAudio(u: string, filePath: string, fileName: string) {
    const resp = await fetch(u);
    const audio = await resp.arrayBuffer();
    const fullPath = join(filePath, fileName) + '.mp3';
    writeFileSync(fullPath, Buffer.from(audio))
}

function ankiString(card: Card): string {
    return `${card.definition};${card.text};${card.partOfSpeech};${card.ipa};${card.sound};${card.example}`
}