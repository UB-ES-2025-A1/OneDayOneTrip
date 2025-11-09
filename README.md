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

 Link para ver plataforma de hosteo del backend API: https://dashboard.render.com/web/srv-d3v213uuk2gs73e878s0/deploys/dep-d3v4ke6uk2gs73eab0lg


## Hosteo

Por el momento ya se realiza el hosteo de nuestra api que se aprovecha de que nuestras bases de datos son accesibles desde internet.
Lo realizamos mediante render, donde la tenemos levantada, solo hace falta cambiar en el client.ts la url para que apunte a la api levantada.
Cambiando esta url pasamos a un entorno local poniendo el link (http://127.0.0.1:8000).

Link donde esta hosteado la api -> (https://onedayonetrip-api.onrender.com)


Link para ver la plataforma de hosteo del frontend: https://app.netlify.com/projects/onedayonetrip/configuration/deploys#continuous-deployment

## Estructura del proyecto


comando para actualizarla:   tree -a -I "node_modules|.git|dist|venv|__pycache__" > estructura.txt

```
.
├── api
│   ├── app
│   │   ├── auth
│   │   │   └── verify_token.py
│   │   ├── main.py
│   │   ├── models
│   │   │   ├── rating_model.py
│   │   │   └── trip_model.py
│   │   ├── routers
│   │   │   ├── __pycache__
│   │   │   │   └── trips.cpython-310.pyc
│   │   │   ├── ratings.py
│   │   │   ├── trips.py
│   │   │   └── users.py
│   │   └── services
│   │       ├── firebase_service.py
│   │       ├── mongo_service.py
│   │       └── __pycache__
│   │           └── mongo_service.cpython-310.pyc
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
│   │   │   ├── ema.png
│   │   │   ├── lockk.png
│   │   │   ├── logo_OneDayOneTrip.png
│   │   │   ├── londres.png
│   │   │   ├── madrid.jpg
│   │   │   ├── pantalla_principal1.png
│   │   │   ├── paris.png
│   │   │   └── person.png
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
├── README_Branching.md
└── README.md

18 directories, 70 files

```










