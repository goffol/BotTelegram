import fetch from "node-fetch";

async function test() {
  const url = "https://gtccheats.xyz/Api/uidbypassapi/api_user.php?action=add";
  const key = "GTCAPI-63ACFCFD665A1386F25D198C2310744C";

  console.log("--- TEST ACTION ADD ---");
  let r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": key },
    body: JSON.stringify({ uid: "12345678" })
  });
  console.log(r.status, await r.text());
}
test();
