import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 5,
  duration: "30s",
};

export default function bacaanKuisSmokeTest() {
  const res = http.get("http://localhost:8080/api/admin/readings");

  check(res, {
    "readings endpoint returns 200": (response) => response.status === 200,
  });
}
