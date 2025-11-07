

# 🧩 Guía de Convenciones de Ramas (Branch Naming Convention)

## 📘 Objetivo
Mantener una **estructura de ramas clara, jerárquica y consistente** que facilite la colaboración, las integraciones y las revisiones de código en equipo.

Este documento explica **cómo crear, nombrar y gestionar ramas** dentro del proyecto **OneDayOneTrip** siguiendo una estructura basada en las **User Stories (US)** y las **tasques (subtareas)**.

---

## 🌿 Estructura General de Ramas

```

production
staging
US-XX/
├── feature/<nombre-descriptivo>
└── fix/<nombre-descriptivo>

````

### Descripción:
- **main** → Rama principal (producción).
- **staging** → Rama de desarrollo general (integración de features).
- **US-XX/** → Rama que representa una *User Story* (por ejemplo, `US-06`).
  - **feature/** → Subrama para una nueva funcionalidad.
  - **fix/** → Subrama para corrección de errores dentro de esa US.

---

## 🏷️ Ejemplos de nombres válidos

| Tipo | Ejemplo | Descripción |
|------|----------|-------------|
| User Story | `US-06` | Rama principal para la User Story #6 |
| Feature | `US-06/feature/tasca1-pantalla-login` | Nueva funcionalidad dentro de la US-06 |
| Fix | `US-06/fix/correccio-validacio` | Corrección de validaciones en la US-06 |

---

## ⚙️ Creación de ramas

### 1️⃣ Crear una rama de User Story
Desde `staging`:
```bash
git checkout staging
git pull origin staging
git checkout -b US-06
git push -u origin US-06
````

---

### 2️⃣ Crear una rama de feature dentro de una US

```bash
git checkout US-06
git pull origin US-06
git checkout -b US-06/feature/tasca1-pantalla-login
git push -u origin US-06/feature/tasca1-pantalla-login
```

---

### 3️⃣ Crear una rama de fix

**Fix (bug en desarrollo):**

```bash
git checkout -b US-06/fix/correccio-validacio
git push -u origin US-06/fix/correccio-validacio
```

---

## 🔄 Flujo de trabajo recomendado (Git Flow Adaptado)

1. **Crear una rama** a partir de `staging` o de su `US-XX`.
2. **Desarrollar la funcionalidad o corrección.**
3. **Hacer commit frecuentemente** con mensajes claros y en formato convencional:

   ```
   feat: añadir validación al formulario de login
   fix: corregir error al subir imágenes
   ```
4. **Subir los cambios** y abrir un **Pull Request (PR)** hacia `staging` o `US-XX`.
5. **Mergear** solo después de revisión por otro miembro del equipo.

### Estás trabajando en tu rama feature

```bash
git checkout US-06/feature/tasca1-pantalla-login
git add .
git commit -m "feat: finalizada la pantalla de login"
git push
```


### Ahora fusionas tu trabajo con la rama de la historia principal
```bash
git checkout US-06
git pull origin US-06
git merge US-06/feature/tasca1-pantalla-login
```

### Subes la US-06 actualizada con los cambios fusionados
```bash
git push origin US-06
```



---

## 🚦 Reglas Generales

* ❌ No trabajar directamente en `production` o `staging`.
* 🧠 Usar nombres **en minúsculas**, separados por guiones (`-`).
* 🗂️ Agrupar siempre las ramas de *feature/fix* bajo su *User Story (US-XX)*.
* 🧩 Mantener los nombres **descriptivos y breves** (máx. 5–6 palabras).
* 🧹 Eliminar ramas locales y remotas que ya se hayan fusionado para mantener el repo limpio.

---

## 🧠 Ejemplo Visual del Árbol de Ramas

```
production
│
├── staging
   ├── US-03
   │   ├── US-03/feature/tasca1-login
   │   ├── US-03/feature/tasca2-register
   │   └── US-03/fix/correccio-login
   └── US-06
       ├── US-06/feature/tasca1-pantalla-login
       └── US-06/feature/tasca2-validacio-usuari
```

---

## 🤝 Buenas prácticas del equipo

* Antes de crear una nueva rama, **haz `git fetch --all`** para evitar duplicados.
* Asegúrate de que tu rama **esté actualizada** con la rama base antes de hacer *merge*.
* Si varios trabajan en la misma US, cada uno puede crear su propia subrama bajo la misma jerarquía (`US-06/feature/tascaX`).

