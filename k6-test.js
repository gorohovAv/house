import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 250, // 250 виртуальных пользователей
  duration: "30s", // 30 секунд теста
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% запросов < 2 секунды
    http_req_failed: ["rate<0.05"], // < 5% ошибок
  },
};

export default function () {
  // Тестируем фронтенд (Vite dev server)
  const frontendRes = http.get("http://127.0.0.1:5173/", {
    headers: {
      Host: "127.0.0.1:5173",
    },
  });

  check(frontendRes, {
    "frontend status 200": (r) => r.status === 200,
    "frontend response time < 2s": (r) => r.timings.duration < 2000,
    "frontend has HTML content": (r) => r.body.includes('<div id="root">'),
    "frontend has React script": (r) => r.body.includes("main.tsx"),
  });

  // Тестируем бэкенд API
  const apiRes = http.get("http://127.0.0.1:8080/api/results", {
    headers: {
      "Content-Type": "application/json",
    },
  });

  check(apiRes, {
    "api status 200": (r) => r.status === 200,
    "api response time < 1s": (r) => r.timings.duration < 1000,
    "api returns JSON": (r) =>
      r.headers["Content-Type"].includes("application/json"),
    "api has results array": (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch {
        return false;
      }
    },
  });

  // Тестируем HTML страницу бэкенда
  const htmlRes = http.get("http://127.0.0.1:8080/", {
    headers: {
      "Content-Type": "text/html",
    },
  });

  check(htmlRes, {
    "html page status 200": (r) => r.status === 200,
    "html page response time < 1s": (r) => r.timings.duration < 1000,
    "html page has content": (r) => r.body.length > 0,
  });

  // Случайно тестируем создание результата (POST запрос)
  if (Math.random() < 0.3) {
    // 30% запросов будут POST
    const postData = JSON.stringify({
      name: `Test Construction ${Math.floor(Math.random() * 1000)}`,
      planned_duration: Math.floor(Math.random() * 365) + 30,
      planned_cost: Math.floor(Math.random() * 1000000) + 100000,
      actual_duration: Math.floor(Math.random() * 365) + 30,
      actual_cost: Math.floor(Math.random() * 1000000) + 100000,
    });

    const postRes = http.post("http://127.0.0.1:8080/api/results", postData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    check(postRes, {
      "post status 201": (r) => r.status === 201,
      "post response time < 2s": (r) => r.timings.duration < 2000,
      "post returns JSON": (r) =>
        r.headers["Content-Type"].includes("application/json"),
    });
  }

  // Не ждем между запросами - тестируем именно одновременную загрузку
  sleep(0);
}
