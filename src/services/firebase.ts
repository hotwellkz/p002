import { initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Валидация переменных окружения
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Проверка наличия всех обязательных переменных
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.toUpperCase()}`);

if (missingVars.length > 0) {
  console.error(
    "❌ Отсутствуют переменные окружения Firebase:",
    missingVars.join(", ")
  );
  console.error(
    "💡 Убедитесь, что файл .env существует и содержит все необходимые переменные."
  );
  console.error("💡 После изменения .env перезапустите dev сервер (npm run dev)");
}

const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey,
  authDomain: requiredEnvVars.authDomain,
  projectId: requiredEnvVars.projectId,
  storageBucket: requiredEnvVars.storageBucket,
  messagingSenderId: requiredEnvVars.messagingSenderId,
  appId: requiredEnvVars.appId
};

// Проверка валидности конфигурации перед инициализацией
const configErrors: string[] = [];

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "your-api-key-here") {
  configErrors.push("VITE_FIREBASE_API_KEY не настроен или имеет значение по умолчанию");
}
if (!firebaseConfig.authDomain || !firebaseConfig.authDomain.includes("firebaseapp.com")) {
  configErrors.push("VITE_FIREBASE_AUTH_DOMAIN должен быть в формате project-id.firebaseapp.com");
}
if (!firebaseConfig.projectId || firebaseConfig.projectId === "your-project-id") {
  configErrors.push("VITE_FIREBASE_PROJECT_ID не настроен или имеет значение по умолчанию");
}
if (!firebaseConfig.appId || firebaseConfig.appId === "1:123456789012:web:abcdef123456") {
  configErrors.push("VITE_FIREBASE_APP_ID не настроен или имеет значение по умолчанию");
}

if (configErrors.length > 0) {
  console.error("❌ Ошибки конфигурации Firebase:");
  configErrors.forEach((error) => console.error(`  - ${error}`));
  console.error(
    "💡 Проверьте файл .env и убедитесь, что все переменные заполнены правильными значениями из Firebase Console."
  );
  console.error("💡 См. инструкции в FIREBASE_SETUP.md");
}

// Отладочная информация (только в dev режиме)
if (import.meta.env.DEV) {
  console.log("🔥 Firebase конфигурация:", {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apiKey: firebaseConfig.apiKey
      ? `${firebaseConfig.apiKey.substring(0, 10)}...`
      : "❌ НЕ НАЙДЕН",
    appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 20)}...` : "❌ НЕ НАЙДЕН",
    hasAllConfig: !configErrors.length
  });
}

let app;
let auth: Auth;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  if (import.meta.env.DEV) {
    console.log("✅ Firebase успешно инициализирован");
  }
} catch (error) {
  console.error("❌ Ошибка инициализации Firebase:", error);
  if (error instanceof Error) {
    console.error("   Сообщение:", error.message);
  }
  console.error(
    "💡 Проверьте правильность всех значений в .env файле и убедитесь, что Firebase проект активен."
  );
  throw error;
}

export { auth, db };

