import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ca from "./ca.json";
import es from "./es.json";
import en from "./en.json";

i18n
    .use(initReactI18next)
    .init({
        resources: {
            ca: { translation: ca },
            es: { translation: es },
            en: { translation: en }
        },
        fallbackLng: 'en',
        supportedLngs: ['ca', 'es', 'en'],
        detection: {
            order: ['navigator', 'htmlTag'],
            caches: []
        },
        interpolation: { escapeValue: false }
    });
const savedLang = localStorage.getItem("lang");
if (savedLang) {
    i18n.changeLanguage(savedLang);
}


export default i18n;
