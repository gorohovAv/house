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
  const res = http.get("http://127.0.0.1:5173/", {
    headers: {
      Host: "127.0.0.1:5173",
    },
  });
  check(res, {
    "is status 200": (r) => r.status === 200,
    "response time < 2s": (r) => r.timings.duration < 2000,
    "has HTML content": (r) => r.body.includes('<div id="root">'),
    "has React script": (r) => r.body.includes("main.tsx"),
  });

  // Не ждем между запросами - тестируем именно одновременную загрузку
  sleep(0);
}
