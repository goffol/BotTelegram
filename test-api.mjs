import fetch from "node-fetch";

async function test() {
  const url = "https://gtccheats.xyz/Api/uidbypassapi/api_user.php?action=change_uid";
  const key = "GTCAPI-63ACFCFD665A1386F25D198C2310744C";

  // Test 1: JSON
  console.log("--- TEST 1: JSON ---");
  let r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": key },
    body: JSON.stringify({ old_uid: "12345678", new_uid: "12345679" })
  });
  console.log(r.status, await r.text());

  // Test 2: URLSearchParams
  console.log("--- TEST 2: URLSearchParams ---");
  const params = new URLSearchParams();
  params.append("old_uid", "12345678");
  params.append("new_uid", "12345679");
  
  r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-API-KEY": key },
    body: params.toString()
  });
  console.log(r.status, await r.text());
}
test();
