# ChemLimit Dataset Quality Report

Data report: 2026-05-01

## Riepilogo numerico

- Allegato XXXVIII importato: 146 record
- Allegato XLIII importato: 41 record
- Allegato XLIII-bis importato: 1 record
- Record aggregati in `src/data/substances.json`: 188
- CAS duplicati tra XXXVIII e XLIII unificati: 0
- Record con CAS mancante: 19
- Record con CAS formalmente non valido: 0
- Record con `verified: false`: 188

Comandi eseguiti:

```bash
node scripts/validate-dataset.js
node scripts/build-substances-index.js
node scripts/check-dataset-staleness.js
```

Esito:

- validazione dataset: `passed`
- build indice aggregato: `passed`
- staleness metadata: `passed` (`last_checked` = 2026-05-01)

## Record con CAS mancante

Tutti i 19 casi rilevati sono record senza CAS, non record con CAS formalmente errato. In quasi tutti i casi l’assenza sembra coerente con la natura normativa del record: gruppi di composti, frazioni, miscele o emissioni di processo.

| Allegato | Nome agente/sostanza | N. CE | Valori limite | Note / misure transitorie | Motivo probabile assenza CAS |
| --- | --- | --- | --- | --- | --- |
| XXXVIII | Argento (composti solubili come Ag) | 231-131-3 | 8h: 0,01 mg/m³ | - | Classe generica di composti espressi come Ag; nessun CAS univoco |
| XXXVIII | Bario (composti solubili come Ba) | - | 8h: 0,5 mg/m³ | - | Classe generica di composti solubili |
| XXXVIII | Cromo metallico, composti di cromo inorganico (II) e composti di cromo inorganico (III) (non solubili) | - | 8h: 0,5 mg/m³ | - | Gruppo di metallo/composti, non sostanza singola |
| XXXVIII | Fluoruri inorganici (espressi come F) | - | 8h: 2,5 mg/m³ | - | Gruppo di fluoruri espressi come F |
| XXXVIII | Manganese e composti inorganici del manganese (espresso come manganese) | - | 8h: 0,2 mg/m³ | Frazione inalabile; frazione respirabile | Gruppo di composti espressi come manganese |
| XXXVIII | Stagno (composti inorganici come Sn) | - | 8h: 2 mg/m³ | - | Gruppo di composti espressi come Sn |
| XLIII | Polveri di legno duro | - | 8h: 2 mg/m³ | Nota frazione inalabile | Agente materiale/processo, non sostanza singola |
| XLIII | Composti di cromo VI definiti cancerogeni ai sensi dell’articolo 2, lettera a), punto i) della direttiva 2004/37 (come cromo) | - | 8h: 0,005 mg/m³ | TM: 0,010 mg/m³ fino al 17 gennaio 2025; 0,025 mg/m³ per saldatura/taglio plasma fino al 17 gennaio 2025 | Categoria normativa basata su pericolo, non CAS singolo |
| XLIII | Fibre ceramiche refrattarie definite cancerogene ai sensi dell’articolo 2, lettera a), punto i) della direttiva 2004/37 | - | 8h: 0,3 f/ml | - | Famiglia di fibre, non sostanza singola con CAS univoco |
| XLIII | Polvere di silice cristallina respirabile | - | 8h: 0,1 mg/m³ | Frazione respirabile | Frazione/agente di processo, non CAS unico |
| XLIII | Cadmio e suoi composti inorganici | - | 8h: 0,001 mg/m³ | Frazione inalabile; TM: 0,004 mg/m³ fino all’11 luglio 2027 | Gruppo di composti inorganici |
| XLIII | Berillio e composti inorganici del berillio | - | 8h: 0,0002 mg/m³ | Sensibilizzazione cutanea e delle vie respiratorie; TM: 0,0006 mg/m³ fino all’11 luglio 2026 | Gruppo di composti inorganici |
| XLIII | Acido arsenico e i suoi sali e composti inorganici dell’arsenico | - | 8h: 0,01 mg/m³ | Frazione inalabile | Gruppo normativo che include più specie chimiche |
| XLIII | Emissioni di gas di scarico dei motori diesel | - | 8h: 0,05 mg/m³ | Misurate come carbonio elementare; TM: applicazione dal 21 febbraio 2026 per miniere sotterranee e gallerie | Emissione di processo / miscela complessa |
| XLIII | Miscele di idrocarburi policiclici aromatici, in particolare quelle contenenti benzo(a)pirene, definite cancerogene ai sensi della direttiva 2004/37 | - | Non indicato | Notazione `Cute` | Miscela complessa / categoria normativa |
| XLIII | Oli minerali precedentemente usati nei motori a combustione interna per lubrificare e raffreddare le parti mobili all’interno del motore | - | Non indicato | Notazione `Cute` | Miscela complessa / categoria d’uso |
| XLIII | Composti del Nichel | - | 8h: 0,01 mg/m³ | Frazione respirabile; frazione inalabile; sensibilizzazione cutanea e respiratoria; TM fino al 18 gennaio 2025 | Gruppo di composti con doppio limite respirabile/inalabile |
| XLIII | Piombo inorganico e i suoi composti | - | 8h: 0,15 mg/m³ | - | Gruppo di composti inorganici del piombo |
| XLIII | Mercurio e composti inorganici bivalenti del mercurio compresi ossido mercurico e cloruro di mercurio (misurati come mercurio) | - | 8h: 0,02 mg/m³ | Frazione respirabile; notazione `Cute` | Gruppo di composti misurati come mercurio |

## Verifica unificazione tra allegati

Verifica effettuata su `dlgs81_allegato_xxxviii.json`, `dlgs81_allegato_xliii.json` e sull’aggregato `substances.json`.

Esito sintetico:

- Non esistono CAS condivisi tra Allegato XXXVIII e Allegato XLIII nell’import corrente.
- Di conseguenza, non risultano casi in cui l’aggregatore abbia mancato una fusione per identico CAS tra i due allegati.

Controlli richiesti:

| Sostanza / gruppo | Presenza in XXXVIII | Presenza in XLIII | Esito |
| --- | --- | --- | --- |
| Benzene (`71-43-2`) | No | Sì | Nessuna fusione attesa; presente solo in XLIII |
| Formaldeide (`50-00-0`) | No | Sì | Nessuna fusione attesa; presente solo in XLIII |
| Tricloroetilene (`79-01-6`) | No | Sì | Nessuna fusione attesa; presente solo in XLIII |
| Cloruro di vinile monomero (`75-01-4`) | No | Sì | Nessuna fusione attesa; presente solo in XLIII |
| Acrilammide (`79-06-1`) | No | Sì | Nessuna fusione attesa; presente solo in XLIII |
| Ossido di etilene (`75-21-8`) | No | Sì | Nessuna fusione attesa; presente solo in XLIII |
| Composti di cromo VI | No voce equivalente | Sì, come gruppo normativo senza CAS | Nessuna fusione attesa; gruppo specifico del Capo II |
| Composti del Nichel | No voce equivalente | Sì, come gruppo normativo senza CAS | Nessuna fusione attesa; gruppo specifico del Capo II |

Osservazione aggiuntiva:

- `Piombo inorganico e i suoi composti` (XLIII) e `Piombo e suoi composti ionici` (XLIII-bis) restano due record distinti nell’aggregato. La separazione è coerente con i nomi sorgente e con la differenza di schema (`limit_8h` vs `biological_limit_value`), ma merita una futura strategia di collegamento logico tra esposizione aerodispersa e valore biologico.

## Verifica mapping campi

Controlli eseguiti:

- mapping di `limit_8h.mg_m3`
- mapping di `limit_8h.ppm`
- mapping di `limit_short_term.mg_m3`
- mapping di `limit_short_term.ppm`
- mapping di `fibers_ml`
- mapping di `notations`
- mapping di `notes`
- mapping di `transitional_measures`
- mapping di `biological_limit_value` per XLIII-bis

Esito:

- `XXXVIII`: mapping coerente per i record campione verificati (`Acetone`, `Toluene`, `Xilene`, `Acido fluoridrico`, `Acido nitrico`, `Piperazina`).
- `XLIII`: mapping coerente per i record campione verificati (`Benzene`, `Formaldeide`, `Tricloroetilene`, `Cloruro di vinile monomero`, `Acrilonitrile`, `Monossido di carbonio`).
- `fibers_ml`: visualizzabile correttamente per `Fibre ceramiche refrattarie...` (`0,3 f/ml`).
- `notations`: `Cute` e le notazioni di sensibilizzazione sono presenti e arrivano all’aggregato.
- `transitional_measures`: benzene, cromo VI, cadmio, berillio, diesel e nichel risultano trasportati nel file aggregato.
- `XLIII-bis`: `Piombo e suoi composti ionici` mantiene parametro biologico, valore, unità, matrice e note operative.

Correzione minima effettuata durante il QA:

- rimosse note automatiche errate che interpretavano i richiami di nota `(8)`, `(9)`, `(11)`, `(12)` come “più valori 8h” in alcuni record XLIII;
- mantenuta e chiarita la nota per `Composti del Nichel`, dove la fonte ufficiale riporta davvero due valori 8h distinti (respirabile e inalabile).

## Criticità potenziali

1. **Schema non sufficiente per alcuni record multi-limite**
   - `Composti del Nichel` ha due valori 8h distinti nella stessa riga (`0,01 mg/m³` respirabile e `0,05 mg/m³` inalabile).
   - Lo schema attuale conserva solo un valore numerico in `limit_8h.mg_m3`; il secondo resta nelle note.

2. **Record senza CAS ricercabili solo per nome**
   - Le 19 voci di gruppo/processo non sono intercettabili da ricerca CAS, per definizione.
   - L’esperienza utente resta accettabile solo se la ricerca per nome e sinonimo è curata bene.

3. **XLIII-bis separato dal record aerodisperso correlato**
   - `Piombo e suoi composti ionici` e `Piombo inorganico e i suoi composti` non sono collegati tra loro nell’aggregato.
   - Non è un errore, ma una lacuna di modellazione futura.

4. **Artefatti minori di normalizzazione testuale**
   - Restano alcune stringhe con spaziatura non perfetta o compattazione da PDF (`gas di` / `composti di`, ecc.).
   - Non bloccano il funzionamento, ma vanno ripulite prima di definire il dataset come “editorialmente rifinito”.

5. **Conteggio XXXVIII da riconfermare con check manuale di pubblicazione**
   - L’import corrente contiene 146 righe in XXXVIII.
   - Conviene fare un ricontrollo editoriale finale contro la tabella ufficiale per escludere un’omissione dovuta al parsing della Gazzetta.

## Verifica UI simulata sul file aggregato

La simulazione è stata effettuata leggendo `src/data/substances.json` e confrontandolo con la logica di rendering del side panel.

| Record campione | Nome visibile | CAS visibile | Allegato visibile | Valori visibili | Note / stato |
| --- | --- | --- | --- | --- | --- |
| Acetone | Sì | `67-64-1` | XXXVIII | `500 ppm / 1210 mg/m³` | `verified: false`, nessuna nota |
| Benzene | Sì | `71-43-2` | XLIII | `0,2 ppm / 0,66 mg/m³` | `Cute`, misura transitoria presente, `verified: false` |
| Tricloroetilene | Sì | `79-01-6` | XLIII | `10 ppm / 54,7 mg/m³`; STEL `30 ppm / 164,1 mg/m³` | `Cute`, `verified: false` |
| Fibre ceramiche refrattarie | Sì | assenza CAS mostrabile come `-` | XLIII | `0,3 f/ml` | `verified: false` |
| Composti del Nichel | Sì | assenza CAS mostrabile come `-` | XLIII | `0,01 mg/m³` | Note e TM visibili; limite inalabile secondario presente solo nelle note; `verified: false` |
| Piombo e suoi composti ionici | Sì | assenza CAS mostrabile come `-` | XLIII-bis | valore biologico `60 μg Pb/100 ml di sangue` | note operative presenti, `verified: false` |

Esito UI simulata:

- il side panel può mostrare correttamente nome, CAS o sua assenza, allegato, limiti, note e stato `verified`;
- i record con `f/ml` sono ora visualizzabili;
- i record XLIII-bis sono visualizzabili come blocco biologico dedicato;
- il caso `Composti del Nichel` rimane semanticamente compresso rispetto alla fonte ufficiale.

## Campione di righe da verificare manualmente sulla fonte ufficiale

- `Composti del Nichel`: doppio valore 8h respirabile/inalabile
- `Composti di cromo VI`: misura transitoria complessa
- `Cadmio e suoi composti inorganici`: limite attuale + transitorio con nota 13
- `Berillio e composti inorganici del berillio`: limite attuale + transitorio + sensibilizzazione
- `Benzene`: misura transitoria 2024-2026
- `Formaldeide`: valori 8h/STEL + notazione sensibilizzazione cutanea
- `Emissioni di gas di scarico dei motori diesel`: unità come carbonio elementare e decorrenza differita
- `Piombo e suoi composti ionici` (XLIII-bis): valore biologico e soglie di sorveglianza sanitaria
- `Polveri di legno duro`: natura del limite come frazione inalabile
- `Fibre ceramiche refrattarie`: conferma del mapping in `f/ml`

## Raccomandazioni prima della pubblicazione

1. Ripulire editorialmente i testi estratti dal PDF per rimuovere gli ultimi artefatti di spaziatura.
2. Introdurre uno schema dati più ricco per i record con limiti multipli nella stessa colonna, a partire da `Composti del Nichel`.
3. Valutare un collegamento esplicito tra record XLIII e XLIII-bis relativi al piombo.
4. Eseguire una revisione manuale riga-per-riga delle voci con misure transitorie e delle voci di gruppo senza CAS.
5. Mantenere `verified: false` finché non viene eseguito un controllo manuale puntuale sulla fonte ufficiale.
