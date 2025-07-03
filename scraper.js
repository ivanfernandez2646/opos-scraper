// scraper.ts o scraper.js
import axios from "axios";
import * as cheerio from "cheerio";
import qs from "qs";
import { sendTelegramMessage } from "./telegram.js";

async function fetchFirstTestScores() {
  try {
    const { data: html } = await axios.request(getRequestConfig());

    const $ = cheerio.load(html);
    const results = [];
    const uniqueLinks = new Set();

    $("a").each((_, el) => {
      const href = $(el).attr("href") || "";
      const regex = /puntuaciones(_definitivas)?(_superado)?_primera_prueba/;

      if (regex.test(href) && !uniqueLinks.has(href)) {
        uniqueLinks.add(href);
        // Go up to the parent <tr>
        const tr = $(el).closest("tr");
        // Find the third <td> (Title column)
        const tdTitle = tr.find("td").eq(2);
        // Find the <a> inside that <td> and extract the text
        const title = tdTitle.find("a").text().trim();
        results.push({
          title,
          url: href,
        });
      }
    });

    if (results.length === 0) {
      console.log(
        `[${new Date().toLocaleString()}] ❌ No se encontraron ficheros de puntuaciones de primera prueba.`
      );
    } else {
      console.log(`[${new Date().toLocaleString()}] ✅ Ficheros encontrados:`);
      results.forEach((res) => {
        console.log(`- ${res.title} → ${res.url}`);
      });
      // Send to Telegram
      let message = `[${new Date().toLocaleString()}] ✅ Ficheros encontrados:\n`;
      results.forEach((res) => {
        message += `- ${res.title} → ${res.url}\n`;
      });
      await sendTelegramMessage(message);
    }
  } catch (err) {
    console.error("❗ Error durante el scraping:", err.message);
  }
}

async function main() {
  await fetchFirstTestScores();
}

function getRequestConfig() {
  let data = qs.stringify({
    cuerpos_lista: "0590",
    especialidades_lista: "225", // 225
    tribunales_lista: "04", // 04
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://servicios.educarm.es/admin/index2.php?aplicacion=PUBLICACIONES_TRIBUNALES&module=publicacionesTribunales&action=getPublicaciones&anyo=2025&convocatoria=OPOSEC25",
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.8",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://servicios.educarm.es",
      priority: "u=0, i",
      referer:
        "https://servicios.educarm.es/admin/index2.php?aplicacion=PUBLICACIONES_TRIBUNALES&module=publicacionesTribunales&anyo=2025&convocatoria=OPOSEC25",
      "sec-ch-ua": '"Brave";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "sec-gpc": "1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
      Cookie:
        "PHPSESSID=nv8s21khsnsu2ckbifj0rd2sp4; BIGipServerpool.Educacion.https=692278419.47873.0000; visid_incap_3073918=gwQ1q5KYSMeZM5ru53mCMpFGZGgAAAAAQUIPAAAAAADTylYNpCQWTtf1MvUBVlTl; incap_ses_255_3073918=uWW6bwXOJxpdKYdmkfGJAz1GZmgAAAAAQv2xCObTak4iw1rrhZFkNw==; incap_ses_255_3073918=a51MAnC3cwP5M55mkfGJA7BJZmgAAAAAtf7V+A6+A3YzcslhNXkMUg==; visid_incap_3073918=oD/f0wvDR96b4XThj5J3N+VGZmgAAAAAQUIPAAAAAAB0SZuvJZp0qjhpsYOGMj4D; BIGipServerpool.Educacion.https=692278419.47873.0000; PHPSESSID=3t1pbb5umh0hsmav3600a64go1",
    },
    data: data,
  };

  return config;
}

main();
