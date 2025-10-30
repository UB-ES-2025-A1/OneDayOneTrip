# OneDayOneTrip

Proyecto fullstack OneDayOneTrip, actualmente el proyecto funciona mediante un frontend con vite y react, sin hostear de momento, por la parte del backend hemos diseñado una api con fastapi que conecta nuestras bases de datos con el frontend, de momento desde la api conectamos con unicamente la firestore database de firebase, que ya esta levantada. 


Aquí dejo las instrucciones para runear el código en local.

---

## Primeros pasos para hacer el setup del proyecto

### Frontend
```
 cd frontend

 npm install         # Instala dependencias

 npm run dev         # PAra levantar en local el frontend

 Se tiene que añadir el .env, perdirlo si no lo tienes para pruebas locales (Nunca subir al repo)

```


### Poner la API en funcionamiento

```
 cd api

 python3 -m venv venv 

 source venv/bin/activate

 pip install requirements.txt

 uvicorn app.main:app --reload

 http://127.0.0.1:8000 para ver la api en local y hacer pruebas, hacer /docs/ 

 Se tiene que añadir tambien un .env propio del backend, pedirlo para pruebas locales (Nunca subir al repo)

```


## Hosteo

Por el momento ya se realiza el hosteo de nuestra api que se aprovecha de que nuestras bases de datos son accesibles desde internet.
Lo realizamos mediante render, donde la tenemos levantada, solo hace falta cambiar en el client.ts la url para que apunte a la api levantada.
Cambiando esta url pasamos a un entorno local poniendo el link (http://127.0.0.1:8000).

## Estructura del proyecto

OneDayOneTrip
|
├── api
│   ├── app
│   │   ├── auth
│   │   │   └── verify_token.py
│   │   ├── main.py
│   │   ├── models
│   │   ├── routers
│   │   │   └── users.py
│   │   └── services
│   │       └── firebase_service.py
│   ├── .env
│   └── requirements.txt
├── estructura.txt
├── frontend
│   ├── .env
│   ├── eslint.config.js
│   ├── firebase.json
│   ├── .firebaserc
│   ├── firestore.indexes.json
│   ├── firestore.rules
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.cjs
│   ├── public
│   │   ├── images
│   │   │   ├── bcn.png
│   │   │   ├── logo_OneDayOneTrip.png
│   │   │   ├── londres.png
│   │   │   ├── madrid.jpg
│   │   │   ├── pantalla_principal1.png
│   │   │   └── paris.png
│   │   ├── index.html
│   │   └── vite.svg
│   ├── README.md
│   ├── src
│   │   ├── api
│   │   │   └── client.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── assets
│   │   │   └── react.svg
│   │   ├── components
│   │   │   ├── AnimatedText1.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── Carousel.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── ImageCarousel.tsx
│   │   │   ├── LoginModal.tsx
│   │   │   ├── MasonryGrid.tsx
│   │   │   └── RegisterModal.tsx
│   │   ├── firebase
│   │   │   ├── auth.ts
│   │   │   ├── config.ts
│   │   │   └── firestore.ts
│   │   ├── firebase.ts
│   │   ├── main.tsx
│   │   ├── pages
│   │   │   ├── Dashboard.tsx
│   │   │   └── Home.tsx
│   │   └── styles
│   │       ├── Carousel.css
│   │       ├── Home.css
│   │       ├── index.css
│   │       ├── LoginReg.css
│   │       ├── MasonryGrid.css
│   │       └── styles.css
│   ├── stylelint.config.cjs
│   ├── tailwind.config.cjs
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── .gitignore
└── README.md









