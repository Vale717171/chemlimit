# ChemLimit

ChemLimit è una Chrome Extension Manifest V3 per chimici, consulenti sicurezza e igienisti industriali con impostazione Italy-first, internationally oriented. Permette di cercare rapidamente una sostanza chimica da CAS, nome o sinonimo e mostra dati seed relativi al D.Lgs. 81/08, con link esterni verso fonti chimiche e OEL internazionali autorevoli.

## Stato del progetto

Questa è una MVP iniziale. Il database locale contiene poche sostanze dimostrative e i dati normativi sono marcati come da verificare o completare prima di qualsiasi uso professionale.

Il primo dataset centrale di ChemLimit è il D.Lgs. 81/08. Le fonti internazionali, in questa fase, sono esposte come link esterni e non come database interno aggiuntivo.

`src/data/substances.json` è un indice aggregato generato automaticamente. I file sorgente del dataset Italia vivono in `src/data/italy/`.

ChemLimit non riproduce valori TLV ACGIH e non effettua scraping di ACGIH. Per ACGIH l'estensione mostra solo un link specifico se presente nel database locale come verificato; in caso contrario mostra "Link ACGIH non ancora verificato".

## Installazione in Chrome

1. Aprire `chrome://extensions`.
2. Attivare `Modalità sviluppatore`.
3. Selezionare `Carica estensione non pacchettizzata`.
4. Scegliere la cartella locale `chemlimit`.

## Funzioni MVP

- Menu contestuale `Cerca con ChemLimit` su testo selezionato.
- Side panel con ricerca manuale e risultati locali.
- Popup con campo di ricerca e apertura del side panel.
- Ricerca esatta per CAS normalizzato.
- Ricerca case-insensitive per nome italiano, nome inglese e sinonimi.
- Sezione Italy - D.Lgs. 81/08 come primo blocco normativo.
- Sezione International sources con link esterni verso ACGIH, ECHA, GESTIS, PubChem ed eChemPortal.
- Stato nessun risultato con link di ricerca generici per fonti esterne non ACGIH.

## Limiti

- I dati normativi dell'Allegato XXXVIII sono seed iniziali da verificare e completare.
- Le indicazioni su Allegato XLIII sono seed iniziali da verificare nella versione normativa applicabile.
- I sinonimi devono essere validati.
- Le fonti internazionali sono per ora collegate tramite link esterni.
- ACGIH non viene copiato nel database e non viene interrogato tramite scraping.
- I link esterni rimandano alle fonti ufficiali o ai relativi motori di ricerca.

## Privacy

L'estensione funziona localmente, non invia ricerche a server propri, non richiede account, non traccia l'utente e non usa analytics. L'apertura dei siti esterni è soggetta alle privacy policy dei rispettivi siti.

## Support

If ChemLimit saves you time, you can buy me a coffee: [Buy Me a Coffee](https://buymeacoffee.com/Vale71)

## Test manuali

1. Aprire una pagina web e selezionare `67-64-1`.
2. Fare tasto destro.
3. Cliccare `Cerca con ChemLimit`.
4. Verificare che si apra il side panel.
5. Verificare che compaia la scheda Acetone.
6. Cliccare ACGIH, ECHA, GESTIS, PubChem ed eChemPortal e verificare l'apertura di nuove schede dove disponibili.
7. Cercare una sostanza dal popup e verificare l'apertura del side panel.
8. Cercare una sostanza direttamente dal side panel.
9. Cercare un testo inesistente e verificare la gestione del nessun risultato con link esterni generici.

## Dataset pipeline

1. Aggiornare o integrare i file `src/data/italy/*.json`.
2. Eseguire `node scripts/validate-dataset.js`.
3. Eseguire `node scripts/build-substances-index.js`.
4. Eseguire `node scripts/check-dataset-staleness.js`.
5. Ricaricare l'estensione in Chrome.
6. Testare ricerca CAS, nome e sinonimi.
7. Fare commit.

## Data reliability

- ChemLimit è uno strumento di consultazione rapida.
- I dati devono essere verificati sulle fonti normative applicabili prima dell'uso professionale.
- I link internazionali rimandano a fonti esterne.
- ACGIH non viene copiato né interrogato tramite scraping.

## Roadmap

- Completamento Allegato XXXVIII.
- Completamento Allegato XLIII.
- Validazione sinonimi.
- EU OEL sources.
- German AGW/MAK references.
- UK WEL references.
- OSHA/NIOSH links.
- UI bilingue italiano/inglese.
- Pacchetto e pubblicazione su Chrome Web Store.
- Supporto Firefox.
- Valutazione Safari.
