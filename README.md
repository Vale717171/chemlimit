# ChemLimit

ChemLimit è una Chrome Extension Manifest V3 per chimici, consulenti sicurezza e igienisti industriali italiani. Permette di cercare rapidamente una sostanza chimica da CAS, nome o sinonimo e mostra dati seed relativi al D.Lgs. 81/08, con link tecnici esterni verso fonti autorevoli.

## Stato del progetto

Questa è una MVP iniziale. Il database locale contiene poche sostanze dimostrative e i dati normativi sono marcati come da verificare o completare prima di qualsiasi uso professionale.

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
- Link esterni verso ACGIH, ECHA, GESTIS, PubChem ed eChemPortal.
- Stato nessun risultato con link di ricerca generici per fonti esterne non ACGIH.

## Limiti

- I dati normativi dell'Allegato XXXVIII sono seed iniziali da verificare e completare.
- Le indicazioni su Allegato XLIII sono seed iniziali da verificare nella versione normativa applicabile.
- I sinonimi devono essere validati.
- ACGIH non viene copiato nel database e non viene interrogato tramite scraping.
- I link esterni rimandano alle fonti ufficiali o ai relativi motori di ricerca.

## Privacy

L'estensione funziona localmente, non invia ricerche a server propri, non richiede account, non traccia l'utente e non usa analytics. L'apertura dei siti esterni è soggetta alle privacy policy dei rispettivi siti.

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

## Roadmap

- Completamento Allegato XXXVIII.
- Completamento Allegato XLIII.
- Validazione sinonimi.
- Pacchetto e pubblicazione su Chrome Web Store.
- Supporto Firefox.
- Valutazione Safari.
