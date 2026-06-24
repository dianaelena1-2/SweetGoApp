# SweetGo 🍰 - Platformă pentru gestiunea comenzilor si livrarilor din cofetarii

SweetGo este o aplicație web de tip Single Page Application (SPA) concepută cu un dublu scop: eficientizarea procesului de comandă a produselor de cofetărie și reducerea activă a risipei alimentare. Platforma conectează direct clienții dornici de deserturi cu laboratoarele locale, oferind un mecanism inteligent de achiziție a produselor cu un termen de valabilitate redus, în special prin intermediul „ofertelor de seară”.

---

## 🚀 Contextul 

În industria alimentară, în special în sectorul produselor proaspete de patiserie și cofetărie, pierderile zilnice reprezintă o provocare majoră din punct de vedere financiar și ecologic. Multe produse ajung să fie aruncate la sfârșitul zilei, deși sunt perfect sigure pentru consum.

**SweetGo** intervine in acest sens:
1. **Pentru Cofetării:** Transformă potențialele pierderi în venituri adiacente și oferă o vizibilitate crescută în comunitatea locală.
2. **Pentru Clienți:** Facilitează accesul la produse artizanale și deserturi la prețuri reduse (oferte anti-risipă).
3. **Pentru Mediu:** Reduce amprenta de carbon asociată risipei de hrană prin monitorizarea și salvarea deserturilor.

---

## 🌟 Caracteristici principale

Aplicația este structurată pe trei roluri de utilizatori, fiecare beneficiind de o interfață personalizată:

### 1. Modulul Client (Cumpărător)
* **Autentificare și Înregistrare Rapidă:** Formular minimalist bazat pe tab-uri fluide pentru o conversie rapidă.
* **Explorare și Geolocalizare:** Posibilitatea de a detecta automat locația curentă a utilizatorului prin API-ul de geolocalizare din browser și conversia coordonatelor GPS în adresă textuală.
* **Sistem de Comenzi:** Vizualizarea cofetăriilor din proximitate, adăugarea produselor în coș și plasarea comenzilor în timp real.

### 2. Modulul Cofetărie (Parteneri)
* **Onboarding Dinamic:** Formular avansat de înregistrare care solicită detalii comerciale (adresă, telefon) și încărcarea documentelor justificative obligatorii (Certificat de Înregistrare, Certificat Sanitar).
* **Gestiunea Produselor:** Panou dedicat pentru adăugarea, editarea și activarea ofertelor promoționale (cu accent pe ofertele anti-risipă de seară).
* **Panou de Statistici Avansate (`StatisticiCofetarie`):**
  * **Evoluția Vânzărilor:** Grafic cu bare interactiv realizat pentru analiza performanței zilnice.
  * **Funcționalitate Drill-down:** Utilizatorul poate apăsa pe o anumită zi din grafic pentru a încărca asincron și a randa instantaneu distribuția vânzărilor pe ore pentru ziua respectivă.
  * **Distribuția pe Categorii:** Grafic de tip gogoașă (*PieChart*) cu legendă personalizată pentru vizualizarea ponderii produselor vândute.
  * **Efectul Anti-Risipă:** Contor în timp real al numărului de deserturi salvate și evidențierea automată a intervalului orar de vârf.

### 3. Panoul de Administrare (`StatisticiAdmin`)
* **Monitorizarea Platformei:** Tablou de control centralizat pentru urmărirea activității globale a aplicației SweetGo.
* **Grafice Interactive de Performanță:**
  * *Evoluția Aplicației:* Grafic de tip *AreaChart* care compară rata de înregistrare a clienților noi versus cofetăriilor partenere în ultimele 30 de zile.
  * *Rata de Succes a Comenzilor:* Grafic de tip *BarChart* stivuit (*stacked*) pentru analiza raportului dintre comenzile finalizate cu succes și cele anulate.
  * *Top Parteneri:* Grafic orientat pe orizontală care clasifică cofetăriile în funcție de încasările totale.
* **Componente Custom Tooltip:** Toate graficele integrează elemente de tip pop-over personalizate, stilizate avansat pentru a afișa date financiare precise, număr exact de comenzi și detalii la survolarea cursorului (*hover*).
* **Validare Parteneri:** Sistem de verificare și aprobare a conturilor de cofetării pe baza documentelor încărcate la înregistrare.

---

## 🛠️ Tehnologii

### Frontend
* **React.js (v18+):** Bibliotecă principală bazată pe componente pentru construirea interfeței de utilizator.
* **React Router DOM:** Gestionarea navigării de tip SPA și a rutelor protejate (client, cofetărie, admin).
* **React Context API:** Gestionarea stării globale pentru autentificarea utilizatorilor și persistența sesiunii (`AuthContext`).
* **Recharts:** Bibliotecă de grafice, optimizată pentru randare fluidă și interactivitate în React.
* **Lucide React:** Set de pictograme vectoriale moderne și minimaliste pentru interfață.
* **Axios:** Client HTTP utilizat pentru comunicarea asincronă cu serverul backend.

### Backend & Bază de date 
* Arhitectură RESTful API bazată pe rute securizate.
* Logica de colectare a datelor și agregare pe intervale de timp (zile/ore, topuri, analize de business intelligence).

## 📝 Cum rulează proiectul 

Poate fi accesat la adresa https://sweet-go-app.vercel.app
