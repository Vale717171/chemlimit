# ChemLimit

ChemLimit è una Chrome Extension Manifest V3 per chimici, consulenti sicurezza e igienisti industriali con impostazione Italy-first, internationally oriented. Permette di cercare rapidamente una sostanza chimica da CAS, nome o sinonimo e mostra dati seed relativi al D.Lgs. 81/08, con link esterni verso fonti chimiche e OEL internazionali autorevoli.

## Stato del progetto

Questa è una MVP iniziale. Il database locale contiene poche sostanze dimostrative e i dati normativi sono marcati come da verificare o completare prima di qualsiasi uso professionale.

Il primo dataset centrale di ChemLimit è il D.Lgs. 81/08. Le fonti internazionali, in questa fase, sono esposte come link esterni e non come database interno aggiuntivo.

`src/data/substances.json` è un indice aggregato generato automaticamente. I file sorgente del dataset Italia vivono in `src/data/italy/`.

ChemLimit non riproduce valori TLV ACGIH e non effettua scraping di ACGIH. Per ACGIH l'estensione non archivia un database locale del Data Hub: apre la fonte ufficiale e aiuta l'utente a trovare il link della sostanza direttamente nella pagina ACGIH.

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
- Sezione International sources con `ECHA`, `PubChem` e `ACGIH Data Hub`.
- Stato nessun risultato con link di ricerca generici per fonti esterne non ACGIH.

## Limiti

- I dati normativi dell'Allegato XXXVIII sono seed iniziali da verificare e completare.
- Le indicazioni su Allegato XLIII sono seed iniziali da verificare nella versione normativa applicabile.
- I sinonimi devono essere validati.
- Le fonti internazionali sono per ora collegate tramite link esterni.
- ACGIH non viene copiato nel database e non viene interrogato tramite scraping.
- I link esterni rimandano alle fonti ufficiali o ai relativi motori di ricerca.


## External source links

- La MVP pubblica mostra i dati del D.Lgs. 81/08 insieme a `ECHA`, `PubChem` e `ACGIH Data Hub`.
- `ACGIH Data Hub` apre sempre la fonte ufficiale e prova a guidare localmente l'utente verso il link corretto nella pagina ACGIH.
- `Apri scheda ACGIH` compare solo quando esiste un link verificato nel database locale.
- ECHA direct links are used only when manually verified.
- Otherwise ChemLimit opens the official ECHA search page.
- ACGIH is not scraped and TLV values are not copied.
- ChemLimit does not archive the ACGIH Data Hub locally.
- The ACGIH result must always be verified on the official ACGIH page.
- GESTIS ed eChemPortal restano in roadmap per una fase successiva.

## Privacy

L'estensione funziona localmente, non invia ricerche a server propri, non richiede account, non traccia l'utente e non usa analytics. L'apertura dei siti esterni è soggetta alle privacy policy dei rispettivi siti.

## Support

If ChemLimit saves you time, you can buy me a coffee: [Buy Me a Coffee](https://buymeacoffee.com/Vale71)

## Test manuali

1. Aprire una pagina web e selezionare `67-64-1`, fare tasto destro e cliccare `Cerca con ChemLimit`; verificare apertura del side panel e scheda `Acetone`.
2. Cercare `acetone` e verificare apertura corretta dei link `ECHA`, `PubChem` e `Cerca su ACGIH Data Hub`.
3. Cercare `benzene` e verificare che i link esterni usino il CAS o il nome sostanza in modo coerente.
4. Cercare `tricloroetilene` e verificare che la scheda mostri i dati `Allegato XLIII` e che i link esterni si aprano correttamente.
5. Cercare `nichel` e verificare che per una sostanza senza CAS restino disponibili i pulsanti `ECHA` e `PubChem` senza errori UI.
6. Cercare una sostanza con nome presente ma CAS assente nel dataset e verificare che i pulsanti disponibili restino attivi senza mostrare link rotti.
7. Cercare una sostanza inesistente e verificare la gestione del nessun risultato con link di ricerca generici.
8. Cercare `110-54-3` oppure `Hexane`, aprire `ACGIH Data Hub` e verificare che ChemLimit evidenzi `n-Hexane`.
9. Cercare `67-64-1`, aprire `ACGIH Data Hub` e verificare che ChemLimit evidenzi `Acetone`.
10. Cercare `71-43-2`, aprire `ACGIH Data Hub` e verificare che ChemLimit evidenzi `Benzene`.
11. Cercare una sostanza non presente e verificare il messaggio `nessuna corrispondenza automatica trovata`, con suggerimento a usare `Ctrl+F/Cmd+F`.

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
- La funzione ACGIH guida la ricerca del link ufficiale nella pagina pubblica del Data Hub, senza archiviare localmente il catalogo ACGIH.

## Roadmap

- Completamento Allegato XXXVIII.
- Completamento Allegato XLIII.
- Validazione sinonimi.
- EU OEL sources.
- German AGW/MAK references.
- UK WEL references.
- OSHA/NIOSH links.
- GESTIS.
- eChemPortal.
- UI bilingue italiano/inglese.
- Pacchetto e pubblicazione su Chrome Web Store.
- Supporto Firefox.
- Valutazione Safari.
