import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import szh from "../locales/szh.json";
import en from "../locales/en.json";

// 导入组件级别语言文件
import schemasPageEn from "../resource/scenario/schemas/locales/en.json";
import schemasPageSzh from "../resource/scenario/schemas/locales/szh.json";
import schemaPageEn from "../resource/scenario/schema/locales/en.json";
import schemaPageSzh from "../resource/scenario/schema/locales/szh.json";
import resourceSceneEn from "../components/resourceScene/locales/en.json";
import resourceSceneSzh from "../components/resourceScene/locales/szh.json";
import patchesPageEn from "../resource/scenario/patches/locales/en.json";
import patchesPageSzh from "../resource/scenario/patches/locales/szh.json";

// 使用命名空间组织翻译资源
const resources = {
  en: {
    translation: en.translation,
    // 组件级命名空间
    schemasPage: schemasPageEn,
    schemaPage: schemaPageEn,
    resourceScene: resourceSceneEn,
    patchesPage: patchesPageEn
  },
  szh: {
    translation: szh.translation,
    // 组件级命名空间
    schemasPage: schemasPageSzh,
    schemaPage: schemaPageSzh,
    resourceScene: resourceSceneSzh,
    patchesPage: patchesPageSzh
  },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "en", // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option
    fallbackLng:"en",
    
    // 允许加载多个命名空间
    ns: ["translation", "schemasPage", "schemaPage", "resourceScene", "patchesPage"],
    defaultNS: "translation",

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

  export default i18n;